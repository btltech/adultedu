
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1';
const MODEL_NAME = process.env.LLM_MODEL || 'openai/gpt-oss-20b:2';
const TOPIC_ID = '7b6fbbfe-928e-47e8-974b-601987adc839';
const COUNT_NEEDED = 10;

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

async function main() {
    console.log('🚀 Top-up Question Generation...');

    const topic = await prisma.topic.findUnique({
        where: { id: TOPIC_ID },
        include: { questions: { take: 5 } }
    });

    if (!topic) {
        console.error('Topic not found');
        return;
    }

    const systemPrompt = `You are an expert exam question creator for UK Functional Skills Maths.
Output MUST be valid JSON array of question objects.`;

    const userPrompt = `Create ${COUNT_NEEDED} NEW multiple-choice questions for the topic "${topic.title}".
    
Context:
- Existing questions cover: ${topic.questions.map(q => q.prompt.substring(0, 30)).join(', ')}...
- DO NOT DUPLICATE existing questions.
- Focus on: Bills, budgeting, interest rates, currency conversion.

Format Requirements:
- Return ONLY a JSON array.
- Each object must have:
  - "prompt": Question text
  - "options": Array of 4 strings
  - "answer": String matching COMPLETELY one of the options
  - "explanation": Brief explanation

JSON RESPONSE:`;

    console.log(`Generating ${COUNT_NEEDED} questions for "${topic.title}"...`);
    const content = await generateCompletion(userPrompt, systemPrompt);

    if (!content) return;

    // Parse
    let questions = [];
    try {
        let clean = content.replace(/```json\n?|\n?```/g, '').trim();
        const start = clean.indexOf('[');
        const end = clean.lastIndexOf(']');
        if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);
        questions = JSON.parse(clean);
    } catch (e) {
        console.error('Failed to parse JSON:', e.message);
        return;
    }

    console.log(`Parsed ${questions.length} questions. Saving...`);

    let saved = 0;
    for (const q of questions) {
        await prisma.question.create({
            data: {
                topicId: TOPIC_ID,
                ukLevelId: '4b049688-6625-4222-9097-425af23d6a78', // Hardcoded Level 1 for speed, or fetch from topic if needed. 
                // Actually topic -> ukLevel relation exists. Let's look it up properly if we were being rigorous,
                // but for this specific "Money and Finance" topic in FS Maths, assume Level 1 or 2.
                // Better: fetch the ID from the topic itself.
                // Wait, topic has ukLevelId.
                ukLevelId: topic.ukLevelId,
                type: 'mcq',
                prompt: q.prompt,
                options: JSON.stringify(q.options),
                answer: JSON.stringify(q.answer), // Ensure JSON string format
                explanation: q.explanation,
                isPublished: true
            }
        });
        saved++;
    }

    console.log(`✅ Saved ${saved} new questions.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
