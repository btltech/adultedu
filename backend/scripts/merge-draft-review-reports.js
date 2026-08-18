#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const [target, ...retryFiles] = process.argv.slice(2)
if (!target || retryFiles.length === 0) throw new Error('Usage: node scripts/merge-draft-review-reports.js TARGET RETRY...')

const report = JSON.parse(await readFile(target, 'utf8'))
const retries = (await Promise.all(retryFiles.map(async (file) => JSON.parse(await readFile(file, 'utf8')))))
    .flatMap((item) => item.results || [])
const byFile = new Map(retries.map((item) => [item.file, item]))
report.results = report.results.map((item) => byFile.get(item.file) || item)
const successful = report.results.filter((item) => item.ok)
report.totals = {
    bundles: report.results.length,
    reviewed: successful.length,
    failed: report.results.length - successful.length,
    pass: successful.filter((item) => item.review.decision === 'pass').length,
    rewrite: successful.filter((item) => item.review.decision === 'rewrite').length,
    uncertain: successful.filter((item) => item.review.decision === 'uncertain').length,
    itemRewrites: successful.reduce((sum, item) => sum + item.review.items.filter((review) => review.decision === 'rewrite').length, 0),
}
report.retryReports = retryFiles
await writeFile(target, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report.totals, null, 2))
