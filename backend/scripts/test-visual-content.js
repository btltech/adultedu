/**
 * Test Visual Question Support
 * 
 * content: Test generation with visual prompts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🖼️ Seeding visual test content...\n');

    // 1. Get a topic to attach to (use GCSE Maths)
    const topic = await prisma.topic.findFirst({
        where: { title: { contains: 'Geometry' } }
    });

    if (!topic) {
        console.log('❌ Could not find Geometry topic');
        return;
    }

    // 2. Create a visual question
    // Using a placeholder image for testing
    const visualQuestion = await prisma.question.create({
        data: {
            topicId: topic.id,
            ukLevelId: topic.ukLevelId,
            type: 'mcq',
            prompt: 'Calculate the area of the shaded region in the circle below.',
            imageUrl: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Circle+Diagram',
            options: JSON.stringify(['12π', '24π', '36π', '48π']),
            answer: JSON.stringify(1),
            explanation: 'The radius is 6, so total area is 36π. The sector is 240 degrees (2/3 of circle). Area = 2/3 * 36π = 24π.',
            difficulty: 3,
            isPublished: true,
            sourceMeta: JSON.stringify({ type: 'visual_test' })
        }
    });

    console.log(`✅ Created Visual Question: ${visualQuestion.id}`);
    console.log(`   Topic: ${topic.title}`);
    console.log(`   Image: ${visualQuestion.imageUrl}`);
    console.log('\nRun the app and navigate to this topic to see the image.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
