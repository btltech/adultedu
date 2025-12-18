/**
 * Test Interactive Content Support
 * 
 * content: Seed ordering and slider questions
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🎮 Seeding interactive test content...\n');

    // 1. Get a topic (e.g. Vectors)
    const topic = await prisma.topic.findFirst({
        where: { title: { contains: 'Vectors' } }
    });

    if (!topic) {
        console.log('❌ Could not find Vectors topic');
        return;
    }

    // 2. Create Ordering Question (Solving a linear equation)
    const orderQ = await prisma.question.create({
        data: {
            topicId: topic.id,
            ukLevelId: topic.ukLevelId,
            type: 'ordering',
            prompt: 'Arrange the steps to solve the equation: 3x + 5 = 20',
            // Options are the steps. Randomize usually, but let's just put them in correct order for answer ref
            // "correct order" indices: [0, 1, 2, 3] (if we provide them in correct order here, answer is [0,1,2,3])
            // Actually, let's provide them shuffled in options? No, let's provide steps.
            // Option 1: Subtract 5 from both sides
            // Option 2: 3x = 15
            // Option 3: Divide by 3
            // Option 4: x = 5
            options: JSON.stringify([
                'Subtract 5 from both sides',
                '3x = 15',
                'Divide by 3',
                'x = 5'
            ]),
            // Correct answer is the indices sequence [0, 1, 2, 3] relative to the options array above.
            // Wait, usually the UI shuffles them. But let's assume backend serves them in some order (usually shuffled or fixed).
            // If we serve them in logical order here [0,1,2,3], the user has to match it.
            answer: JSON.stringify([0, 1, 2, 3]),
            explanation: 'First subtract 5 to isolate the x term, resulting in 3x=15. Then divide by 3 to solve for x.',
            difficulty: 3,
            isPublished: true,
            sourceMeta: JSON.stringify({ type: 'ordering_test' })
        }
    });
    console.log(`✅ Created Ordering Question: ${orderQ.id}`);

    // 3. Create Slider Question (Estimation)
    const sliderQ = await prisma.question.create({
        data: {
            topicId: topic.id,
            ukLevelId: topic.ukLevelId,
            type: 'slider',
            prompt: 'Estimate the value of x if 2^x = 100',
            // Config: min, max, step, unit
            options: JSON.stringify([0, 10, 0.1, '']),
            // 2^6 = 64, 2^7 = 128. So x is around 6.64. Let's make answer string.
            answer: JSON.stringify(6.6),
            explanation: '2^6 is 64 and 2^7 is 128. Since 100 is roughly halfway (logarithmically), x is approx 6.64.',
            difficulty: 4,
            isPublished: true,
            sourceMeta: JSON.stringify({ type: 'slider_test' })
        }
    });
    console.log(`✅ Created Slider Question: ${sliderQ.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
