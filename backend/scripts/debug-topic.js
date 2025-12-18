
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Topic EDS-1 ---');

    // Try to find by ID if it's a UUID, but 'eds-1' looks like a slug (though the schema uses UUIDs for ID usually, but maybe it was seeded with string ID?)
    // The previous logs showed 'gcse-4' was used as an ID? Or at least a topicId param.
    // Let's check both ID and Title/Search.

    const id = 'eds-1';
    const topic = await prisma.topic.findUnique({
        where: { id: id },
        include: { track: true }
    });

    console.log(`Topic by ID '${id}':`, topic ? 'FOUND' : 'NOT FOUND');

    if (!topic) {
        console.log('Searching all topics...');
        const allTopics = await prisma.topic.findMany({
            take: 20,
            select: { id: true, title: true, trackId: true }
        });
        console.log('Available Topics:', allTopics);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
