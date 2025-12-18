import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const lessons = await prisma.lesson.findMany({
        where: {
            topic: {
                track: {
                    slug: 'python-mastery'
                }
            }
        },
        include: {
            topic: true
        }
    })

    console.log('--- GENERATED LESSONS ---')
    lessons.forEach(l => {
        console.log(`Topic: ${l.topic.title} | Lesson: ${l.title}`)
    })

    const questionBreakdown = await prisma.question.groupBy({
        by: ['topicId'],
        where: {
            topic: {
                track: {
                    slug: 'python-mastery'
                }
            }
        },
        _count: {
            id: true
        }
    })

    console.log('\n--- QUESTION DISTRIBUTION ---')
    for (const item of questionBreakdown) {
        const topic = await prisma.topic.findUnique({ where: { id: item.topicId } })
        console.log(`Topic: ${topic.title} | Questions: ${item._count.id}`)
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
