/**
 * Merge gcse-english into gcse-english-language
 * - Move unique topics from gcse-english to gcse-english-language
 * - Delete the old gcse-english track
 */

import prisma from '../src/lib/db.js'

async function main() {
    console.log('🔀 Merging GCSE English courses...\n')

    // Get both tracks
    const sourceTrack = await prisma.track.findUnique({
        where: { slug: 'gcse-english' },
        include: {
            topics: {
                include: {
                    lessons: true,
                    questions: true
                }
            }
        }
    })

    const targetTrack = await prisma.track.findUnique({
        where: { slug: 'gcse-english-language' },
        include: { topics: true }
    })

    if (!sourceTrack) {
        console.log('❌ Source track (gcse-english) not found')
        return
    }
    if (!targetTrack) {
        console.log('❌ Target track (gcse-english-language) not found')
        return
    }

    console.log(`📚 Source: ${sourceTrack.title}`)
    console.log(`   Topics: ${sourceTrack.topics.length}`)
    console.log(`   Questions: ${sourceTrack.topics.reduce((sum, t) => sum + t.questions.length, 0)}`)
    console.log(`   Lessons: ${sourceTrack.topics.reduce((sum, t) => sum + t.lessons.length, 0)}`)

    console.log(`\n📚 Target: ${targetTrack.title}`)
    console.log(`   Topics: ${targetTrack.topics.length}`)

    // Get existing topic titles in target to avoid exact duplicates
    const existingTitles = new Set(targetTrack.topics.map(t => t.title.toLowerCase()))

    // Get max sort order in target
    const maxSortOrder = Math.max(...targetTrack.topics.map(t => t.sortOrder), 0)

    let movedTopics = 0
    let movedQuestions = 0
    let movedLessons = 0

    console.log('\n🔄 Moving topics...')

    for (const topic of sourceTrack.topics) {
        // Check if similar topic exists (by title)
        if (existingTitles.has(topic.title.toLowerCase())) {
            console.log(`   ⏭ Skipping "${topic.title}" (similar exists)`)
            continue
        }

        // Move topic to target track
        await prisma.topic.update({
            where: { id: topic.id },
            data: {
                trackId: targetTrack.id,
                sortOrder: maxSortOrder + movedTopics + 1
            }
        })

        movedTopics++
        movedQuestions += topic.questions.length
        movedLessons += topic.lessons.length
        console.log(`   ✅ Moved "${topic.title}" (${topic.questions.length} questions, ${topic.lessons.length} lessons)`)
    }

    // Delete the source track (any remaining topics will be cascade deleted)
    console.log('\n🗑️ Deleting old gcse-english track...')
    await prisma.track.delete({ where: { slug: 'gcse-english' } })

    // Update description of merged track
    await prisma.track.update({
        where: { slug: 'gcse-english-language' },
        data: {
            description: 'Comprehensive GCSE English Language preparation covering reading comprehension, fiction and non-fiction analysis, creative and transactional writing, grammar, punctuation, and exam skills.'
        }
    })

    console.log('\n✅ Merge complete!')
    console.log(`   Moved: ${movedTopics} topics, ${movedQuestions} questions, ${movedLessons} lessons`)

    // Final count
    const finalTrack = await prisma.track.findUnique({
        where: { slug: 'gcse-english-language' },
        include: { topics: { include: { questions: true, lessons: true } } }
    })

    console.log(`\n📊 Final ${finalTrack.title}:`)
    console.log(`   Topics: ${finalTrack.topics.length}`)
    console.log(`   Questions: ${finalTrack.topics.reduce((sum, t) => sum + t.questions.length, 0)}`)
    console.log(`   Lessons: ${finalTrack.topics.reduce((sum, t) => sum + t.lessons.length, 0)}`)
}

main()
    .catch(e => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
