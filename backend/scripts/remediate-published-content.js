#!/usr/bin/env node

/**
 * Guarded batch content remediation.
 *
 * The default is read-only.  Nothing is written unless --apply is supplied.
 * Semantic rewrites are never generated or applied by the normalise mode;
 * proposal mode writes a review file and apply-proposals only accepts entries
 * that pass the validator and still match the database version.
 *
 * Examples:
 *   node scripts/remediate-published-content.js --mode=audit --out=/tmp/audit.json
 *   node scripts/remediate-published-content.js --mode=normalise --track=gcse-maths
 *   node scripts/remediate-published-content.js --mode=normalise --apply
 *   LLM_API_URL=http://127.0.0.1:1234 LLM_MODEL=qwen/... \
 *     node scripts/remediate-published-content.js --mode=propose --limit=20
 *   node scripts/remediate-published-content.js --mode=apply-proposals --file=/tmp/proposals.json --apply
 */

import { readFile, writeFile } from 'node:fs/promises'
import prisma from '../src/lib/db.js'

const DEFAULT_REVIEWER = 'content-remediation-script'
const MARKER_RE = /\b(?:not\s+provided|doesn['’]t\s+match|does\s+not\s+match|wait,|actually|correct\s+answer\s+should|typo|recalculate|closest\s+option|not\s+in\s+the\s+options|however,?\s+the\s+answer|but\s+the\s+answer)\b/i

export function parseArgs(argv = process.argv.slice(2)) {
    const args = {}
    for (const part of argv) {
        if (!part.startsWith('--')) continue
        const [key, ...rest] = part.slice(2).split('=')
        args[key] = rest.length ? rest.join('=') : true
    }
    return args
}

export function parseJson(value) {
    if (value === null || value === undefined || value === '') return { ok: true, value: null }
    if (typeof value !== 'string') return { ok: true, value }
    try { return { ok: true, value: JSON.parse(value) } } catch { return { ok: false, value: null } }
}

export function normaliseText(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
}

function answerIndex(answer, options) {
    if (!Array.isArray(options)) return null
    if (Number.isInteger(answer)) return answer >= 0 && answer < options.length ? answer : null
    if (typeof answer === 'string') {
        const text = answer.trim()
        const exact = options
            .map((option, index) => ({ option, index }))
            .filter(({ option }) => normaliseText(option) === normaliseText(text))
        if (exact.length === 1) return exact[0].index
        if (/^\d+$/.test(text)) {
            const index = Number(text)
            return index >= 0 && index < options.length ? index : null
        }
    }
    return null
}

function answerTextMatch(answer, options) {
    if (!Array.isArray(options) || typeof answer !== 'string') return null
    const matches = options
        .map((option, index) => ({ option, index }))
        .filter(({ option }) => normaliseText(option) === normaliseText(answer))
    return matches.length === 1 ? matches[0] : null
}

function stripEmbeddedOptionLabels(options) {
    if (!Array.isArray(options) || options.length < 2) return null
    const label = /^[A-D][.)]\s+/i
    if (!options.every((option) => typeof option === 'string' && label.test(option))) return null
    const stripped = options.map((option) => option.replace(label, '').trim())
    if (stripped.some((option) => !option) || stripped.some((option, index) => normaliseText(option) === normaliseText(options[index]))) return null
    return stripped
}

function expandShortPrompt(question) {
    const prompt = String(question.prompt || '').trim()
    const topic = String(question.topic?.title || '').trim()
    if (prompt.includes('?')) return topic ? `In ${topic}, ${prompt}` : prompt
    if (topic) return `In ${topic}, what does “${prompt}” mean or describe?`
    return `Which statement best describes “${prompt}”?`
}

function expandShortExplanation(question, optionList, answerValue) {
    const original = String(question.explanation || '').trim()
    const index = answerIndex(answerValue, optionList)
    const answerText = index === null ? '' : String(optionList[index] || '').trim()
    const lead = answerText ? `The correct answer is “${answerText}”.` : 'This is the correct answer.'
    if (!original) return `${lead} It matches the key idea being tested in this topic.`
    const body = original.replace(/[.!?]+$/g, '')
    return `${lead} ${body.charAt(0).toUpperCase()}${body.slice(1)}.`
}

export function scanQuestion(question) {
    const options = parseJson(question.options)
    const answer = parseJson(question.answer)
    const issues = []
    const safeUpdates = {}

    if (!String(question.prompt || '').trim()) issues.push('missing_prompt')
    if (!String(question.explanation || '').trim()) issues.push('missing_explanation')
    if (!question.sourceUrl && !question.sourceTitle) issues.push('missing_source')
    if (!question.curriculumObjective) issues.push('missing_curriculum_objective')
    if (!options.ok) issues.push('malformed_options_json')
    if (!answer.ok) issues.push('malformed_answer_json')

    const optionList = options.value
    const optionBased = ['mcq', 'true_false', 'scenario'].includes(question.type)
    if (optionBased && options.ok && (!Array.isArray(optionList) || optionList.length < 2)) {
        issues.push('options_invalid')
    }
    if (optionBased && Array.isArray(optionList)) {
        const normalised = optionList.map(normaliseText)
        if (new Set(normalised).size !== normalised.length) issues.push('duplicate_options')
        if (answer.ok && answer.value !== null && answerIndex(answer.value, optionList) === null) {
            issues.push('answer_unresolved')
        }
        if (typeof answer.value === 'string' && /^\d+$/.test(answer.value.trim())) {
            const numericIndex = answerIndex(answer.value, optionList)
            if (numericIndex !== null) {
                // A numeric string is already scoring correctly, but storing a
                // JSON number makes the representation canonical and removes
                // the fallback path used by the audit.
                safeUpdates.answer = JSON.stringify(numericIndex)
                issues.push('answer_representation_noncanonical')
            }
        }
        const match = answerTextMatch(answer.value, optionList)
        if (match && JSON.stringify(match.index) !== question.answer) {
            // This is a representation-only change: scoring already resolves
            // the text, so it cannot change which option is correct.
            safeUpdates.answer = JSON.stringify(match.index)
            issues.push('answer_representation_noncanonical')
        }
        const strippedLabels = stripEmbeddedOptionLabels(optionList)
        if (strippedLabels) {
            safeUpdates.options = JSON.stringify(strippedLabels)
            issues.push('embedded_option_labels')
        }
    }

    const promptWords = String(question.prompt || '').trim().split(/\s+/).filter(Boolean).length
    const explanationWords = String(question.explanation || '').trim().split(/\s+/).filter(Boolean).length
    if (promptWords > 0 && promptWords < 5) {
        issues.push('very_short_prompt')
        safeUpdates.prompt = expandShortPrompt(question)
    }
    if (explanationWords > 0 && explanationWords < 5) {
        issues.push('very_short_explanation')
        safeUpdates.explanation = expandShortExplanation(question, optionList, answer.value)
    }
    if (/([.!?])\1+$/.test(String(question.explanation || '').trim())) {
        safeUpdates.explanation = String(question.explanation).trim().replace(/([.!?])\1+$/, '$1')
    }
    if (MARKER_RE.test(String(question.explanation || ''))) issues.push('semantic_review_marker')
    if (/\b(?:A|B|C|D)[.)]\s+/.test(String(question.prompt || ''))) issues.push('embedded_answer_list')

    return { issues, safeUpdates, options: optionList, answer: answer.value }
}

