const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    const users = await prisma.user.count();
    const questions = await prisma.question.count();
    const tracks = await prisma.track.count();
    const enrollments = await prisma.enrollment.count();

    console.log('--- GLOBAL COUNTS ---');
    console.log(`Users: ${users}`);
    console.log(`Questions: ${questions}`);
    const publishedQuestions = await prisma.question.count({ where: { isPublished: true } });
    const draftQuestions = await prisma.question.count({ where: { isPublished: false } });
    console.log(`Published: ${publishedQuestions}`);
    console.log(`Draft: ${draftQuestions}`);
    console.log(`Tracks: ${tracks}`);
    console.log(`Enrollments: ${enrollments}`);

    console.log('\n--- QUESTIONS BY TRACK ---');
    // Group by topic.trackId (nested) isn't directly supported in groupBy, easier to raw query or iterate
    // Let's do a simple group by topic first
    // Actually, easiest to just fetch counts per track using mapping if number is small
    const allTracks = await prisma.track.findMany({
        include: {
            topics: {
                include: {
                    _count: {
                        select: { questions: true }
                    }
                }
            }
        }
    });

    for (const t of allTracks) {
        const qCount = t.topics.reduce((acc, topic) => acc + topic._count.questions, 0);
        console.log(`${t.title}: ${qCount}`);
    }
})();
