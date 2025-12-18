
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- Debugging Practice Route Queries ---');

    const topicId = 'gcse-4';
    console.log(`Fetching topic: ${topicId}`);

    try {
        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: { track: true, ukLevel: true },
        })
        console.log('Topic found:', topic ? 'YES' : 'NO');
        if (topic) console.log('Topic Level:', topic.ukLevel);

        if (!topic) return;

        console.log('Fetching questions...');
        const questions = await prisma.question.findMany({
            where: {
                topicId,
                isPublished: true,
            },
            take: 10,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                ukLevel: true
            }
        })
        console.log(`Questions found: ${questions.length}`);

        console.log('Formatting questions...');
        const formattedQuestions = questions.map(q => {
            let options = null;
            try { options = q.options ? JSON.parse(q.options) : null } catch (e) { }

            let levelCode = 'L1';
            if (q.ukLevel && q.ukLevel.code) {
                levelCode = q.ukLevel.code;
            } else if (topic.ukLevel && topic.ukLevel.code) {
                levelCode = topic.ukLevel.code;
            }

            console.log(`Q ID: ${q.id}, Level: ${levelCode}`);
            return { id: q.id, ukLevel: levelCode };
        });
        console.log('Formatting success.');

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
