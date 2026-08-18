#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const OPTION_TYPES = new Set(['mcq', 'true_false', 'scenario'])
const MARKER_RE = /\b(?:not provided|doesn['’]t match|does not match|wait,|actually|correct answer should|typo|recalculate|closest option|not in the options|however,? the answer|but the answer)\b/i

function parseJson(value) {
    if (value === null || value === undefined || value === '') return null
    try { return JSON.parse(value) } catch { return '__MALFORMED__' }
}

function normalise(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function resolvedIndex(answer, options) {
    if (Number.isInteger(answer)) return answer >= 0 && answer < options.length ? answer : null
    if (typeof answer === 'string' && /^\d+$/.test(answer)) {
        const index = Number(answer)
        return index >= 0 && index < options.length ? index : null
    }
    if (typeof answer === 'string') {
        const matches = options.map((option, index) => normalise(option) === normalise(answer) ? index : null).filter((index) => index !== null)
        return matches.length === 1 ? matches[0] : null
    }
    return null
}

export function auditQuestions(questions) {
    const duplicatePrompts = new Map()
    const provenance = {}
    const reviewStatus = {}
    const result = {
        publishedQuestions: questions.length,
        missingSourceMetadata: 0,
        missingCurriculumObjectives: 0,
        unresolvableAnswerIndexes: 0,
        answerValuesResolvedFromTextOrNumericString: 0,
        embeddedOptionLabels: 0,
        malformedJson: 0,
        exactDuplicatePromptGroups: 0,
        shortPrompts: 0,
        shortExplanations: 0,
        explanationMarkers: 0,
    }
    for (const question of questions) {
        if (!question.sourceUrl || !question.sourceTitle || !question.sourceCheckedAt) result.missingSourceMetadata += 1
        if (!question.curriculumObjective) result.missingCurriculumObjectives += 1
        const options = parseJson(question.options)
        const answer = parseJson(question.answer)
        if (options === '__MALFORMED__' || answer === '__MALFORMED__') result.malformedJson += 1
        if (OPTION_TYPES.has(question.type) && Array.isArray(options)) {
            if (options.some((option) => /^\s*[A-D][.)]\s+/i.test(String(option)))) result.embeddedOptionLabels += 1
            const index = resolvedIndex(answer, options)
            if (index === null) result.unresolvableAnswerIndexes += 1
            else if (!Number.isInteger(answer)) result.answerValuesResolvedFromTextOrNumericString += 1
        }
        if (String(question.prompt || '').trim().split(/\s+/).filter(Boolean).length < 5) result.shortPrompts += 1
        if (String(question.explanation || '').trim().split(/\s+/).filter(Boolean).length < 5) result.shortExplanations += 1
        if (MARKER_RE.test(String(question.explanation || ''))) result.explanationMarkers += 1
        const promptKey = normalise(question.prompt)
        if (promptKey) duplicatePrompts.set(promptKey, [...(duplicatePrompts.get(promptKey) || []), question.id])
        const metadata = parseJson(question.sourceMeta)
        const method = metadata === '__MALFORMED__' ? 'malformed' : (metadata?.metadataMethod || 'direct-or-legacy')
        provenance[method] = (provenance[method] || 0) + 1
        reviewStatus[question.reviewStatus] = (reviewStatus[question.reviewStatus] || 0) + 1
    }
    result.exactDuplicatePromptGroups = [...duplicatePrompts.values()].filter((ids) => ids.length > 1).length
    return { ...result, provenance, reviewStatus }
}

async function main(argv = process.argv.slice(2)) {
    const input = argv.find((part) => part.startsWith('--input='))?.split('=').slice(1).join('=') || '/tmp/adultedu-published-final-verified.json'
    const output = argv.find((part) => part.startsWith('--out='))?.split('=').slice(1).join('=') || 'content-specs/live-audit-post-metadata-2026-08-17.json'
    const snapshot = JSON.parse(await readFile(input, 'utf8'))
    const report = { auditDate: new Date().toISOString(), scope: 'published snapshot', integrity: auditQuestions(snapshot.questions || snapshot) }
    await writeFile(output, JSON.stringify(report, null, 2))
    console.log(JSON.stringify({ output, ...report.integrity }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exitCode = 1 })
