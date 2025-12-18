/**
 * Script to expand an existing course with more questions using Local LLM
 * Usage: node scripts/expand-course-llm.js "course-slug" [questions_per_topic]
 */

import prisma from '../src/lib/db.js';
import { generateJSON } from '../src/lib/llm.js';

const COURSE_SLUG = process.argv[2];
const QUESTIONS_TO_ADD = parseInt(process.argv[3]) || 10;

if (!COURSE_SLUG) {
    console.error('Please provide a course slug.');
    process.exit(1);
}

async function main() {
    // 1. Fetch Course and Topics
    const track = await prisma.track.findUnique({
        where: { slug: COURSE_SLUG },
        include: { topics: { include: { questions: true } } }
    });

    if (!track) {
        console.error(`Course "${COURSE_SLUG}" not found.`);
        process.exit(1);
    }

    console.log(`🚀 Expanding course: "${track.title}"`);
    console.log(`   📝 Found ${track.topics.length} topics`);
    console.log(`   🎯 Target: Adding ${QUESTIONS_TO_ADD} new questions per topic\n`);

    // 2. Iterate Logic
    for (const topic of track.topics) {
        console.log(`   📖 Topic: ${topic.title} (Current: ${topic.questions.length})`);

        // Context for LLM to avoid duplicates (sending prompts of existing questions)
        const existingPrompts = topic.questions.map(q => q.prompt).slice(0, 10).join('\n- ');

        const prompt = `
            Generate ${QUESTIONS_TO_ADD} *NEW* multiple-choice questions for the topic: "${topic.title}".
            Course Context: "${track.title}" - ${topic.description}
            Level: Entry Level 3 / Beginner.
            
            IMPORTANT: Do NOT duplicate these existing questions:
            - ${existingPrompts}

            Return a valid JSON array of objects:
            [
                {
                    "prompt": "Question text?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Option A" (must match one option exactly),
                    "explanation": "Brief explanation."
                }
            ]
        `;

        try {
            console.log(`      🤖 Generating questions...`);
            const newQuestions = await generateJSON(prompt, 'You are an exam writer. Output valid JSON array only.');

            let addedCount = 0;
            for (const q of newQuestions) {
                // Double check for duplicates
                const isDuplicate = topic.questions.some(eq => eq.prompt.toLowerCase() === q.prompt.toLowerCase());
                if (isDuplicate) continue;

                await prisma.question.create({
                    data: {
                        topicId: topic.id,
                        ukLevelId: topic.questions[0]?.ukLevelId || (await prisma.ukLevel.findFirst()).id,
                        type: 'mcq',
                        prompt: q.prompt,
                        options: JSON.stringify(q.options),
                        answer: JSON.stringify(q.answer),
                        explanation: q.explanation,
                        difficulty: 2,
                        isPublished: true
                    }
                });
                addedCount++;
            }
            console.log(`      ✅ Added ${addedCount} new questions`);

        } catch (err) {
            console.error(`      ❌ Failed to generate for ${topic.title}:`, err.message);
        }
    }

    console.log(`\n🎉 Expansion complete for "${track.title}"!`);
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
