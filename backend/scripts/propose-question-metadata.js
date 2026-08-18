#!/usr/bin/env node

/**
 * Batch source/objective metadata proposals for legacy published questions.
 *
 * Read-only by default. The model may choose only an approved source from the
 * track map and an outcome already linked to the question's topic. It cannot
 * invent a URL or objective. The output is a proposal report; production
 * metadata is never changed by this script.
 *
 * Run from backend:
 *   node scripts/propose-question-metadata.js --limit=100
 *   node scripts/propose-question-metadata.js --track=gcse-maths --apply-approved --file=...
 *
 * `--apply-approved` is intentionally explicit and only applies records with
 * `approved: true` in a prior report. It never publishes or approves a question.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import prisma from '../src/lib/db.js'

const DEFAULT_ORIGIN = 'http://127.0.0.1:1234'
const DEFAULT_MODEL = 'qwen/qwen3.8-27b'
const DEFAULT_MAP = path.resolve('content-specs/legacy-source-objective-plan-2026-08-17.json')
const DEFAULT_SPECS_DIR = path.resolve('content-specs')
const DEFAULT_TOPIC_MAP = path.resolve('content-specs/legacy-topic-objectives-2026-08-17.json')

const SPEC_TRACKS = {
    'essential-digital-skills': ['Essential Digital Skills'],
    'functional-skills-maths': ['Functional Skills Maths'],
    'functional-skills-english': ['Functional Skills English'],
    'gcse-maths': ['GCSE Mathematics'],
    'gcse-english-language': ['GCSE English Language'],
    'gcse-english-literature': ['GCSE subjects'],
    'gcse-biology': ['GCSE subjects'],
    'gcse-chemistry': ['GCSE subjects'],
    'gcse-physics': ['GCSE subjects'],
    'gcse-geography': ['GCSE subjects'],
    'gcse-history': ['GCSE subjects'],
}

const SPEC_UNIT_PREFIXES = {
    'gcse-english-literature': 'English Literature',
    'gcse-biology': 'Biology',
    'gcse-chemistry': 'Chemistry',
    'gcse-physics': 'Physics',
    'gcse-geography': 'Geography',
    'gcse-history': 'History',
}

export function parseArgs(argv = process.argv.slice(2)) {
    const result = {}
    for (const part of argv) {
        if (!part.startsWith('--')) continue
        const [key, ...rest] = part.slice(2).split('=')
        result[key] = rest.length ? rest.join('=') : true
    }
    return result
}

function positiveInt(value, fallback) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseJson(value) {
    if (value === null || value === undefined || value === '') return null
    if (typeof value !== 'string') return value
    try { return JSON.parse(value) } catch { return null }
}

function normalise(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')
}

export async function loadSpecificationObjectives(directory = DEFAULT_SPECS_DIR) {
    const result = {}
    const files = (await readdir(directory)).filter((file) => file.endsWith('.json'))
    for (const file of files) {
        let spec
        try { spec = JSON.parse(await readFile(path.join(directory, file), 'utf8')) } catch { continue }
        if (!Array.isArray(spec?.units) || !spec.subject) continue
        const tracks = Object.entries(SPEC_TRACKS).filter(([, names]) => names.includes(spec.subject)).map(([track]) => track)
        for (const track of tracks) {
            result[track] ||= []
            const prefix = SPEC_UNIT_PREFIXES[track]
            const units = prefix ? spec.units.filter((unit) => String(unit.title).startsWith(`${prefix}:`)) : spec.units
            for (const unit of units) {
                for (const objective of unit.objectives || []) {
                    if (!objective?.code || !(objective.text || objective.description)) continue
                    result[track].push({
                        code: objective.code,
                        text: objective.text || objective.description,
                        unitTitle: unit.title,
                        unitKey: normalise(unit.title),
                        unitTopicKey: normalise(String(unit.title).includes(':') ? String(unit.title).split(':').slice(1).join(':') : unit.title),
                    })
                }
            }
        }
    }
    return result
}

export async function loadLegacyTopicObjectives(file = DEFAULT_TOPIC_MAP) {
    const source = JSON.parse(await readFile(file, 'utf8'))
    const result = {}
    for (const [track, topics] of Object.entries(source.tracks || {})) {
        result[track] = Object.entries(topics).map(([title, objective]) => ({
            code: objective.code,
            text: objective.text,
            unitTitle: title,
            unitKey: normalise(title),
            unitTopicKey: normalise(title),
        }))
    }
    return result
}

export function specificationCandidates(question, specificationObjectives = {}) {
    const track = question.topic.track.slug
    const topicKey = normalise(question.topic.title)
    const topicTokens = topicKey.split(' ').filter((token) => token.length >= 6)
    const topicPrefix = topicKey.split(' ').slice(0, 2).join(' ')
    const all = specificationObjectives[track] || []
    const exactMatches = all.filter((objective) => (objective.unitTopicKey || objective.unitKey) === topicKey)
    if (exactMatches.length) return [...new Map(exactMatches.map((candidate) => [candidate.code, candidate])).values()]
    const prefixMatches = all.filter((objective) => {
        const unitKey = objective.unitTopicKey || objective.unitKey
        return unitKey.startsWith(topicPrefix)
    })
    const candidates = (prefixMatches.length ? prefixMatches : all.filter((objective) => {
        const unitKey = objective.unitTopicKey || objective.unitKey
        return unitKey.includes(topicKey) || topicTokens.some((token) => unitKey.includes(token))
    }))
    return [...new Map(candidates.map((candidate) => [candidate.code, candidate])).values()]
}

export function candidateObjectives(question, specificationObjectives = {}) {
    const candidates = specificationCandidates(question, specificationObjectives)
    if (candidates.length) return candidates
    return question.topic.topicOutcomes.map((link) => ({ code: link.outcome.code, text: link.outcome.description || link.outcome.title, unitTitle: null }))
}

function responseContent(data) {
    return data?.output?.find((item) => item.type === 'message')?.content
        || data?.choices?.[0]?.message?.content
        || ''
}

function parseModelJson(content) {
    const text = String(content || '').trim()
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] || text
    const parsed = JSON.parse(fenced)
    return Array.isArray(parsed) ? parsed : parsed?.items
}

export function validateMetadataItems(items, questions, plan, specificationObjectives = {}) {
    if (!Array.isArray(items) || items.length !== questions.length) {
        throw new Error(`Model returned ${Array.isArray(items) ? items.length : 'non-array'} metadata items; expected ${questions.length}.`)
    }

    const expectedIds = new Set(questions.map((question) => question.id))
    const seen = new Set()
    const validated = []
    for (const item of items) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Metadata item is not an object.')
        if (!expectedIds.has(item.id) || seen.has(item.id)) throw new Error('Metadata item has an unknown or duplicate question id.')
        seen.add(item.id)
        if (!['match', 'needs_human'].includes(item.decision)) throw new Error(`Invalid metadata decision for ${item.id}.`)

        const question = questions.find((candidate) => candidate.id === item.id)
        const trackPlan = plan.tracks[question.topic.track.slug]
        if (item.decision === 'needs_human') {
            validated.push({ id: item.id, decision: item.decision, reason: String(item.reason || 'No defensible objective match.').trim(), approved: false })
            continue
        }
        if (!trackPlan?.sources?.length) throw new Error(`No approved source map exists for ${question.topic.track.slug}.`)
        if (!Number.isInteger(item.sourceIndex) || item.sourceIndex < 0 || item.sourceIndex >= trackPlan.sources.length) {
            throw new Error(`Invalid sourceIndex for ${item.id}.`)
        }
        const outcomes = candidateObjectives(question, specificationObjectives)
        const objective = outcomes.find((candidate) => candidate.code === item.objectiveCode)
        if (!objective) throw new Error(`Objective ${item.objectiveCode} is not linked to topic ${question.topic.title}.`)
        const objectiveText = objective.text || objective.description || objective.title
        if (!objectiveText?.trim()) throw new Error(`Objective ${item.objectiveCode} has no usable text.`)
        validated.push({
            id: item.id,
            decision: 'match',
            sourceIndex: item.sourceIndex,
            source: trackPlan.sources[item.sourceIndex],
            objective: { code: objective.code, text: objectiveText },
            reason: String(item.reason || '').trim(),
            approved: item.approved === true,
        })
    }
    if (seen.size !== questions.length) throw new Error('Model omitted one or more question ids.')
    return validated
}

function questionForPrompt(question) {
    return {
        id: question.id,
        prompt: question.prompt,
        options: parseJson(question.options),
        answer: parseJson(question.answer),
        explanation: question.explanation,
    }
}

export function metadataPrompt(questions, plan, specificationObjectives = {}) {
    const track = questions[0].topic.track
    const trackPlan = plan.tracks[track.slug]
    const groupedOutcomes = [...new Map(questions.flatMap((question) => candidateObjectives(question, specificationObjectives).map((outcome) => [outcome.code, outcome])).map(([code, outcome]) => [code, outcome])).values()]
        .map((outcome) => ({ code: outcome.code, text: outcome.text || outcome.description || outcome.title, unitTitle: outcome.unitTitle || null }))
    return [
        'Return JSON only as an array with exactly one item per question id.',
        'For each question decide whether one linked curriculum outcome is a defensible match for what the prompt tests.',
        'Use decision "match" only when the outcome clearly covers the question and its answer; otherwise use "needs_human".',
        'Never invent a source URL, source title, objective code, or objective wording.',
        `For a match, return {"id":"...","decision":"match","sourceIndex":0,"objectiveCode":"...","reason":"short evidence"}.`,
        'For needs_human return {"id":"...","decision":"needs_human","reason":"short reason"}. Do not mark anything approved.',
        `Track: ${track.title} (${track.slug})`,
        `Approved sources: ${JSON.stringify(trackPlan?.sources || [])}`,
        `Linked topic outcomes: ${JSON.stringify(groupedOutcomes)}`,
        `Questions: ${JSON.stringify(questions.map(questionForPrompt))}`,
    ].join('\n\n')
}

async function requestMetadata(questions, plan, origin, model, specificationObjectives) {
    const body = {
        model,
        input: metadataPrompt(questions, plan, specificationObjectives),
        system_prompt: 'You are a cautious curriculum metadata reviewer. Reasoning is disabled. Return JSON only.',
        temperature: 0.05,
        max_output_tokens: Math.max(500, questions.length * 100),
        store: false,
    }
    // LM Studio rejects the reasoning field for the coder model; that model
    // has no exposed reasoning toggle, so omission is the correct setting.
    if (!/coder/i.test(model)) body.reasoning = 'off'
    const response = await fetch(`${origin.replace(/\/$/, '')}/api/v1/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000),
    })
    if (!response.ok) throw new Error(`LM Studio ${response.status}: ${await response.text()}`)
    const items = parseModelJson(responseContent(await response.json()))
    return validateMetadataItems(items, questions, plan, specificationObjectives)
}

async function loadQuestions(options) {
    const where = {
        isPublished: true,
        OR: [
            { sourceUrl: null },
            { sourceTitle: null },
            { curriculumObjective: null },
        ],
    }
    if (options.track && options.track !== true) where.topic = { track: { slug: String(options.track) } }
    return prisma.question.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: positiveInt(options.limit, undefined),
        select: {
            id: true, type: true, prompt: true, options: true, answer: true, explanation: true,
            version: true, sourceUrl: true, sourceTitle: true, curriculumObjective: true,
            topic: {
                select: {
                    id: true, title: true,
                    track: { select: { slug: true, title: true } },
                    topicOutcomes: { select: { outcome: { select: { code: true, title: true, description: true } } } },
                },
            },
        },
    })
}

async function applyApproved(report, reviewer = 'metadata-batch-script') {
    let updated = 0
    const skipped = []
    for (const record of report.records || []) {
        if (record.decision !== 'match' || record.approved !== true) continue
        const question = report.questions?.find((candidate) => candidate.id === record.id)
        if (!question) { skipped.push({ id: record.id, reason: 'question snapshot missing' }); continue }
        const data = {
            sourceUrl: record.source.url,
            sourceTitle: record.source.title,
            sourceCheckedAt: new Date(),
            curriculumObjective: record.objective.text,
            sourceMeta: JSON.stringify({ metadataMethod: 'batch-reviewed', objectiveCode: record.objective.code, sourceMap: report.sourceMap }),
            reviewStatus: 'in_review',
            reviewedBy: reviewer,
            reviewedAt: new Date(),
            version: { increment: 1 },
        }
        const result = await prisma.question.updateMany({ where: { id: question.id, version: question.version, isPublished: true }, data })
        if (result.count === 1) updated += 1
        else skipped.push({ id: question.id, reason: 'version changed or no longer published' })
    }
    return { updated, skipped }
}

async function main(argv = process.argv.slice(2)) {
    const options = parseArgs(argv)
    const mapPath = options.map && options.map !== true ? String(options.map) : DEFAULT_MAP
    const plan = JSON.parse(await readFile(mapPath, 'utf8'))
    const specsDir = options['specs-dir'] && options['specs-dir'] !== true ? String(options['specs-dir']) : DEFAULT_SPECS_DIR
    const specificationObjectives = await loadSpecificationObjectives(specsDir)
    const topicObjectiveMap = options['topic-map'] && options['topic-map'] !== true ? String(options['topic-map']) : DEFAULT_TOPIC_MAP
    const legacyTopicObjectives = await loadLegacyTopicObjectives(topicObjectiveMap)
    for (const [track, objectives] of Object.entries(legacyTopicObjectives)) {
        specificationObjectives[track] = [...(specificationObjectives[track] || []), ...objectives]
    }
    const outPath = options.out && options.out !== true ? String(options.out) : path.resolve(`content-specs/question-metadata-proposals-${new Date().toISOString().slice(0, 10)}.json`)

    if (options['apply-approved']) {
        const reportPath = options.file && options.file !== true ? String(options.file) : outPath
        const report = JSON.parse(await readFile(reportPath, 'utf8'))
        const result = await applyApproved(report)
        console.log(JSON.stringify({ reportPath, ...result }, null, 2))
        return
    }

    const origin = options.url && options.url !== true ? String(options.url) : (process.env.LLM_API_URL || DEFAULT_ORIGIN)
    const model = options.model && options.model !== true ? String(options.model) : (process.env.LLM_MODEL || DEFAULT_MODEL)
    const batchSize = Math.min(20, positiveInt(options['batch-size'], 10))
    const concurrency = Math.min(8, positiveInt(options.concurrency, 4))
    let questions
    if (options.input && options.input !== true) {
        const snapshot = JSON.parse(await readFile(String(options.input), 'utf8'))
        questions = snapshot.questions || snapshot
    } else {
        questions = await loadQuestions(options)
    }
    if (options.input && options.input !== true) {
        if (options.track && options.track !== true) questions = questions.filter((question) => question.topic.track.slug === String(options.track))
        const offset = options.offset && options.offset !== true ? Math.max(0, Number(options.offset)) : 0
        const limit = options.limit && options.limit !== true ? positiveInt(options.limit, questions.length) : questions.length
        questions = questions.slice(offset, offset + limit)
    }
    const batches = []
    for (let index = 0; index < questions.length;) {
        const first = questions[index]
        const batch = [first]
        index += 1
        while (index < questions.length && batch.length < batchSize && questions[index].topic.track.slug === first.topic.track.slug) {
            batch.push(questions[index++])
        }
        batches.push(batch)
    }
    if (options.deterministic) {
        const records = questions.map((question) => {
            const candidates = specificationCandidates(question, specificationObjectives)
            const trackPlan = plan.tracks[question.topic.track.slug]
            if (candidates.length === 1 && trackPlan?.sources?.length) {
                return {
                    id: question.id,
                    decision: 'match',
                    sourceIndex: 0,
                    source: trackPlan.sources[0],
                    objective: { code: candidates[0].code, text: candidates[0].text },
                    reason: 'Single objective candidate from the checked subject specification; human approval still required.',
                    approved: false,
                }
            }
            return {
                id: question.id,
                decision: 'needs_human',
                reason: candidates.length ? 'Multiple specification objectives require item-level selection.' : 'No checked specification objective matches this topic.',
                approved: false,
            }
        })
        const report = {
            generatedAt: new Date().toISOString(),
            scope: 'published questions missing source/objective metadata',
            sourceMap: path.basename(mapPath),
            objectiveSpecs: Object.fromEntries(Object.entries(specificationObjectives).map(([track, values]) => [track, values.length])),
            model: { origin: null, model: null, reasoning: 'not used; deterministic specification candidate pass' },
            publicationSafety: 'proposal report only; no production rows changed; records require explicit approved:true before application',
            totals: {
                questions: questions.length,
                batches: batches.length,
                matches: records.filter((record) => record.decision === 'match').length,
                needsHuman: records.filter((record) => record.decision === 'needs_human').length,
                approved: 0,
            },
            questions: questions.map((question) => ({ id: question.id, version: question.version, topic: question.topic.title, track: question.topic.track.slug })),
            records,
        }
        await writeFile(outPath, JSON.stringify(report, null, 2))
        console.log(JSON.stringify({ outPath, ...report.totals }, null, 2))
        return
    }
    const results = []
    let cursor = 0
    async function worker() {
        while (cursor < batches.length) {
            const index = cursor++
            const batch = batches[index]
            try {
                const records = await requestMetadata(batch, plan, origin, model, specificationObjectives)
                results.push(...records.map((record) => ({ ...record, batch: index + 1 })))
                process.stderr.write(`Metadata batch ${index + 1}/${batches.length}: ${records.length} questions\n`)
            } catch (error) {
                results.push(...batch.map((question) => ({ id: question.id, decision: 'needs_human', approved: false, batch: index + 1, error: error.message })))
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, batches.length || 1) }, () => worker()))
    const report = {
        generatedAt: new Date().toISOString(),
        scope: 'published questions missing source/objective metadata',
        sourceMap: path.basename(mapPath),
        objectiveSpecs: Object.fromEntries(Object.entries(specificationObjectives).map(([track, values]) => [track, values.length])),
        model: { origin, model, reasoning: 'off' },
        publicationSafety: 'proposal report only; no production rows changed; records require explicit approved:true before application',
        totals: {
            questions: questions.length,
            batches: batches.length,
            matches: results.filter((record) => record.decision === 'match').length,
            needsHuman: results.filter((record) => record.decision === 'needs_human').length,
            approved: results.filter((record) => record.approved === true).length,
        },
        questions: questions.map((question) => ({ id: question.id, version: question.version, topic: question.topic.title, track: question.topic.track.slug })),
        records: results,
    }
    await writeFile(outPath, JSON.stringify(report, null, 2))
    console.log(JSON.stringify({ outPath, ...report.totals }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => { console.error(error); process.exitCode = 1 })
}

export { parseJson, parseModelJson, applyApproved }
