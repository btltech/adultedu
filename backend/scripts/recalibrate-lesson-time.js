#!/usr/bin/env node
/**
 * Recompute lesson `estMinutes` from the lesson's actual content.
 *
 * Stored estimates were round numbers chosen at authoring time (15, 20) that
 * bear no relation to what is on the page: lessons claiming 20 minutes contain
 * ~180 words, about one minute of reading. The error propagates, because track
 * pages sum these values into "Full study" totals, so the whole catalogue
 * advertises study time roughly fifteen times longer than it delivers.
 *
 * Usage:
 *   node scripts/recalibrate-lesson-time.js                    # dry run, summary
 *   node scripts/recalibrate-lesson-time.js --verbose          # per-lesson table
 *   node scripts/recalibrate-lesson-time.js --apply            # write changes
 *   node scripts/recalibrate-lesson-time.js --out=report.json  # save a record
 */
import { writeFile } from 'node:fs/promises'
import prisma from '../src/lib/db.js'

// Adult learners returning to study, reading unfamiliar material, not skimming.
const WORDS_PER_MINUTE = 150
// Read the stem, weigh four options, commit, then read the explanation.
const SECONDS_PER_QUESTION = 45
// Diagrams, code samples and callouts cost more attention than their word count.
const SECONDS_PER_CODE_BLOCK = 40
const SECONDS_PER_CALLOUT = 15
// Opening a lesson, orienting, and closing it is never free.
const OVERHEAD_MINUTES = 1
// Below this a number stops being informative and starts looking broken.
const MINIMUM_MINUTES = 2

function parseBlocks(raw) {
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function blockText(block) {
    if (typeof block === 'string') return block
    const parts = [block?.content, block?.text, block?.title, block?.caption]
    if (Array.isArray(block?.items)) parts.push(block.items.join(' '))
    return parts.filter((part) => typeof part === 'string').join(' ')
}

export function estimateMinutes(contentBlocks, questionCount = 0) {
    const blocks = parseBlocks(contentBlocks)

    const words = blocks.reduce((total, block) => total + blockText(block).trim().split(/\s+/).filter(Boolean).length, 0)
    const codeBlocks = blocks.filter((block) => block?.type === 'code').length
    const callouts = blocks.filter((block) => block?.type === 'callout').length

    const minutes = OVERHEAD_MINUTES
        + words / WORDS_PER_MINUTE
        + (questionCount * SECONDS_PER_QUESTION) / 60
        + (codeBlocks * SECONDS_PER_CODE_BLOCK) / 60
        + (callouts * SECONDS_PER_CALLOUT) / 60

    return { minutes: Math.max(MINIMUM_MINUTES, Math.round(minutes)), words, codeBlocks, callouts }
}

async function main() {
    const args = new Set(process.argv.slice(2))
    const apply = args.has('--apply')
    const verbose = args.has('--verbose')
    const outArg = [...args].find((a) => a.startsWith('--out='))

    const lessons = await prisma.lesson.findMany({
        where: { isPublished: true },
        select: {
            id: true, title: true, contentBlocks: true, estMinutes: true, version: true,
            _count: { select: { questions: true } },
            topic: { select: { track: { select: { slug: true } } } },
        },
    })

    const rows = []
    let updated = 0
    for (const lesson of lessons) {
        const { minutes, words } = estimateMinutes(lesson.contentBlocks, lesson._count.questions)
        if (minutes === lesson.estMinutes) continue

        rows.push({
            id: lesson.id,
            track: lesson.topic?.track?.slug || 'unknown',
            title: lesson.title,
            words,
            questions: lesson._count.questions,
            was: lesson.estMinutes,
            now: minutes,
        })

        if (apply) {
            // Version-match so a concurrent edit is never overwritten.
            const result = await prisma.lesson.updateMany({
                where: { id: lesson.id, version: lesson.version },
                data: { estMinutes: minutes, version: { increment: 1 } },
            })
            updated += result.count
        }
    }

    const overstated = rows.filter((r) => r.was > r.now)
    const report = {
        generatedAt: new Date().toISOString(),
        mode: apply ? 'apply' : 'dry-run',
        publishedLessons: lessons.length,
        lessonsChanged: rows.length,
        lessonsUpdated: apply ? updated : 0,
        claimedMinutesTotal: rows.reduce((t, r) => t + r.was, 0),
        recalculatedMinutesTotal: rows.reduce((t, r) => t + r.now, 0),
        overstatedLessons: overstated.length,
        worstOverstatements: [...overstated]
            .sort((a, b) => (b.was - b.now) - (a.was - a.now))
            .slice(0, 10)
            .map((r) => ({ title: r.title, was: r.was, now: r.now, words: r.words })),
    }

    if (outArg) await writeFile(outArg.slice('--out='.length), JSON.stringify({ ...report, rows }, null, 2))
    console.log(JSON.stringify(verbose ? { ...report, rows } : report, null, 2))
}

main()
    .catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
    .finally(() => prisma.$disconnect())
