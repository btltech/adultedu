/**
 * Test Scaffolded Content Support
 * 
 * content: Seed a multi-step "Chain of Thought" question
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🔗 Seeding scaffolded test content...\n');

    const topic = await prisma.topic.findFirst({
        where: { title: { contains: 'Vectors' } }
    });

    if (!topic) {
        console.log('❌ Could not find Vectors topic');
        return;
    }

    // Create a Multi-Step Question (Scaffolded)
    const stepsConfig = {
        steps: [
            {
                prompt: "Step 1: Identify the components of vector A = (3, 4). What is the x-component?",
                options: ["3", "4", "7", "12"],
                answer: "3",
                explanation: "The first number in the coordinate pair (x, y) is the x-component."
            },
            {
                prompt: "Step 2: What is the y-component?",
                options: ["3", "4", "7", "12"],
                answer: "4",
                explanation: "The second number is the y-component."
            },
            {
                prompt: "Step 3: Calculate the magnitude |A| using Pythagoras: √(x² + y²).",
                options: ["5", "7", "12", "25"],
                answer: "5",
                explanation: "√(3² + 4²) = √(9 + 16) = √25 = 5."
            }
        ]
    };

    const multiQ = await prisma.question.create({
        data: {
            topicId: topic.id,
            ukLevelId: topic.ukLevelId,
            type: 'multi_step',
            prompt: 'Calculate the magnitude of vector A = (3, 4).',
            // Top level options/answer usually just match the final step or are "Completed"
            options: JSON.stringify(["Completed"]),
            answer: JSON.stringify("Completed"),
            explanation: 'The magnitude is 5.',
            difficulty: 4,
            isPublished: true,
            assets: JSON.stringify(stepsConfig), // Store steps here
            sourceMeta: JSON.stringify({ type: 'scaffolded_test' })
        }
    });

    console.log(`✅ Created Scaffolded Question: ${multiQ.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
