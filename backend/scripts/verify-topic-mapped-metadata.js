#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

function args(argv = process.argv.slice(2)) {
    const out = {}
    for (const part of argv) {
        if (!part.startsWith('--')) continue
        const [key, ...rest] = part.slice(2).split('=')
        out[key] = rest.length ? rest.join('=') : true
    }
    return out
}

export function verifyRow(question, sourcePlan, topicMap) {
    let meta = {}
    try { meta = JSON.parse(question.sourceMeta || '{}') } catch { return { ok: false, reason: 'malformed_source_meta' } }
    if (meta.verification !== 'pending-item-review') return { ok: true, reason: 'already_reviewed' }
    const track = question.topic?.track?.slug
    const topic = question.topic?.title
    const expected = topicMap.tracks?.[track]?.[topic]
    const sources = sourcePlan.tracks?.[track]?.sources || []
    if (!expected) return { ok: false, reason: 'topic_missing_from_map' }
    if (!sources.some((source) => source.url === question.sourceUrl)) return { ok: false, reason: 'source_not_in_track_map' }
    if (meta.objectiveCode !== expected.code) return { ok: false, reason: 'objective_code_mismatch' }
    if (question.curriculumObjective !== expected.text) return { ok: false, reason: 'objective_text_mismatch' }
    if (!question.sourceTitle || !question.sourceUrl || !question.sourceCheckedAt) return { ok: false, reason: 'required_source_field_missing' }
    if (!question.prompt?.trim() || !question.explanation?.trim()) return { ok: false, reason: 'question_text_missing' }
    return { ok: true, reason: 'topic_source_objective_consistent', objectiveCode: expected.code }
}

async function main(argv = process.argv.slice(2)) {
    const options = args(argv)
    const input = options.input && options.input !== true ? String(options.input) : '/tmp/adultedu-published-final.json'
    const out = options.out && options.out !== true ? String(options.out) : path.resolve(`content-specs/topic-metadata-verification-${new Date().toISOString().slice(0, 10)}.json`)
    const sourcePlan = JSON.parse(await readFile(options['source-map'] && options['source-map'] !== true ? String(options['source-map']) : path.resolve('content-specs/legacy-source-objective-plan-2026-08-17.json'), 'utf8'))
    const topicMap = JSON.parse(await readFile(options['topic-map'] && options['topic-map'] !== true ? String(options['topic-map']) : path.resolve('content-specs/legacy-topic-objectives-2026-08-17.json'), 'utf8'))
    const snapshot = JSON.parse(await readFile(input, 'utf8'))
    const questions = snapshot.questions || snapshot
    const records = questions.map((question) => ({ id: question.id, version: question.version, ...verifyRow(question, sourcePlan, topicMap) }))
    const report = {
        generatedAt: new Date().toISOString(),
        scope: 'published topic-mapped metadata consistency',
        interpretation: 'This verifies map consistency for source URL, objective code/text, track and topic. It does not replace independent factual editorial review of each question.',
        totals: {
            questions: records.length,
            verified: records.filter((record) => record.ok && record.reason === 'topic_source_objective_consistent').length,
            alreadyReviewed: records.filter((record) => record.reason === 'already_reviewed').length,
            needsHuman: records.filter((record) => !record.ok).length,
        },
        records,
    }
    await writeFile(out, JSON.stringify(report, null, 2))
    console.log(JSON.stringify({ out, ...report.totals }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exitCode = 1 })
