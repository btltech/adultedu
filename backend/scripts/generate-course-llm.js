/**
 * Script to generate a course using Local LLM
 * Usage: node scripts/generate-course-llm.js "Course Title" "Course Description"
 */

import prisma from '../src/lib/db.js';
import { generateJSON } from '../src/lib/llm.js';

const COURSE_TITLE = process.argv[2] || 'Business English';
const COURSE_DESC = process.argv[3] || 'Master professional communication for the workplace.';

async function main() {
    console.log(`🚀 Generating course "${COURSE_TITLE}" using Local LLM...`);

    // 1. Generate Course Structure (Topics)
    console.log('   🤖 Generating topics...');
    const structurePrompt = `
        Create a course outline for "${COURSE_TITLE}".
        Description: ${COURSE_DESC}
        Target Audience: Adults / Entry Level 3.
        
        Generate 5 distinct topics.
        Return a JSON object with this structure:
        {
            "category": "workplace",
            "topics": [
                { "title": "Topic 1", "description": "Brief description" },
                ...
            ]
        }
    `;

    const structure = await generateJSON(structurePrompt, 'You are an explicit curriculum designer. Output JSON only.');
    console.log(`   ✅ Generated ${structure.topics.length} topics`);

    // 2. Create Track in DB
    const slug = COURSE_TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const framework = await prisma.framework.findFirst();
    const ukLevel = await prisma.ukLevel.findFirst({ where: { code: 'E3' } }) || await prisma.ukLevel.findFirst();

    // Check existing
    const existing = await prisma.track.findUnique({ where: { slug } });
    if (existing) {
        console.log('   ⚠️ Deleting existing track...');
        await prisma.track.delete({ where: { slug } });
    }

    const track = await prisma.track.create({
        data: {
            slug,
            title: COURSE_TITLE,
            description: COURSE_DESC,
            category: structure.category || 'workplace',
            isLive: true,
            trackFrameworks: {
                create: { frameworkId: framework.id }
            }
        }
    });

    // 3. Generate Questions for each Topic
    for (const [index, topicData] of structure.topics.entries()) {
        console.log(`   📖 Processing Topic ${index + 1}: ${topicData.title}`);

        const topic = await prisma.topic.create({
            data: {
                trackId: track.id,
                title: topicData.title,
                description: topicData.description,
                sortOrder: index + 1,
                ukLevelId: ukLevel.id
            }
        });

        const questionsPrompt = `
            Generate 5 multiple-choice questions for the topic: "${topicData.title}"
            Context: Course "${COURSE_TITLE}" - ${topicData.description}
            Level: Beginner / Entry Level 3.
            
            Return a JSON array of objects:
            [
                {
                    "prompt": "Question text?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "Option A" (must match one option exactly),
                    "explanation": "Why this is correct."
                }
            ]
        `;

        try {
            const questions = await generateJSON(questionsPrompt, 'You are an exam writer. Output valid JSON array only.');

            for (const q of questions) {
                await prisma.question.create({
                    data: {
                        topicId: topic.id,
                        ukLevelId: ukLevel.id,
                        type: 'mcq',
                        prompt: q.prompt,
                        options: JSON.stringify(q.options),
                        answer: JSON.stringify(q.answer),
                        explanation: q.explanation,
                        difficulty: 2,
                        isPublished: true
                    }
                });
            }
            console.log(`      ✅ Generated ${questions.length} questions`);
        } catch (err) {
            console.error(`      ❌ Failed to generate questions for ${topicData.title}:`, err.message);
        }
    }

    console.log(`\n🎉 Course "${COURSE_TITLE}" created successfully!`);
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
