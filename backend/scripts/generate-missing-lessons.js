
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1';
const MODEL_NAME = process.env.LLM_MODEL || 'openai/gpt-oss-20b:2';

console.log(`🔌 Using LLM: ${LLM_API_URL} (Model: ${MODEL_NAME})`);

async function generateCompletion(prompt, systemPrompt) {
    try {
        const response = await fetch(`${LLM_API_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2500, // Enough for a good lesson
            })
        });

        if (!response.ok) throw new Error(`LLM API Error: ${response.statusText}`);
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('LLM Request Failed:', error.message);
        return null;
    }
}

async function generateLessonContent(topicTitle, trackTitle, existingQuestions) {
    const systemPrompt = `You are an expert educational content creator for the UK adult learning platform "Adut_Edu". 
Your goal is to create engaging, clear, and practical lesson content.
Output MUST be valid JSON array of content blocks.`;

    const userPrompt = `Create a comprehensive introductory lesson for the topic "${topicTitle}" which is part of the "${trackTitle}" course.

Context:
- The user will read this lesson BEFORE attempting practice questions.
- Some example questions they will face: ${existingQuestions.slice(0, 3).map(q => q.prompt).join(' | ')}...
- Ensure the content covers the knowledge needed for these questions.

Format Requirements:
- Return ONLY a JSON array of content blocks.
- Block types allowed: "heading", "subheading", "paragraph", "list", "callout" (variants: tip, warning, note), "code" (if technical).
- Structure:
  1. Introduction (paragraph)
  2. Key Concepts (headings + paragraphs/lists)
  3. Practical Examples (callouts or scenarios)
  4. Summary (paragraph)

Example Output Format:
[
  { "type": "paragraph", "content": "Introduction text..." },
  { "type": "heading", "content": "Main Concept" },
  { "type": "list", "items": ["Point 1", "Point 2"] },
  { "type": "callout", "variant": "tip", "content": "Helpful tip..." }
]

JSON RESPONSE:`;

    let content = await generateCompletion(userPrompt, systemPrompt);

    if (!content) return null;

    // Parse JSON
    try {
        // Clean markdown code blocks if present
        content = content.replace(/```json\n?|\n?```/g, '').trim();
        // Extract array
        const start = content.indexOf('[');
        const end = content.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            content = content.substring(start, end + 1);
        }
        return JSON.parse(content);
    } catch (e) {
        console.error('Failed to parse generated JSON:', e.message);
        // console.log('Raw content:', content);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting Lesson Generation...');

    // 1. Find missing topics
    const topics = await prisma.topic.findMany({
        include: {
            track: true,
            questions: { take: 5 },
            _count: { select: { lessons: true } }
        }
    });

    const missingIntro = topics.filter(t => t._count.lessons === 0 && t.questions.length > 0);
    console.log(`Found ${missingIntro.length} topics needing lessons.\n`);

    let successCount = 0;

    for (const [index, topic] of missingIntro.entries()) {
        console.log(`[${index + 1}/${missingIntro.length}] Generating for: "${topic.title}" (${topic.track.title})...`);

        const contentBlocks = await generateLessonContent(topic.title, topic.track.title, topic.questions);

        if (contentBlocks) {
            // Save to DB
            await prisma.lesson.create({
                data: {
                    topicId: topic.id,
                    title: topic.title, // Use topic title as lesson title
                    summary: `Introduction to ${topic.title}`,
                    contentBlocks: JSON.stringify(contentBlocks),
                    estMinutes: 10,
                    isPublished: true,
                    sortOrder: 0,
                    version: 1
                }
            });
            console.log('   ✅ Saved successfully.');
            successCount++;
        } else {
            console.log('   ❌ Failed to generate or parse.');
        }

        // Small delay to be nice to the local LLM
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n✨ Complete! Generated ${successCount}/${missingIntro.length} lessons.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
