/**
 * Seed Entry Level (E1/E2) topics for workplace tracks.
 *
 * This helps fill the gap where content starts at E3+ by default.
 *
 * Usage:
 *   node scripts/seed-entry-level-workplace-topics.js
 *   node scripts/seed-entry-level-workplace-topics.js --apply
 *   node scripts/seed-entry-level-workplace-topics.js --apply --track=essential-digital-skills
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

const TOPICS_BY_TRACK = {
    'essential-digital-skills': [
        {
            ukLevelCode: 'E1',
            sortOrder: -2,
            title: 'Getting Started with a Device',
            description: 'Turning a device on/off, basic touchscreen or mouse control, and simple navigation.',
        },
        {
            ukLevelCode: 'E2',
            sortOrder: -1,
            title: 'Getting Online Basics',
            description: 'Connecting to Wi‑Fi, opening a browser, simple searches, and staying safe with passwords.',
        },
    ],
    'functional-skills-english': [
        {
            ukLevelCode: 'E1',
            sortOrder: -2,
            title: 'Entry 1 Reading and Vocabulary',
            description: 'Recognising common words, signs, and simple instructions used in everyday life and work.',
        },
        {
            ukLevelCode: 'E2',
            sortOrder: -1,
            title: 'Entry 2 Writing and Communication',
            description: 'Writing short messages, completing simple forms, and using clear sentences.',
        },
    ],
    'functional-skills-maths': [
        {
            ukLevelCode: 'E1',
            sortOrder: -2,
            title: 'Entry 1 Numbers and Counting',
            description: 'Counting, comparing numbers, and simple addition/subtraction with everyday examples.',
        },
        {
            ukLevelCode: 'E2',
            sortOrder: -1,
            title: 'Entry 2 Money, Time and Measures',
            description: 'Using coins/notes, telling the time, and basic measures in real-life situations.',
        },
    ],
    'financial-literacy': [
        {
            ukLevelCode: 'E1',
            sortOrder: -2,
            title: 'Money Basics (Notes and Coins)',
            description: 'Recognising UK coins and notes, making totals, and checking change.',
        },
        {
            ukLevelCode: 'E2',
            sortOrder: -1,
            title: 'Simple Budgeting and Bills',
            description: 'Planning weekly spending, understanding bills, and making basic money choices.',
        },
    ],
    'business-english': [
        {
            ukLevelCode: 'E1',
            sortOrder: -2,
            title: 'Workplace Words and Signs',
            description: 'Common workplace vocabulary, safety signs, and short instructions.',
        },
        {
            ukLevelCode: 'E2',
            sortOrder: -1,
            title: 'Simple Workplace Messages',
            description: 'Short emails/messages, polite phrases, and clear communication at work.',
        },
    ],
    'microsoft-office-essentials': [
        {
            ukLevelCode: 'E1',
            sortOrder: -2,
            title: 'Using a Computer and Keyboard',
            description: 'Basic keyboard and mouse skills, typing practice, and understanding windows and menus.',
        },
        {
            ukLevelCode: 'E2',
            sortOrder: -1,
            title: 'Opening, Saving, and Finding Files',
            description: 'Opening apps, saving work, naming files, and finding documents in folders.',
        },
    ],
}

async function main() {
    const args = parseArgs(process.argv)
    const apply = args.get('--apply') === true
    const trackSlug = args.get('--track') === true ? null : (args.get('--track') ?? null)

    const levels = await prisma.ukLevel.findMany({
        where: { code: { in: ['E1', 'E2'] } },
        select: { id: true, code: true },
    })
    const levelByCode = new Map(levels.map((l) => [l.code, l]))

    for (const code of ['E1', 'E2']) {
        if (!levelByCode.has(code)) throw new Error(`Missing UK level: ${code}`)
    }

    const workplaceTracks = await prisma.track.findMany({
        where: {
            category: 'workplace',
            ...(trackSlug ? { slug: trackSlug } : {}),
        },
        select: { id: true, slug: true, title: true },
        orderBy: { slug: 'asc' },
    })

    const counters = {
        apply,
        track: trackSlug,
        tracksScanned: workplaceTracks.length,
        topicsPlanned: 0,
        topicsCreated: 0,
        topicsSkippedExisting: 0,
        missingTrackPlans: [],
        created: [],
    }

    for (const track of workplaceTracks) {
        const planned = TOPICS_BY_TRACK[track.slug]
        if (!planned) {
            counters.missingTrackPlans.push(track.slug)
            continue
        }

        for (const spec of planned) {
            counters.topicsPlanned++
            const level = levelByCode.get(spec.ukLevelCode)
            if (!level) continue

            const existing = await prisma.topic.findFirst({
                where: {
                    trackId: track.id,
                    ukLevelId: level.id,
                    title: spec.title,
                },
                select: { id: true },
            })

            if (existing) {
                counters.topicsSkippedExisting++
                continue
            }

            if (!apply) continue

            const created = await prisma.topic.create({
                data: {
                    trackId: track.id,
                    ukLevelId: level.id,
                    title: spec.title,
                    description: spec.description,
                    sortOrder: spec.sortOrder,
                },
                select: { id: true, title: true },
            })

            counters.topicsCreated++
            counters.created.push({
                track: track.slug,
                topicId: created.id,
                title: created.title,
                ukLevel: spec.ukLevelCode,
            })
        }
    }

    console.log(JSON.stringify(counters, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

