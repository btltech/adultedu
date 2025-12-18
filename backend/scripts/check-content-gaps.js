/**
 * Check for content gaps (empty topics, empty lessons)
 * 
 * Usage: node scripts/check-content-gaps.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkGaps() {
    console.log('\n🔍 Scanning for content gaps...\n')

    // 1. Topics without questions
    const topics = await prisma.topic.findMany({
        include: {
            _count: {
                select: { questions: true, lessons: true }
            },
            track: { select: { title: true } }
        }
    })

    const emptyTopics = topics.filter(t => t._count.questions === 0)

    console.log(`📉 Topics with 0 Questions: ${emptyTopics.length}`)
    if (emptyTopics.length > 0) {
        emptyTopics.forEach(t => {
            console.log(`   - [${t.track.title}] ${t.title}`)
        })
    }

    // 2. Lessons without content
    const lessons = await prisma.lesson.findMany({
        select: {
            id: true,
            title: true,
            contentBlocks: true,
            topic: { select: { title: true, track: { select: { title: true } } } }
        }
    })

    const emptyLessons = lessons.filter(l => {
        try {
            const blocks = JSON.parse(l.contentBlocks || '[]')
            return !Array.isArray(blocks) || blocks.length === 0
        } catch {
            return true
        }
    })

    console.log(`\n📉 Lessons with No Content: ${emptyLessons.length}`)
    if (emptyLessons.length > 0) {
        emptyLessons.forEach(l => {
            console.log(`   - [${l.topic.track.title}] ${l.title}`)
        })
    }

    // 3. Tracks without topics
    const tracks = await prisma.track.findMany({
        include: {
            _count: { select: { topics: true } }
        }
    })

    const emptyTracks = tracks.filter(t => t._count.topics === 0)
    console.log(`\n📉 Tracks with 0 Topics: ${emptyTracks.length}`)
    if (emptyTracks.length > 0) {
        emptyTracks.forEach(t => {
            console.log(`   - ${t.title}`)
        })
    }
}

async function main() {
    try {
        await checkGaps()
    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
