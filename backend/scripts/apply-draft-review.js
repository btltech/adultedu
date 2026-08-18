#!/usr/bin/env node

/** Apply only validated model proposals to local draft bundles. --apply is required. */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { validateLessonDraft } from '../src/lib/contentDrafts.js'

function parseArgs(argv = process.argv.slice(2)) {
    const out = {}
    for (const part of argv) {
        if (!part.startsWith('--')) continue
        const [key, ...rest] = part.slice(2).split('=')
        out[key] = rest.length ? rest.join('=') : true
    }
    return out
}

async function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv)
    if (!args.file || args.file === true) throw new Error('--file=REVIEW_REPORT is required')
    const apply = args.apply === true
    const report = JSON.parse(await readFile(String(args.file), 'utf8'))
    const results = report.results || []
    const changed = []
    const skipped = []
    for (const result of results) {
        if (!result.ok || !result.review) { skipped.push({ file: result.file, reason: 'review failed' }); continue }
        const rewrites = result.review.items.filter((item) => item.decision === 'rewrite')
        const filePath = path.join(path.dirname(String(args.file)) === 'content-specs' ? 'exports/drafts' : path.resolve('exports/drafts'), result.file)
        const bundle = JSON.parse(await readFile(filePath, 'utf8'))
        if (bundle.publication?.isPublished === true) { skipped.push({ file: result.file, reason: 'bundle is published' }); continue }
        const originalItems = bundle.lesson?.practice || []
        for (const [index, review] of result.review.items.entries()) {
            if (review.decision !== 'rewrite' || !review.proposed) continue
            const original = originalItems[index]
            originalItems[index] = { ...review.proposed, objectiveCode: original.objectiveCode }
        }
        if (rewrites.length > 0) {
            try {
                validateLessonDraft(bundle.lesson, {
                    ...bundle.unit,
                    source: bundle.source,
                    sectionCount: bundle.lesson.sections.length,
                    practiceCount: bundle.lesson.practice.length,
                })
            } catch (error) {
                skipped.push({ file: result.file, reason: `post-apply validation failed: ${error.message}` })
                continue
            }
        }
        changed.push({ file: result.file, rewriteCount: rewrites.length, decision: result.review.decision })
        if (apply) {
            if (rewrites.length > 0) bundle.editorialReview = { outcome: 'model-rewrite-applied', reviewedAt: new Date().toISOString(), notes: 'Validated local-model proposal applied; human editorial approval is still required before publication.' }
            bundle.modelReview = { decision: result.review.decision, itemDecisions: result.review.items.map((item) => item.decision), reviewedAt: report.generatedAt, model: report.model?.model || null }
            bundle.publication = { ...(bundle.publication || {}), isPublished: false, reviewStatus: 'draft', reviewedBy: null, reviewedAt: null }
            await writeFile(filePath, JSON.stringify(bundle, null, 2) + '\n')
        }
    }
    console.log(JSON.stringify({ dryRun: !apply, changed, skipped }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => { console.error(error.message || error); process.exitCode = 1 })
}
