/**
 * Script to fix answer distribution by shuffling options
 * This randomizes the order of options and updates the answer index accordingly
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function fixAnswerDistribution() {
    console.log('🔄 Starting answer distribution fix...\n');

    // Get all MCQ questions
    const questions = await prisma.question.findMany({
        where: {
            type: 'mcq',
            isPublished: true,
        },
        select: {
            id: true,
            prompt: true,
            options: true,
            answer: true,
            topicId: true,
        }
    });

    console.log(`Found ${questions.length} MCQ questions to process\n`);

    let updated = 0;
    let errors = 0;

    for (const q of questions) {
        try {
            // Parse options
            let options;
            try {
                options = JSON.parse(q.options);
            } catch {
                continue; // Skip if options aren't valid JSON
            }

            if (!Array.isArray(options) || options.length < 2) continue;

            // Parse current answer (could be index or string)
            let currentAnswerIndex;
            let answerValue;

            try {
                const parsed = JSON.parse(q.answer);
                if (typeof parsed === 'number' && parsed >= 0 && parsed < options.length) {
                    currentAnswerIndex = parsed;
                    answerValue = options[currentAnswerIndex];
                } else if (typeof parsed === 'string') {
                    currentAnswerIndex = options.indexOf(parsed);
                    answerValue = parsed;
                }
            } catch {
                // Answer might be a raw string
                currentAnswerIndex = options.indexOf(q.answer);
                answerValue = q.answer;
            }

            if (currentAnswerIndex === -1 || !answerValue) {
                continue; // Skip if we can't determine the correct answer
            }

            // Shuffle options
            const shuffledOptions = await shuffleArray(options);

            // Find new index of correct answer
            const newAnswerIndex = shuffledOptions.indexOf(answerValue);

            if (newAnswerIndex === -1) {
                console.warn(`⚠️  Skipping ${q.id}: Answer not found after shuffle`);
                continue;
            }

            // Update the question
            await prisma.question.update({
                where: { id: q.id },
                data: {
                    options: JSON.stringify(shuffledOptions),
                    answer: JSON.stringify(newAnswerIndex),
                }
            });

            updated++;
        } catch (err) {
            console.error(`❌ Error processing ${q.id}:`, err.message);
            errors++;
        }
    }

    console.log(`\n✅ Updated ${updated} questions`);
    console.log(`❌ Errors: ${errors}`);

    // Show new distribution
    console.log('\n📊 New answer distribution:');
    const updatedQuestions = await prisma.question.findMany({
        where: { topicId: 'eds-2', isPublished: true, type: 'mcq' },
        select: { answer: true }
    });

    const dist = { '0': 0, '1': 0, '2': 0, '3': 0 };
    for (const q of updatedQuestions) {
        try {
            const ans = JSON.parse(q.answer);
            if (['0', '1', '2', '3'].includes(String(ans))) {
                dist[String(ans)]++;
            }
        } catch { }
    }

    console.log('A (0):', dist['0']);
    console.log('B (1):', dist['1']);
    console.log('C (2):', dist['2']);
    console.log('D (3):', dist['3']);

    await prisma.$disconnect();
}

fixAnswerDistribution().catch(console.error);
