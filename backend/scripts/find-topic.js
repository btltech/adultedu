
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findTopic() {
    const topic = await prisma.topic.findFirst({
        where: { title: 'Money and Finance' },
        include: { track: true }
    })

    if (topic) {
        console.log(`Found Topic: ${topic.title}`)
        console.log(`ID: ${topic.id}`)
        console.log(`Track: ${topic.track.title}`)
    } else {
        console.log('Topic not found')
    }
}

findTopic().finally(() => prisma.$disconnect())
