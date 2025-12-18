
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Attempts for Progress Testing...')

    const email = 'admin@adultedu.com' // Using admin as test user since we have credentials
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) throw new Error('User not found')

    // Get EDS Track questions
    const track = await prisma.track.findUnique({
        where: { slug: 'essential-digital-skills' },
        include: { topics: { include: { questions: true } } }
    })

    if (!track) throw new Error('Track not found')

    // 1. Topic 1: 100% Mastery
    const topic1 = track.topics[0]
    console.log(`Mastering Topic 1: ${topic1.title} (${topic1.questions.length} questions)`)

    for (const q of topic1.questions) {
        await prisma.attempt.create({
            data: {
                userId: user.id,
                questionId: q.id,
                isCorrect: true,
                userAnswer: '0',
                timeSpentSec: 10
            }
        })
    }

    // 2. Topic 2: 50% Mastery (approx)
    const topic2 = track.topics[1]
    console.log(`Partial Mastery Topic 2: ${topic2.title} (${topic2.questions.length} questions)`)

    let count = 0
    for (const q of topic2.questions) {
        if (count % 2 === 0) { // Every other question
            await prisma.attempt.create({
                data: {
                    userId: user.id,
                    questionId: q.id,
                    isCorrect: true,
                    userAnswer: '0',
                    timeSpentSec: 10
                }
            })
        }
        count++
    }

    // Ensure enrollment
    await prisma.enrollment.upsert({
        where: {
            userId_trackId: {
                userId: user.id,
                trackId: track.id
            }
        },
        update: {},
        create: {
            userId: user.id,
            trackId: track.id
        }
    })

    console.log('✅ Attempts seeded!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
