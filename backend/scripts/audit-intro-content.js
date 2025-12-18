/**
 * Audit Topics for Missing Introduction Content
 * 
 * This script checks all topics to ensure they have lesson content
 * (introduction) before learners are presented with practice questions.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Auditing Topics for Missing Introduction Content...\n');

    const topics = await prisma.topic.findMany({
        include: {
            track: { select: { title: true, slug: true } },
            _count: {
                select: { lessons: true, questions: true }
            }
        },
        orderBy: [
            { track: { title: 'asc' } },
            { sortOrder: 'asc' }
        ]
    });

    // Find topics with questions but no lessons
    const missingIntro = topics.filter(t => t._count.lessons === 0 && t._count.questions > 0);

    // Find topics with neither lessons nor questions
    const emptyTopics = topics.filter(t => t._count.lessons === 0 && t._count.questions === 0);

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Topics: ${topics.length}`);
    console.log(`Topics with Lessons: ${topics.filter(t => t._count.lessons > 0).length}`);
    console.log(`Topics Missing Intro (has questions, no lessons): ${missingIntro.length}`);
    console.log(`Empty Topics (no lessons, no questions): ${emptyTopics.length}`);
    console.log();

    if (missingIntro.length > 0) {
        console.log('⚠️  TOPICS MISSING INTRODUCTION (Practice Only):');
        console.log('-'.repeat(60));

        let currentTrack = '';
        for (const topic of missingIntro) {
            if (topic.track.title !== currentTrack) {
                currentTrack = topic.track.title;
                console.log(`\n📚 ${currentTrack}`);
            }
            console.log(`   • ${topic.title} (${topic._count.questions} questions)`);
        }
        console.log();
    }

    if (emptyTopics.length > 0) {
        console.log('❌ EMPTY TOPICS (No content at all):');
        console.log('-'.repeat(60));

        let currentTrack = '';
        for (const topic of emptyTopics) {
            if (topic.track.title !== currentTrack) {
                currentTrack = topic.track.title;
                console.log(`\n📚 ${currentTrack}`);
            }
            console.log(`   • ${topic.title}`);
        }
        console.log();
    }

    // Output JSON for programmatic use
    const report = {
        total: topics.length,
        withLessons: topics.filter(t => t._count.lessons > 0).length,
        missingIntro: missingIntro.map(t => ({
            id: t.id,
            title: t.title,
            trackSlug: t.track.slug,
            trackTitle: t.track.title,
            questionCount: t._count.questions
        })),
        emptyTopics: emptyTopics.map(t => ({
            id: t.id,
            title: t.title,
            trackSlug: t.track.slug,
            trackTitle: t.track.title
        }))
    };

    console.log('\n📊 JSON Report:');
    console.log(JSON.stringify(report, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
