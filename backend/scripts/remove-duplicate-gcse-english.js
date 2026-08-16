/**
 * One-time script: remove duplicate GCSE English Language track.
 *
 * Background: two tracks exist in production both titled "GCSE English Language":
 *   - slug "gcse-english"          (older, 8 topics, ~120 questions, correct category)
 *   - slug "gcse-english-language" (newer, 7 topics, ~393 questions, wrong category)
 *
 * Fix:
 *   1. Delete "gcse-english" and all its topics / questions.
 *   2. Update "gcse-english-language" category to "qual_prep".
 *
 * This script is idempotent — safe to run multiple times.
 */
import prisma from '../src/lib/db.js'

async function main() {
    // ── 1. Remove the duplicate "gcse-english" track ──────────────────────────
    const duplicate = await prisma.track.findUnique({
        where: { slug: 'gcse-english' },
        include: {
            topics: {
                include: {
                    _count: { select: { questions: true } },
                },
            },
        },
    })

    if (duplicate) {
        const topicCount = duplicate.topics.length
        const questionCount = duplicate.topics.reduce((sum, t) => sum + t._count.questions, 0)
        console.log(`Found duplicate track "${duplicate.title}" (id=${duplicate.id})`)
        console.log(`  → ${topicCount} topics, ${questionCount} questions — deleting.`)

        // Delete questions first (no cascade on Prisma schema), then topics, then track
        const topicIds = duplicate.topics.map((t) => t.id)

        if (topicIds.length > 0) {
            // Remove question attempts
            await prisma.questionAttempt.deleteMany({ where: { question: { topicId: { in: topicIds } } } })
            // Remove questions
            await prisma.question.deleteMany({ where: { topicId: { in: topicIds } } })
            // Remove lesson attempts / progress
            await prisma.lessonProgress.deleteMany({ where: { lesson: { topicId: { in: topicIds } } } }).catch(() => {})
            // Remove lessons
            await prisma.lesson.deleteMany({ where: { topicId: { in: topicIds } } })
            // Remove topic progress
            await prisma.topicProgress.deleteMany({ where: { topicId: { in: topicIds } } }).catch(() => {})
            // Remove topics
            await prisma.topic.deleteMany({ where: { id: { in: topicIds } } })
        }

        // Remove track-framework link
        await prisma.trackFramework.deleteMany({ where: { trackId: duplicate.id } })
        // Remove track
        await prisma.track.delete({ where: { id: duplicate.id } })

        console.log('  ✓ Deleted duplicate track and all associated data.')
    } else {
        console.log('No duplicate "gcse-english" track found — nothing to delete.')
    }

    // ── 2. Fix category on the canonical track ─────────────────────────────────
    const canonical = await prisma.track.findUnique({
        where: { slug: 'gcse-english-language' },
        select: { id: true, category: true, title: true },
    })

    if (!canonical) {
        console.error('ERROR: "gcse-english-language" track not found! Aborting category fix.')
        return
    }

    if (canonical.category !== 'qual_prep') {
        await prisma.track.update({
            where: { id: canonical.id },
            data: { category: 'qual_prep' },
        })
        console.log(`Updated "${canonical.title}" category: "${canonical.category}" → "qual_prep"`)
    } else {
        console.log(`"gcse-english-language" already has correct category "qual_prep" — no change needed.`)
    }

    console.log('Done.')
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
