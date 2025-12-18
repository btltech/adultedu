
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1';
const MODEL_NAME = process.env.LLM_MODEL || 'openai/gpt-oss-20b:2';
const TARGET_COUNT = 20;

console.log(`🔌 Using LLM: ${LLM_API_URL}`);

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
                max_tokens: 3000,
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

async function generateForTopic(topic, needed) {
    console.log(`   Generating ${needed} questions for "${topic.title}"...`);

    // Get existing prompts to avoid duplicates
    const existingPrompts = topic.questions.map(q => q.prompt.substring(0, 40));

    const systemPrompt = `You are an expert exam question creator for UK Adult Education.
Target Audience: Adult learners (19+) in the UK.
Output MUST be valid JSON array of question objects.
IMPORTANT:
- Do NOT use trailing commas.
- Escape all quotes within strings properly.
- Do NOT use LaTeX or complex content that breaks JSON.`;

    const userPrompt = `Create ${needed} NEW multiple-choice questions for the topic "${topic.title}" in the course "${topic.track.title}".

Context:
- Existing questions cover: ${existingPrompts.slice(0, 3).join(' | ')}...
- DO NOT DUPLICATE these concepts.
- Ensure UK English spelling.

Format Requirements:
- Return ONLY a JSON array.
- Each object must have:
  - "prompt": Question text
  - "options": Array of 4 strings
  - "answer": String matching COMPLETELY one of the options
  - "explanation": Brief explanation

JSON RESPONSE:`;

    let attempts = 0;
    while (attempts < 3) {
        attempts++;
        try {
            const content = await generateCompletion(userPrompt, systemPrompt);
            if (!content) throw new Error("Empty content");

            let clean = content.replace(/```json\n?|\n?```/g, '').trim();
            const start = clean.indexOf('[');
            const end = clean.lastIndexOf(']');
            if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);

            // Simple cleanup for common trailing comma issues
            clean = clean.replace(/,(\s*[}\]])/g, '$1');

            const questions = JSON.parse(clean);

            let saved = 0;
            // Default fallback Level 1 if topic doesn't have one
            const levelId = topic.ukLevelId || '4b049688-6625-4222-9097-425af23d6a78';

            for (const q of questions) {
                if (!q.prompt || !q.options || !q.answer) continue;

                await prisma.question.create({
                    data: {
                        topicId: topic.id,
                        ukLevelId: levelId,
                        type: 'mcq',
                        prompt: q.prompt,
                        options: JSON.stringify(q.options),
                        answer: JSON.stringify(q.answer),
                        explanation: q.explanation || `The correct answer is ${q.answer}`,
                        isPublished: true
                    }
                });
                saved++;
            }
            return saved;

        } catch (e) {
            console.error(`   ⚠️ Attempt ${attempts} failed: ${e.message}`);
            if (attempts === 3) return 0;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return 0;
}

async function main() {
    console.log('🚀 Starting Bulk Question Generation...');
    console.log(`Target: At least ${TARGET_COUNT} questions per topic.\n`);

    const topics = await prisma.topic.findMany({
        include: {
            track: true,
            questions: { select: { prompt: true } }, // fetch prompts to avoid dupes in prompt
            _count: { select: { questions: true } }
        },
        orderBy: { track: { title: 'asc' } }
    });

    const lowCountTopics = topics.filter(t => t._count.questions < TARGET_COUNT);
    console.log(`Found ${lowCountTopics.length} topics below target.\n`);

    let totalGenerated = 0;

    for (const [index, topic] of lowCountTopics.entries()) {
        const needed = TARGET_COUNT - topic._count.questions;
        // Cap generation at 10 per batch to prevent timeout/context limits
        const batchSize = Math.min(needed, 10);

        console.log(`[${index + 1}/${lowCountTopics.length}] ${topic.track.title} / ${topic.title} (Has: ${topic._count.questions}, Need: ${needed})`);

        const saved = await generateForTopic(topic, batchSize);

        if (saved > 0) {
            console.log(`   ✅ Added ${saved} questions.`);
            totalGenerated += saved;
        } else {
            console.log(`   ⚠️ No questions added.`);
        }

        // Delay between requests
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n✨ Bulk Generation Complete! Total new questions: ${totalGenerated}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
