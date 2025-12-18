
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDistribution() {
    console.log('📊 Checking question distribution...\n')

    const topics = await prisma.topic.findMany({
        include: {
            track: true,
            _count: {
                select: { questions: true }
            }
        },
        orderBy: {
            track: { title: 'asc' }
        }
    })

    const lowCountTopics = topics.filter(t => t._count.questions < 20)

    if (lowCountTopics.length > 0) {
        console.log('⚠️  The following topics have fewer than 20 questions:')
        lowCountTopics.forEach(t => {
            console.log(`   - [${t.track.title}] ${t.title}: ${t._count.questions} questions`)
        })
    } else {
        console.log('✅ All topics have at least 20 questions.')
    }

    console.log(`\nTotal Topics: ${topics.length}`)
    console.log(`Lowest Count: ${Math.min(...topics.map(t => t._count.questions))}`)
    console.log(`Average Count: ${Math.round(topics.reduce((acc, t) => acc + t._count.questions, 0) / topics.length)}`)
}

checkDistribution().finally(() => prisma.$disconnect())