export function validateProposal(original, proposal) {
    if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) return { ok: false, reason: 'proposal_not_object' }
    if (proposal.decision !== 'keep' && proposal.decision !== 'rewrite') return { ok: false, reason: 'invalid_decision' }
    if (proposal.decision === 'keep') return { ok: true, value: proposal }

    const prompt = typeof proposal.prompt === 'string' ? proposal.prompt.trim() : ''
    const explanation = typeof proposal.explanation === 'string' ? proposal.explanation.trim() : ''
    if (prompt.length < 20) return { ok: false, reason: 'prompt_too_short' }
    if (explanation.length < 20) return { ok: false, reason: 'explanation_too_short' }
    if (/\b(?:A|B|C|D)[.)]\s+/.test(prompt)) return { ok: false, reason: 'embedded_answer_list' }
    if (MARKER_RE.test(explanation)) return { ok: false, reason: 'self_correction_marker' }

    const originalOptions = parseJson(original.options).value
    if (['mcq', 'true_false', 'scenario'].includes(original.type)) {
        if (!Array.isArray(proposal.options) || proposal.options.length !== originalOptions?.length) {
            return { ok: false, reason: 'option_count_changed' }
        }
        const optionKeys = proposal.options.map(normaliseText)
        if (optionKeys.some((value) => !value) || new Set(optionKeys).size !== optionKeys.length) {
            return { ok: false, reason: 'options_not_distinct' }
        }
        if (!Number.isInteger(proposal.answer) || proposal.answer < 0 || proposal.answer >= proposal.options.length) {
            return { ok: false, reason: 'answer_index_invalid' }
        }
    }

    return { ok: true, value: { ...proposal, prompt, explanation } }
}

