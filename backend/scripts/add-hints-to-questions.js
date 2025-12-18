/**
 * Script to add sample hints to questions for testing
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Sample hints for different question types
const sampleHints = [
    [
        "Think about what the question is really asking.",
        "Consider eliminating obviously wrong answers first.",
        "Look for keywords in the question that point to the answer."
    ],
    [
        "Break down the problem into smaller parts.",
        "What do you already know that relates to this?",
        "Try working backwards from the answer choices."
    ],
    [
        "Read each option carefully before choosing.",
        "Is there a pattern or rule you can identify?",
        "Think about real-world examples."
    ]
];

async function addHintsToQuestions() {
    console.log('🔄 Adding hints to questions...\n');

    // Get questions without hints
    const questions = await prisma.question.findMany({
        where: { isPublished: true },
        take: 100,
        select: { id: true, sourceMeta: true }
    });

    let updated = 0;

    for (const q of questions) {
        // Parse existing sourceMeta
        let meta = {};
        try {
            meta = q.sourceMeta ? JSON.parse(q.sourceMeta) : {};
        } catch {
            meta = {};
        }

        // Skip if hints already exist
        if (meta.hints && meta.hints.length > 0) continue;

        // Add random hints
        const hintSet = sampleHints[Math.floor(Math.random() * sampleHints.length)];
        meta.hints = hintSet;

        await prisma.question.update({
            where: { id: q.id },
            data: {
                sourceMeta: JSON.stringify(meta),
            }
        });

        updated++;
    }

    console.log(`✅ Added hints to ${updated} questions`);

    await prisma.$disconnect();
}

addHintsToQuestions().catch(console.error);
