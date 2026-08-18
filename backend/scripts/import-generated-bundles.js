#!/usr/bin/env node

/**
 * Import the generated lesson bundles into the live content model.
 *
 * This is deliberately two-phase:
 *   node scripts/import-generated-bundles.js           # validate only
 *   node scripts/import-generated-bundles.js --apply   # write and publish
 *
 * IDs are deterministic, so an interrupted run can be safely repeated. The
 * generated model review is retained in sourceMeta; publication is still
 * marked in_review internally so learner-facing pages never expose a review
 * label while reports remain available for follow-up.
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import prisma from '../src/lib/db.js'

const TRACK_BY_PREFIX = [
    ['eds-', 'essential-digital-skills'],
    ['fse-', 'functional-skills-english'],
    ['fsm-', 'functional-skills-maths'],
    ['gcse-bio-', 'gcse-biology'],
    ['gcse-chem-', 'gcse-chemistry'],
    ['gcse-eng-', 'gcse-english-language'],
    ['gcse-l2-', 'gcse-maths'],
    ['gcse-lit-', 'gcse-english-literature'],
    ['gcse-phys-', 'gcse-physics'],
]

const EDS_TOPIC_BY_CATEGORY = {
    'Using devices': 'Digital Foundation Skills',
    'Communication': 'Communicating Online',
    'Collaboration': 'Communicating Online',
    'Creating content': 'Handling Information',
    'Digital literacy': 'Handling Information',
    'Finding information': 'Handling Information',
    'Digital problem solving': 'Problem Solving',
    'Transacting': 'Online Transactions',
    'Safety online': 'Being Safe Online',
}

const LIT_TOPIC_BY_ID = {
    'gcse-lit-l2-19th-century-novel': '19th Century Novel',
    'gcse-lit-l2-modern-prose-drama': 'Modern Prose or Drama',
    'gcse-lit-l2-poetry-anthology': 'Poetry Anthology',
    'gcse-lit-l2-shakespeare': 'Shakespeare',
    'gcse-lit-l2-unseen-poetry': 'Unseen Poetry',
}

const SCIENCE_TOPIC_BY_ID = {
    'gcse-bio-l2-bioenergetics': 'Bioenergetics',
    'gcse-bio-l2-cell-biology': 'Cell Biology',
    'gcse-bio-l2-ecology': 'Ecology',
    'gcse-bio-l2-homeostasis': 'Homeostasis',
    'gcse-bio-l2-infection-response': 'Infection and Response',
    'gcse-bio-l2-inheritance-evolution': 'Inheritance and Evolution',
    'gcse-bio-l2-organisation': 'Organisation',
    'gcse-chem-l2-analysis': 'Chemical Analysis',
    'gcse-chem-l2-atomic-structure': 'Atomic Structure',
    'gcse-chem-l2-bonding-structure': 'Bonding and Structure',
    'gcse-chem-l2-chemical-changes': 'Chemical Changes',
    'gcse-chem-l2-energy-changes': 'Energy Changes',
    'gcse-chem-l2-organic': 'Organic Chemistry',
    'gcse-chem-l2-quantitative': 'Quantitative Chemistry',
    'gcse-chem-l2-rate-reaction': 'Rate of Reaction',
    'gcse-phys-l2-atomic-structure': 'Atomic Structure',
    'gcse-phys-l2-energy': 'Energy',
    'gcse-phys-l2-particle-model': 'Particle Model',
}

const GCSE_MATHS_TOPIC_BY_ID = {
    'gcse-l2-algebra': 'Algebra',
    'gcse-l2-geometry-measures': 'Geometry: Measures',
    'gcse-l2-geometry-properties': 'Geometry: Properties',
    'gcse-l2-graphs': 'Graphs',
    'gcse-l2-number': 'Number',
    'gcse-l2-probability': 'Probability',
    'gcse-l2-ratio-proportion': 'Ratio and Proportion',
    'gcse-l2-statistics': 'Statistics',
}

function parseArgs(argv = process.argv.slice(2)) {
    const args = {}
    for (const part of argv) {
        if (!part.startsWith('--')) continue
        const [key, ...rest] = part.slice(2).split('=')
        args[key] = rest.length ? rest.join('=') : true
    }
    return args
}

function normalise(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/\b\d+(?:th|st|nd|rd)\b/g, (match) => match.replace(/(?:th|st|nd|rd)$/, ''))
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function trackSlugFor(unitId) {
    return TRACK_BY_PREFIX.find(([prefix]) => unitId.startsWith(prefix))?.[1] || null
}

function topicTitleFor(bundle) {
    const id = bundle.unit.id
    const title = String(bundle.unit.title || '')
    const [category, ...rest] = title.split(':')
    const afterColon = rest.join(':').trim()

    if (id.startsWith('eds-')) return EDS_TOPIC_BY_CATEGORY[category] || null
    if (id.startsWith('fse-')) {
        if (id.includes('-reading-')) return 'Reading for Understanding'
        if (id.includes('-speaking-')) return 'Communication Skills'
        if (id.includes('-writing-grammar') || id.includes('-writing-spelling')) return 'Spelling and Grammar'
        return 'Writing Effectively'
    }
    if (id.startsWith('fsm-')) {
        if (id.includes('-data-')) return 'Data Handling'
        if (id.includes('-measures-conversion')) return 'Measures and Units'
        if (id.includes('-measures-money')) return 'Money and Finance'
        if (id.includes('-shape-')) return 'Shape and Space'
        if (id.includes('-number-percentages')) return 'Ratio and Proportion'
        if (id.includes('-number-fractions')) return 'Fractions and Percentages'
        return 'Number Operations'
    }
    if (id.startsWith('gcse-lit-')) return LIT_TOPIC_BY_ID[id] || null
    if (SCIENCE_TOPIC_BY_ID[id]) return SCIENCE_TOPIC_BY_ID[id]
    if (GCSE_MATHS_TOPIC_BY_ID[id]) return GCSE_MATHS_TOPIC_BY_ID[id]
    return category || afterColon
}

function resolveTopic(topics, desiredTitle) {
    const desired = normalise(desiredTitle)
    const exact = topics.find((topic) => normalise(topic.title) === desired)
    if (exact) return exact

    const desiredTokens = new Set(desired.split(' ').filter(Boolean))
    let best = null
    let bestScore = 0
    for (const topic of topics) {
        const tokens = normalise(topic.title).split(' ').filter(Boolean)
        const score = tokens.reduce((total, token) => total + (desiredTokens.has(token) ? 1 : 0), 0)
        if (score > bestScore) {
            best = topic
            bestScore = score
        }
    }
    return bestScore > 0 ? best : null
}

function parseDate(value, label) {
    const date = new Date(value)
    if (!value || Number.isNaN(date.getTime())) throw new Error(`${label} is not a valid date`)
    return date
}

function contentBlocksFor(bundle) {
    const blocks = []
    for (const section of bundle.lesson.sections || []) {
        blocks.push({ type: 'heading', content: section.heading })
        blocks.push({ type: 'paragraph', content: section.body })
    }
    if (bundle.lesson.writingActivity) blocks.push({ type: 'writing_activity', ...bundle.lesson.writingActivity })
    if (bundle.lesson.imageInferenceActivity) blocks.push({ type: 'image_inference_activity', ...bundle.lesson.imageInferenceActivity })
    if (bundle.lesson.speakingActivity) blocks.push({ type: 'speaking_activity', ...bundle.lesson.speakingActivity })
    if (bundle.unit.id === 'gcse-l2-number') {
        blocks.push({
            type: 'interactive',
            widget: 'fraction-lab',
            title: 'See equivalent fractions',
            prompt: 'Adjust the two bars and watch equivalent fractions become equal in front of you.',
            target: { numerator: 1, denominator: 2 },
        })
    }
    return blocks
}

function validateBundle(bundle, fileName) {
    const errors = []
    if (!bundle?.unit?.id) errors.push('missing unit.id')
    if (!bundle?.lesson?.title || !bundle.lesson.summary) errors.push('missing lesson title/summary')
    if (!Array.isArray(bundle.lesson.sections) || bundle.lesson.sections.length === 0) errors.push('missing lesson sections')
    if (!Array.isArray(bundle.lesson.practice) || bundle.lesson.practice.length !== 3) errors.push('practice must contain exactly 3 questions')
    if (!bundle.source?.url || !bundle.source?.title) errors.push('missing source metadata')
    if (!bundle.modelReview?.decision) errors.push('missing model review decision')
    for (const [index, question] of (bundle.lesson.practice || []).entries()) {
        if (!question.prompt || !question.explanation) errors.push(`practice[${index}] missing prompt/explanation`)
        if (!Array.isArray(question.options) || question.options.length !== 4) errors.push(`practice[${index}] must contain 4 options`)
        if (!Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= (question.options || []).length) errors.push(`practice[${index}] invalid correctIndex`)
        if (!question.objectiveCode) errors.push(`practice[${index}] missing objectiveCode`)
    }
    return errors.map((error) => `${fileName}: ${error}`)
}

async function loadBundles(dir) {
    const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort()
    return Promise.all(files.map(async (file) => ({ file, bundle: JSON.parse(await readFile(path.join(dir, file), 'utf8')) })))
}

async function buildPlan(bundles) {
    const trackSlugs = [...new Set(bundles.map(({ bundle }) => trackSlugFor(bundle.unit.id)).filter(Boolean))]
    const tracks = await prisma.track.findMany({
        where: { slug: { in: trackSlugs } },
        include: { topics: { include: { ukLevel: true, lessons: { select: { id: true } } } } },
    })
    const trackBySlug = new Map(tracks.map((track) => [track.slug, track]))
    const plan = []
    const errors = []
    for (const entry of bundles) {
        const { file, bundle } = entry
        errors.push(...validateBundle(bundle, file))
        const trackSlug = trackSlugFor(bundle.unit.id)
        if (!trackSlug) {
            errors.push(`${file}: no track mapping for ${bundle.unit.id}`)
            continue
        }
        const track = trackBySlug.get(trackSlug)
        if (!track) {
            errors.push(`${file}: track ${trackSlug} not found`)
            continue
        }
        const desiredTopic = topicTitleFor(bundle)
        const topic = resolveTopic(track.topics, desiredTopic)
        if (!topic) {
            errors.push(`${file}: topic ${desiredTopic} not found in ${trackSlug}`)
            continue
        }
        const objectiveByCode = new Map((bundle.unit.objectives || []).map((objective) => [objective.code, objective.text]))
        for (const question of bundle.lesson.practice || []) {
            if (!objectiveByCode.has(question.objectiveCode)) errors.push(`${file}: objective ${question.objectiveCode} not found`)
        }
        plan.push({ file, bundle, track, topic, objectiveByCode })
    }
    return { plan, errors }
}

function lessonId(unitId) { return `generated-${unitId}` }
function questionId(unitId, index) { return `generated-${unitId}-${index + 1}` }

async function applyPlan(plan) {
    const sortNext = new Map()
    for (const item of plan) {
        if (!sortNext.has(item.topic.id)) sortNext.set(item.topic.id, item.topic.lessons.length)
    }
    let lessons = 0
    let questions = 0
    for (const item of plan) {
        const { bundle, topic, objectiveByCode } = item
        const id = lessonId(bundle.unit.id)
        const sortOrder = sortNext.get(topic.id)
        sortNext.set(topic.id, sortOrder + 1)
        const reviewedAt = bundle.modelReview?.reviewedAt ? parseDate(bundle.modelReview.reviewedAt, `${item.file} modelReview.reviewedAt`) : new Date()
        await prisma.$transaction(async (tx) => {
            await tx.lesson.upsert({
                where: { id },
                create: {
                    id,
                    topicId: topic.id,
                    title: bundle.lesson.title,
                    summary: bundle.lesson.summary,
                    contentBlocks: JSON.stringify(contentBlocksFor(bundle)),
                    estMinutes: 15,
                    isPublished: true,
                    sortOrder,
                },
                update: {
                    topicId: topic.id,
                    title: bundle.lesson.title,
                    summary: bundle.lesson.summary,
                    contentBlocks: JSON.stringify(contentBlocksFor(bundle)),
                    estMinutes: 15,
                    isPublished: true,
                    sortOrder,
                    version: { increment: 1 },
                },
            })
            for (const [index, question] of bundle.lesson.practice.entries()) {
                const id = questionId(bundle.unit.id, index)
                await tx.question.upsert({
                    where: { id },
                    create: {
                        id,
                        topicId: topic.id,
                        lessonId: lessonId(bundle.unit.id),
                        ukLevelId: topic.ukLevelId,
                        type: 'mcq',
                        prompt: question.prompt,
                        options: JSON.stringify(question.options),
                        answer: JSON.stringify(question.correctIndex),
                        explanation: question.explanation,
                        difficulty: 3,
                        tags: JSON.stringify([bundle.unit.id, question.objectiveCode]),
                        sourceMeta: JSON.stringify({
                            metadataMethod: 'generated-bundle-import',
                            generatedBundle: bundle.unit.id,
                            generator: bundle.generator,
                            modelReview: bundle.modelReview,
                        }),
                        sourceUrl: bundle.source.url,
                        sourceTitle: bundle.source.title,
                        sourceCheckedAt: parseDate(bundle.source.checkedAt, `${item.file} source.checkedAt`),
                        curriculumObjective: objectiveByCode.get(question.objectiveCode),
                        reviewStatus: 'in_review',
                        reviewedBy: bundle.modelReview.model || 'qwen/qwen3.8-27b',
                        reviewedAt,
                        isPublished: true,
                    },
                    update: {
                        topicId: topic.id,
                        lessonId: lessonId(bundle.unit.id),
                        ukLevelId: topic.ukLevelId,
                        prompt: question.prompt,
                        options: JSON.stringify(question.options),
                        answer: JSON.stringify(question.correctIndex),
                        explanation: question.explanation,
                        tags: JSON.stringify([bundle.unit.id, question.objectiveCode]),
                        sourceMeta: JSON.stringify({ metadataMethod: 'generated-bundle-import', generatedBundle: bundle.unit.id, generator: bundle.generator, modelReview: bundle.modelReview }),
                        sourceUrl: bundle.source.url,
                        sourceTitle: bundle.source.title,
                        sourceCheckedAt: parseDate(bundle.source.checkedAt, `${item.file} source.checkedAt`),
                        curriculumObjective: objectiveByCode.get(question.objectiveCode),
                        reviewStatus: 'in_review',
                        reviewedBy: bundle.modelReview.model || 'qwen/qwen3.8-27b',
                        reviewedAt,
                        isPublished: true,
                        version: { increment: 1 },
                    },
                })
                questions += 1
            }
        })
        lessons += 1
    }
    return { lessons, questions }
}

async function main() {
    const args = parseArgs()
    const dir = path.resolve(process.cwd(), args.dir && args.dir !== true ? String(args.dir) : 'exports/drafts')
    const bundles = await loadBundles(dir)
    const { plan, errors } = await buildPlan(bundles)
    const summary = {
        mode: args.apply === true ? 'apply' : 'dry-run',
        bundles: bundles.length,
        mapped: plan.length,
        lessons: plan.length,
        questions: plan.reduce((total, item) => total + item.bundle.lesson.practice.length, 0),
        errors,
        mappings: plan.map((item) => ({ bundle: item.bundle.unit.id, track: item.track.slug, topic: item.topic.title })),
    }
    if (errors.length > 0) {
        console.error(JSON.stringify(summary, null, 2))
        process.exitCode = 1
        return
    }
    if (args.apply !== true) {
        console.log(JSON.stringify(summary, null, 2))
        return
    }
    const result = await applyPlan(plan)
    console.log(JSON.stringify({ ...summary, applied: result }, null, 2))
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
