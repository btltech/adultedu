
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDistribution() {
    const levels = await prisma.ukLevel.findMany({ include: { questions: { select: { id: true } } } });
    const tracks = await prisma.track.findMany({
        include: {
            topics: {
                include: {
                    questions: { select: { id: true, type: true } }
                }
            }
        }
    });

    console.log('--- Breakdown by UK Level ---');
    levels.forEach(l => {
        console.log(`${l.code}: ${l.questions.length} questions`);
    });

    console.log('\n--- Breakdown by Track ---');
    tracks.forEach(t => {
        const total = t.topics.reduce((acc, topic) => acc + topic.questions.length, 0);
        const scenarios = t.topics.reduce((acc, topic) => acc + topic.questions.filter(q => q.type === 'scenario').length, 0);
        console.log(`${t.slug} (${t.title}): ${total} total`);
        if (total < 50) console.log(`   ⚠️ LOW COVERAGE`);
    });
}

analyzeDistribution().finally(() => prisma.$disconnect());
