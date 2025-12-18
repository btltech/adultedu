
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔗 Linking Topics to Outcomes...')

    // Get EDS Framework
    const edsFramework = await prisma.framework.findUnique({ where: { slug: 'EDS' } })
    if (!edsFramework) throw new Error('EDS Framework not found')

    // Get EDS Track
    const edsTrack = await prisma.track.findUnique({ where: { slug: 'essential-digital-skills' } })
    if (!edsTrack) throw new Error('EDS Track not found')

    // Get EDS Topics
    const topics = await prisma.topic.findMany({
        where: { trackId: edsTrack.id },
        orderBy: { sortOrder: 'asc' }
    })

    // Get EDS Outcomes
    const outcomes = await prisma.outcome.findMany({
        where: { frameworkId: edsFramework.id }
    })

    console.log(`Found ${topics.length} topics and ${outcomes.length} outcomes`)

    let outcomeIndex = 0
    for (const topic of topics) {
        // Assign 2 outcomes per topic
        const outcomesForTopic = outcomes.slice(outcomeIndex, outcomeIndex + 2)
        outcomeIndex = (outcomeIndex + 2) % outcomes.length

        for (const outcome of outcomesForTopic) {
            await prisma.topicOutcome.upsert({
                where: {
                    topicId_outcomeId: {
                        topicId: topic.id,
                        outcomeId: outcome.id
                    }
                },
                update: {},
                create: {
                    topicId: topic.id,
                    outcomeId: outcome.id
                }
            })
            console.log(`   Linked ${topic.title.substring(0, 20)}... -> ${outcome.code}`)
        }
    }

    console.log('✅ Topic Outcomes seeded!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
