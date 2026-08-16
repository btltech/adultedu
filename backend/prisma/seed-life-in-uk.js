/**
 * Life in the UK Seed Script
 * Creates the Life in the UK test preparation track with topics and questions
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function main() {
    console.log('🇬🇧 Seeding Life in the UK content...\n')

    // Get the Life in UK framework
    const framework = await prisma.framework.findUnique({
        where: { slug: 'LIFEUK' }
    })

    if (!framework) {
        throw new Error('Life in the UK framework not found. Run main seed first.')
    }

    console.log(`📋 Using framework: ${framework.title}`)

    // Get Entry Level 3 (appropriate for citizenship test)
    const ukLevel = await prisma.ukLevel.findUnique({
        where: { code: 'L3' }
    })

    if (!ukLevel) {
        throw new Error('Entry Level 3 not found')
    }

    // Create the Life in the UK track
    const track = await prisma.track.upsert({
        where: { slug: 'life-in-the-uk-test' },
        update: {},
        create: {
            slug: 'life-in-the-uk-test',
            title: 'Life in the UK Test Preparation',
            description: 'Comprehensive preparation for the Life in the United Kingdom test required for British citizenship and settlement applications. Covers all topics from the official handbook including British values, history, society, and government.',
            category: 'qual_prep',
            isLive: true,
            trackFrameworks: {
                create: { frameworkId: framework.id }
            }
        }
    })

    console.log(`📚 Created track: ${track.title}`)

    // Define topics based on handbook chapters
    const topics = [
        {
            id: 'life-uk-values',
            title: 'The Values and Principles of the UK',
            description: 'British values, democracy, rule of law, individual liberty, and mutual respect and tolerance.',
            sortOrder: 1
        },
        {
            id: 'life-uk-geography',
            title: 'What is the UK?',
            description: 'Geography, climate, population, languages, and the four nations that make up the United Kingdom.',
            sortOrder: 2
        },
        {
            id: 'life-uk-history',
            title: 'A Long and Illustrious History',
            description: 'Key historical events, figures, and developments that have shaped the United Kingdom.',
            sortOrder: 3
        },
        {
            id: 'life-uk-society',
            title: 'A Modern, Thriving Society',
            description: 'Education, healthcare, employment, welfare system, and everyday life in modern Britain.',
            sortOrder: 4
        },
        {
            id: 'life-uk-government',
            title: 'The UK Government, the Law and Your Role',
            description: 'Government structure, voting, legal system, and citizens\' responsibilities and rights.',
            sortOrder: 5
        }
    ]

    // Create topics
    for (const topicData of topics) {
        const topic = await prisma.topic.upsert({
            where: { id: topicData.id },
            update: {},
            create: {
                id: topicData.id,
                title: topicData.title,
                description: topicData.description,
                sortOrder: topicData.sortOrder,
                trackId: track.id,
                ukLevelId: ukLevel.id
            }
        })
        console.log(`   ✓ Created topic: ${topic.title}`)
    }

    // Load and seed questions
    const questionsFile = path.join(__dirname, '..', 'exports', 'life-in-uk-questions-final.json')

    if (fs.existsSync(questionsFile)) {
        console.log('\n❓ Seeding questions...')

        const questionsData = JSON.parse(fs.readFileSync(questionsFile, 'utf8'))
        let questionCount = 0

        for (const q of questionsData) {
            // Find the topic by title (since topicId might not be set)
            let topic;
            if (q.topicId) {
                topic = await prisma.topic.findUnique({
                    where: { id: q.topicId }
                })
            } else if (q.topicTitle) {
                topic = await prisma.topic.findFirst({
                    where: { 
                        title: q.topicTitle,
                        trackId: track.id
                    }
                })
            }

            if (!topic) {
                console.warn(`⚠️  Topic not found for question: ${q.topicTitle || q.topicId}, skipping`)
                continue
            }

            // Convert difficulty to proper format (1-5 scale)
            const difficultyMap = {
                'easy': 2,
                'medium': 3,
                'hard': 4
            }

            const question = await prisma.question.create({
                data: {
                    topicId: topic.id,
                    ukLevelId: ukLevel.id,
                    prompt: q.prompt,
                    options: JSON.stringify(q.options),
                    answer: q.answer,
                    explanation: q.explanation,
                    type: 'mcq',
                    difficulty: difficultyMap[q.difficulty] || 3,
                    isPublished: true
                }
            })

            questionCount++
        }

        console.log(`   ✓ Created ${questionCount} questions`)
    } else {
        console.log('⚠️  Questions file not found. Run generate-life-in-uk-questions.js first.')
    }

    console.log('\n✅ Life in the UK content seeded successfully!')
    console.log(`📊 Track: ${track.title}`)
    console.log(`📚 Topics: ${topics.length}`)
    console.log(`❓ Questions: Check database for count`)
}

main()
    .catch((e) => {
        console.error('❌ Error seeding Life in the UK content:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })