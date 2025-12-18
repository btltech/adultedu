/**
 * Safely dedupe questions by unpublishing exact duplicate prompts within the same topic.
 *
 * This avoids deleting rows (which could cascade into attempts/review items/etc).
 *
 * Usage:
 *   node scripts/unpublish-duplicate-prompts.js
 *   node scripts/unpublish-duplicate-prompts.js --apply
 *   node scripts/unpublish-duplicate-prompts.js --apply --category=workplace
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        if (!part.startsWith('--')) continue
        const [k, v] = part.split('=')
        args.set(k, v ?? true)
    }
    return args
}

function normalizePrompt(input) {
    return String(input ?? '')
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
}

async function main() {
    const args = parseArgs(process.argv)
    const apply = args.get('--apply') === true
    const category = args.get('--category') === true ? null : (args.get('--category') ?? null)

    const where = category ? { topic: { track: { category } } } : {}

    const questions = await prisma.question.findMany({
        where,
        select: {
            id: true,
            topicId: true,
            prompt: true,
            createdAt: true,
            isPublished: true,
            sourceMeta: true,
        },
        orderBy: { createdAt: 'asc' },
    })

    const groups = new Map() // topicId::normalizedPrompt -> array
    for (const q of questions) {
        const key = `${q.topicId}::${normalizePrompt(q.prompt)}`
        const arr = groups.get(key) || []
        arr.push(q)
        groups.set(key, arr)
    }

    const dupGroups = [...groups.values()].filter((arr) => arr.length > 1)

    const counters = {
        apply,
        category,
        scanned: questions.length,
        duplicateGroups: dupGroups.length,
        wouldUnpublish: 0,
        unpublished: 0,
        samples: [],
    }

    for (const arr of dupGroups) {
        const sorted = [...arr].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        const canonical = sorted[0]
        const dups = sorted.slice(1)

        if (counters.samples.length < 10) {
            counters.samples.push({
                topicId: canonical.topicId,
                canonicalId: canonical.id,
                duplicateIds: dups.map((d) => d.id),
                prompt: String(canonical.prompt ?? '').slice(0, 140),
            })
        }

        for (const q of dups) {
            if (!q.isPublished) continue

            const updates = { isPublished: false, version: { increment: 1 } }

            // Record backlink for traceability
            try {
                const meta = q.sourceMeta ? JSON.parse(q.sourceMeta) : {}
                meta.duplicateOf = canonical.id
                updates.sourceMeta = JSON.stringify(meta)
            } catch {
                updates.sourceMeta = JSON.stringify({ duplicateOf: canonical.id })
            }

            if (!apply) {
                counters.wouldUnpublish++
                continue
            }

            await prisma.question.update({ where: { id: q.id }, data: updates })
            counters.unpublished++
        }
    }

    console.log(JSON.stringify(counters, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