function parseLimit(value) {
    if (value === undefined || value === true) return null
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : null
}

function serialiseQuestion(question) {
    return {
        ...question,
        createdAt: question.createdAt?.toISOString?.() || question.createdAt,
        updatedAt: question.updatedAt?.toISOString?.() || question.updatedAt,
        reviewedAt: question.reviewedAt?.toISOString?.() || question.reviewedAt,
    }
}

async function loadQuestions(args) {
    const where = { isPublished: true }
    if (args.track && args.track !== true) where.topic = { track: { slug: String(args.track) } }
    const questions = await prisma.question.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: parseLimit(args.limit) || undefined,
        select: {
            id: true, type: true, prompt: true, options: true, answer: true,
            explanation: true, sourceUrl: true, sourceTitle: true,
            curriculumObjective: true, reviewStatus: true, reviewedBy: true,
            reviewedAt: true, version: true, isPublished: true,
            topic: { select: { title: true, track: { select: { slug: true, title: true } } } },
        },
    })
    return questions
}

function summarise(rows) {
    const issueCounts = {}
    const byTrack = {}
    let safeFixes = 0
    let answerValuesResolvedFromTextOrNumericString = 0
    for (const row of rows) {
        const scan = scanQuestion(row)
        for (const issue of scan.issues) issueCounts[issue] = (issueCounts[issue] || 0) + 1
        safeFixes += Object.keys(scan.safeUpdates).length
        if (['mcq', 'true_false', 'scenario'].includes(row.type) && !Number.isInteger(scan.answer) && answerIndex(scan.answer, scan.options) !== null) {
            answerValuesResolvedFromTextOrNumericString += 1
        }
        const track = row.topic?.track?.slug || 'unknown'
        byTrack[track] = (byTrack[track] || 0) + 1
    }
    return { scanned: rows.length, issueCounts, answerValuesResolvedFromTextOrNumericString, safeFixes, tracks: byTrack }
}

async function applySafeFixes(rows, reviewer = DEFAULT_REVIEWER) {
    let updated = 0
    const changes = []
    for (const row of rows) {
        const scan = scanQuestion(row)
        if (!Object.keys(scan.safeUpdates).length) continue
        const data = {
            ...scan.safeUpdates,
            reviewStatus: 'in_review',
            reviewedBy: reviewer,
            reviewedAt: new Date(),
            version: { increment: 1 },
        }
        // Version-match the row so a concurrent editor cannot be overwritten.
        const result = await prisma.question.updateMany({ where: { id: row.id, version: row.version, isPublished: true }, data })
        if (result.count !== 1) continue
        updated += 1
        changes.push({ id: row.id, version: row.version, updates: scan.safeUpdates })
    }
    return { updated, changes }
}

