import { writeFile } from 'node:fs/promises'
import prisma from '../src/lib/db.js'

const outputPath = process.argv[2] || '/tmp/adultedu-live-published-questions.json'

const questions = await prisma.question.findMany({
    where: { isPublished: true },
    orderBy: [{ topic: { track: { title: 'asc' } } }, { createdAt: 'asc' }],
    select: {
        id: true,
        type: true,
        prompt: true,
        options: true,
        answer: true,
        explanation: true,
        difficulty: true,
        tags: true,
        sourceMeta: true,
        sourceUrl: true,
        sourceTitle: true,
        sourceCheckedAt: true,
        curriculumObjective: true,
        contentRisk: true,
        reviewStatus: true,
        reviewedBy: true,
        reviewedAt: true,
        reviewDueAt: true,
        createdAt: true,
        updatedAt: true,
        topic: {
            select: {
                id: true,
                title: true,
                track: { select: { id: true, slug: true, title: true } },
                ukLevel: { select: { code: true, title: true } },
            },
        },
    },
})

const parseJson = (value) => {
    if (!value) return { value: null, valid: true }
    try { return { value: JSON.parse(value), valid: true } } catch { return { value: null, valid: false } }
}

const normalise = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const byTrack = new Map()
const byType = new Map()
const byReviewStatus = new Map()
const duplicatePrompts = new Map()
const issues = []

const records = questions.map((question) => {
    const options = parseJson(question.options)
    const answer = parseJson(question.answer)
    const track = question.topic.track
    byTrack.set(track.slug, (byTrack.get(track.slug) || 0) + 1)
    byType.set(question.type, (byType.get(question.type) || 0) + 1)
    byReviewStatus.set(question.reviewStatus, (byReviewStatus.get(question.reviewStatus) || 0) + 1)

    const promptKey = normalise(question.prompt)
    if (promptKey) {
        const matches = duplicatePrompts.get(promptKey) || []
        matches.push(question.id)
        duplicatePrompts.set(promptKey, matches)
    }

    const rowIssues = []
    if (!question.prompt?.trim()) rowIssues.push('missing_prompt')
    if (!question.explanation?.trim()) rowIssues.push('missing_explanation')
    if (!question.sourceUrl && !question.sourceTitle) rowIssues.push('missing_source')
    if (!question.curriculumObjective) rowIssues.push('missing_curriculum_objective')
    if (!options.valid) rowIssues.push('malformed_options_json')
    if (!answer.valid) rowIssues.push('malformed_answer_json')
    if (question.type === 'mcq' && options.valid && (!Array.isArray(options.value) || options.value.length < 2)) rowIssues.push('mcq_options_invalid')
    if (question.type === 'mcq' && answer.valid && answer.value == null) rowIssues.push('mcq_answer_missing')
    if (question.prompt?.trim().split(/\s+/).length < 5) rowIssues.push('very_short_prompt')
    if (question.explanation?.trim().split(/\s+/).length < 5) rowIssues.push('very_short_explanation')
    if (rowIssues.length) issues.push({ id: question.id, track: track.slug, topic: question.topic.title, issues: rowIssues })

    return {
        ...question,
        options: options.value,
        answer: answer.value,
        topic: question.topic,
        sourceCheckedAt: question.sourceCheckedAt?.toISOString() || null,
        reviewedAt: question.reviewedAt?.toISOString() || null,
        reviewDueAt: question.reviewDueAt?.toISOString() || null,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
    }
})

const duplicateGroups = [...duplicatePrompts.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([prompt, ids]) => ({ prompt, ids }))

const report = {
    generatedAt: new Date().toISOString(),
    scope: 'published questions only',
    totals: {
        questions: records.length,
        tracks: byTrack.size,
        flaggedQuestions: issues.length,
        duplicatePromptGroups: duplicateGroups.length,
    },
    byTrack: Object.fromEntries([...byTrack.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
    byType: Object.fromEntries(byType),
    byReviewStatus: Object.fromEntries(byReviewStatus),
    issues,
    duplicateGroups,
    questions: records,
}

await writeFile(outputPath, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ outputPath, ...report.totals }, null, 2))
await prisma.$disconnect()
