
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📊 Content Report\n')

    const tracks = await prisma.track.findMany({
        include: {
            topics: {
                include: {
                    _count: {
                        select: { questions: true }
                    }
                }
            }
        }
    })

    let totalQuestions = 0

    for (const track of tracks) {
        console.log(`\n📘 ${track.title}`)
        let trackTotal = 0
        for (const topic of track.topics) {
            const count = topic._count.questions
            trackTotal += count
            totalQuestions += count
            console.log(`   - ${topic.title}: ${count}`)
        }
        console.log(`   👉 Track Total: ${trackTotal}`)
    }

    console.log(`\n===================================`)
    console.log(`🌟 Grand Total: ${totalQuestions}`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