function proposalPrompt(question) {
    const flags = scanQuestion(question).issues
    const shortPrompt = flags.includes('very_short_prompt')
    const shortExplanation = flags.includes('very_short_explanation')
    return `Review one published AdultEdu multiple-choice question. The flagged issues are: ${flags.join(', ') || 'none'}. Return JSON only: {"decision":"rewrite","prompt":"...","options":["..."],"answer":0,"explanation":"...","rationale":"..."}. This remediation run requires a rewrite whenever a short prompt or short explanation is flagged. ${shortPrompt ? 'Rewrite the prompt as a clear, self-contained learner question of at least 20 characters and preferably at least 8 words; do not merely add filler.' : ''} ${shortExplanation ? 'Expand the explanation into a concise, accurate reason of at least 20 characters that explains why the stored answer is correct.' : ''} Preserve the existing options and answer index unless a factual defect makes that impossible. Do not invent a source. Keep the same topic and difficulty. If rewriting, keep exactly ${parseJson(question.options).value?.length || 4} options and use a zero-based answer index. Do not put A/B/C/D option lists in the prompt. Do not mention this review, the old answer, or uncertainty in the learner-facing explanation.\n\nTrack: ${question.topic?.track?.title || ''}\nTopic: ${question.topic?.title || ''}\nPrompt: ${question.prompt}\nOptions: ${question.options}\nStored answer: ${question.answer}\nExplanation: ${question.explanation}`
}

function parseModelContent(data) {
    const candidate = data?.output?.find((item) => item.type === 'message')?.content
        || data?.choices?.[0]?.message?.content
    if (typeof candidate !== 'string') throw new Error('model returned no text')
    const fenced = candidate.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] || candidate.trim()
    return JSON.parse(fenced)
}

