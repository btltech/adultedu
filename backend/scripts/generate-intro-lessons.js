/**
 * Generate Introduction Lessons for Topics Missing Content
 * 
 * This script generates lesson content for topics that have questions
 * but no introduction lessons, using a local LLM.
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const LLM_URL = process.env.LLM_URL || 'http://localhost:1234';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct-mlx';

async function callLLM(prompt) {
    try {
        const response = await fetch(`${LLM_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert UK educational content creator for AdultEdu.
Create engaging, accessible lesson content aligned with UK qualification frameworks.
Use UK English spelling and terminology.
Output strictly valid JSON.`
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!response.ok) throw new Error(`LLM Error: ${response.status}`);
        const data = await response.json();
        let content = data.choices[0]?.message?.content || '{}';

        // Clean markdown
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        // Handle thinking tags if present
        if (content.includes('<think>')) {
            content = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        }

        return JSON.parse(content);
    } catch (e) {
        console.error("LLM Generation Failed:", e.message);
        return null;
    }
}

async function generateLesson(topic, trackTitle) {
    const prompt = `Create an introductory lesson for the topic "${topic.title}" in the course "${trackTitle}".
Topic description: ${topic.description || 'No description provided'}

Return a JSON object with:
{
  "title": "Introduction to [Topic]",
  "summary": "1-2 sentence summary of what learners will understand after this lesson",
  "estMinutes": 10-15,
  "contentBlocks": [
    { "type": "heading", "content": "Main heading" },
    { "type": "paragraph", "content": "Introductory text..." },
    { "type": "subheading", "content": "Key concept 1" },
    { "type": "paragraph", "content": "Explanation..." },
    { "type": "list", "items": ["Point 1", "Point 2", "Point 3"] },
    { "type": "callout", "variant": "tip", "content": "Helpful tip..." }
  ]
}

Requirements:
- 5-8 content blocks
- Include at least one list or callout
- Use UK English
- Make content practical and accessible for adult learners
- Cover the key foundational concepts for this topic`;

    return await callLLM(prompt);
}

async function main() {
    console.log('📚 Generating Introduction Lessons for Topics Missing Content...\n');
    console.log(`LLM: ${LLM_URL}`);
    console.log(`Model: ${LLM_MODEL}\n`);

    // Find topics with questions but no lessons
    const topics = await prisma.topic.findMany({
        where: {
            lessons: { none: {} }
        },
        include: {
            track: { select: { title: true } },
            _count: { select: { questions: true } }
        },
        orderBy: [
            { track: { title: 'asc' } },
            { sortOrder: 'asc' }
        ]
    });

    const missingIntro = topics.filter(t => t._count.questions > 0);

    console.log(`Found ${missingIntro.length} topics missing introduction lessons.\n`);

    let saved = 0;
    let failed = 0;

    for (let i = 0; i < missingIntro.length; i++) {
        const topic = missingIntro[i];
        process.stdout.write(`[${i + 1}/${missingIntro.length}] ${topic.track.title} - ${topic.title}... `);

        try {
            const lesson = await generateLesson(topic, topic.track.title);

            if (!lesson || !lesson.title || !lesson.contentBlocks) {
                console.log('❌ Invalid response');
                failed++;
                continue;
            }

            // Save to database
            await prisma.lesson.create({
                data: {
                    topicId: topic.id,
                    title: lesson.title,
                    summary: lesson.summary || `Introduction to ${topic.title}`,
                    contentBlocks: JSON.stringify(lesson.contentBlocks),
                    estMinutes: lesson.estMinutes || 10,
                    sortOrder: 1,
                    isPublished: true
                }
            });

            console.log('✅ Saved');
            saved++;
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
            failed++;
        }

        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Generation Complete!');
    console.log(`   Saved: ${saved}`);
    console.log(`   Failed: ${failed}`);

    // Final counts
    const lessonCount = await prisma.lesson.count();
    console.log(`   Total Lessons in DB: ${lessonCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
