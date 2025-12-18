/**
 * Deduplicate content in the database
 * Removes duplicate topics, lessons, and questions for a given track
 * 
 * Usage: node scripts/dedupe-content.js [track-slug]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function dedupeTrack(trackSlug) {
    console.log(`\n🔍 Deduplicating content for: ${trackSlug || 'all tracks'}`)

    // Get track(s)
    const tracks = trackSlug
        ? [await prisma.track.findUnique({ where: { slug: trackSlug } })]
        : await prisma.track.findMany()

    let totalTopicsRemoved = 0
    let totalLessonsRemoved = 0
    let totalQuestionsRemoved = 0

    for (const track of tracks) {
        if (!track) continue

        console.log(`\n📚 Processing: ${track.title}`)

        // Dedupe topics by title
        const topics = await prisma.topic.findMany({
            where: { trackId: track.id },
            orderBy: { createdAt: 'asc' }
        })

        const seenTopics = new Map()
        const duplicateTopicIds = []

        for (const topic of topics) {
            const key = topic.title.toLowerCase().trim()
            if (seenTopics.has(key)) {
                duplicateTopicIds.push(topic.id)
            } else {
                seenTopics.set(key, topic.id)
            }
        }

        if (duplicateTopicIds.length > 0) {
            // Delete questions associated with duplicate topics
            const deletedQuestions = await prisma.question.deleteMany({
                where: { topicId: { in: duplicateTopicIds } }
            })
            totalQuestionsRemoved += deletedQuestions.count

            // Delete lessons associated with duplicate topics
            const deletedLessons = await prisma.lesson.deleteMany({
                where: { topicId: { in: duplicateTopicIds } }
            })
            totalLessonsRemoved += deletedLessons.count

            // Delete duplicate topics
            await prisma.topic.deleteMany({
                where: { id: { in: duplicateTopicIds } }
            })
            totalTopicsRemoved += duplicateTopicIds.length

            console.log(`   ✓ Removed ${duplicateTopicIds.length} duplicate topics`)
        } else {
            console.log(`   ✓ No duplicate topics found`)
        }

        // Dedupe questions within remaining topics (by prompt text)
        const remainingTopics = await prisma.topic.findMany({
            where: { trackId: track.id }
        })

        for (const topic of remainingTopics) {
            const questions = await prisma.question.findMany({
                where: { topicId: topic.id },
                orderBy: { createdAt: 'asc' }
            })

            const seenQuestions = new Map()
            const duplicateQuestionIds = []

            for (const q of questions) {
                const key = q.prompt.toLowerCase().trim()
                if (seenQuestions.has(key)) {
                    duplicateQuestionIds.push(q.id)
                } else {
                    seenQuestions.set(key, q.id)
                }
            }

            if (duplicateQuestionIds.length > 0) {
                await prisma.question.deleteMany({
                    where: { id: { in: duplicateQuestionIds } }
                })
                totalQuestionsRemoved += duplicateQuestionIds.length
            }
        }

        // Dedupe lessons within topics
        for (const topic of remainingTopics) {
            const lessons = await prisma.lesson.findMany({
                where: { topicId: topic.id },
                orderBy: { createdAt: 'asc' }
            })

            const seenLessons = new Map()
            const duplicateLessonIds = []

            for (const lesson of lessons) {
                const key = lesson.title.toLowerCase().trim()
                if (seenLessons.has(key)) {
                    duplicateLessonIds.push(lesson.id)
                } else {
                    seenLessons.set(key, lesson.id)
                }
            }

            if (duplicateLessonIds.length > 0) {
                await prisma.lesson.deleteMany({
                    where: { id: { in: duplicateLessonIds } }
                })
                totalLessonsRemoved += duplicateLessonIds.length
            }
        }
    }

    console.log(`\n✅ Deduplication complete!`)
    console.log(`   Topics removed: ${totalTopicsRemoved}`)
    console.log(`   Lessons removed: ${totalLessonsRemoved}`)
    console.log(`   Questions removed: ${totalQuestionsRemoved}`)

    // Show final counts
    const finalTopics = await prisma.topic.count({ where: trackSlug ? { track: { slug: trackSlug } } : {} })
    const finalLessons = await prisma.lesson.count({ where: trackSlug ? { topic: { track: { slug: trackSlug } } } : {} })
    const finalQuestions = await prisma.question.count({ where: trackSlug ? { topic: { track: { slug: trackSlug } } } : {} })

    console.log(`\n📊 Final counts:`)
    console.log(`   Topics: ${finalTopics}`)
    console.log(`   Lessons: ${finalLessons}`)
    console.log(`   Questions: ${finalQuestions}`)
}

async function main() {
    const trackSlug = process.argv[2]

    try {
        await dedupeTrack(trackSlug)
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