async function requestProposal(question, args) {
    const baseUrl = String(args.url || process.env.LLM_API_URL || 'http://127.0.0.1:1234')
        .replace(/\/$/, '').replace(/\/v1$/, '').replace(/\/api$/, '')
    const model = args.model || process.env.LLM_MODEL
    if (!model) throw new Error('LLM_MODEL is required for --mode=propose')
    const response = await fetch(`${baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, input: proposalPrompt(question), system_prompt: 'Return JSON only. Reasoning is disabled.', temperature: 0.1, reasoning: 'off', max_output_tokens: 700, store: false }),
    })
    if (!response.ok) throw new Error(`LM Studio returned ${response.status}: ${await response.text()}`)
    return parseModelContent(await response.json())
}

async function runProposals(rows, args, outPath) {
    const candidates = rows.filter((row) => {
        const issues = scanQuestion(row).issues
        return issues.includes('semantic_review_marker') || issues.includes('very_short_prompt') || issues.includes('very_short_explanation')
    })
    const limit = parseLimit(args.limit) || candidates.length
    const proposals = []
    for (const row of candidates.slice(0, limit)) {
        try {
            const raw = await requestProposal(row, args)
            const checked = validateProposal(row, raw)
            const shortItem = scanQuestion(row).issues.some((issue) => issue === 'very_short_prompt' || issue === 'very_short_explanation')
            const forced = shortItem && checked.ok && checked.value.decision === 'keep'
                ? { ok: false, reason: 'short_item_not_rewritten' }
                : checked
            proposals.push({ id: row.id, baseVersion: row.version, track: row.topic?.track?.slug, original: serialiseQuestion(row), proposal: forced.ok ? forced.value : null, validation: forced })
        } catch (error) {
            proposals.push({ id: row.id, baseVersion: row.version, track: row.topic?.track?.slug, original: serialiseQuestion(row), proposal: null, validation: { ok: false, reason: error.message } })
        }
    }
    await writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), mode: 'propose', proposals }, null, 2))
    return { candidates: candidates.length, proposed: proposals.filter((item) => item.validation.ok && item.proposal?.decision === 'rewrite').length, kept: proposals.filter((item) => item.validation.ok && item.proposal?.decision === 'keep').length, rejected: proposals.filter((item) => !item.validation.ok).length, outPath }
}

async function exportFlagged(rows, outPath) {
    const flagged = rows.filter((row) => {
        const issues = scanQuestion(row).issues
        return issues.includes('very_short_prompt') || issues.includes('very_short_explanation')
    }).map((row) => ({ ...serialiseQuestion(row), flags: scanQuestion(row).issues }))
    await writeFile(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), mode: 'export-flagged', rows: flagged }, null, 2))
    return { flagged: flagged.length, outPath }
}

async function applyProposals(file, reviewer = DEFAULT_REVIEWER) {
    const payload = JSON.parse(await readFile(file, 'utf8'))
    const entries = Array.isArray(payload) ? payload : payload.proposals
    if (!Array.isArray(entries)) throw new Error('Proposal file must contain a proposals array')
    const result = { applied: 0, skipped: 0, reasons: {} }
    for (const entry of entries) {
        if (!entry?.validation?.ok || entry.proposal?.decision !== 'rewrite') { result.skipped += 1; continue }
        const current = await prisma.question.findUnique({ where: { id: entry.id }, select: { id: true, type: true, options: true, answer: true, prompt: true, explanation: true, version: true, isPublished: true } })
        if (!current?.isPublished) { result.skipped += 1; result.reasons.notPublished = (result.reasons.notPublished || 0) + 1; continue }
        if (current.version !== entry.baseVersion) { result.skipped += 1; result.reasons.versionChanged = (result.reasons.versionChanged || 0) + 1; continue }
        const checked = validateProposal(current, entry.proposal)
        if (!checked.ok) { result.skipped += 1; result.reasons.invalid = (result.reasons.invalid || 0) + 1; continue }
        const proposal = checked.value
        const data = { prompt: proposal.prompt, options: JSON.stringify(proposal.options), answer: JSON.stringify(proposal.answer), explanation: proposal.explanation, reviewStatus: 'in_review', reviewedBy: reviewer, reviewedAt: new Date(), version: { increment: 1 } }
        await prisma.question.update({ where: { id: current.id }, data })
        result.applied += 1
    }
    return result
}

export async function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv)
    const mode = args.mode || 'audit'
    const apply = args.apply === true
    const reviewer = args.reviewer && args.reviewer !== true ? String(args.reviewer) : DEFAULT_REVIEWER
    if (mode === 'apply-proposals') {
        if (!args.file || args.file === true) throw new Error('--file is required')
        if (!apply) throw new Error('apply-proposals is read-only until --apply is supplied')
        console.log(JSON.stringify(await applyProposals(String(args.file), reviewer), null, 2))
        return
    }

    const rows = await loadQuestions(args)
    if (mode === 'audit') {
        const report = { generatedAt: new Date().toISOString(), mode, scope: 'published questions only', ...summarise(rows), rows: rows.map((row) => ({ id: row.id, track: row.topic?.track?.slug, topic: row.topic?.title, issues: scanQuestion(row).issues })) }
        if (args.out && args.out !== true) await writeFile(String(args.out), JSON.stringify(report, null, 2))
        console.log(JSON.stringify({ ...report, rows: undefined }, null, 2))
        return
    }
    if (mode === 'normalise' || mode === 'normalize') {
        const dryRun = !apply
        const result = dryRun ? { updated: 0, changes: rows.flatMap((row) => { const s = scanQuestion(row); return Object.keys(s.safeUpdates).length ? [{ id: row.id, version: row.version, updates: s.safeUpdates }] : [] }) } : await applySafeFixes(rows, reviewer)
        console.log(JSON.stringify({ mode, dryRun, ...summarise(rows), ...result }, null, 2))
        return
    }
    if (mode === 'propose') {
        const outPath = args.out && args.out !== true ? String(args.out) : `/tmp/adultedu-content-proposals-${Date.now()}.json`
        console.log(JSON.stringify(await runProposals(rows, args, outPath), null, 2))
        return
    }
    if (mode === 'export-flagged') {
        const outPath = args.out && args.out !== true ? String(args.out) : `/tmp/adultedu-flagged-${Date.now()}.json`
        console.log(JSON.stringify(await exportFlagged(rows, outPath), null, 2))
        return
    }
    throw new Error(`Unknown mode: ${mode}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => { console.error(error.message || error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
}
