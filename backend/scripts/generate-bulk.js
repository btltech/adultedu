/**
 * Bulk Content Generator
 * Generates many more questions to reach 600+ total
 * 
 * Usage: node scripts/generate-bulk.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// LM Studio API Configuration
const LLM_CONFIG = {
    baseUrl: 'http://192.168.0.165:1234/v1',
    model: 'qwen3-coder-30b-a3b-instruct-mlx',
    temperature: 0.7,
    maxTokens: 4000,
    timeoutMs: 180000,
}

// Target questions per topic
const TARGET_QUESTIONS_PER_TOPIC = 35

/**
 * Call the local LLM API
 */
async function callLLM(systemPrompt, userPrompt) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), LLM_CONFIG.timeoutMs)

    try {
        const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: LLM_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: LLM_CONFIG.temperature,
                max_tokens: LLM_CONFIG.maxTokens,
            }),
        })

        if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`)
        }

        const data = await response.json()
        return data.choices[0].message.content
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Parse JSON from LLM response
 */
function parseJSON(text) {
    let cleaned = text.trim()

    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim()
    }

    if (!cleaned.startsWith('[')) {
        const arrayMatch = cleaned.match(/(\[[\s\S]*\])/)
        if (arrayMatch) {
            cleaned = arrayMatch[1]
        }
    }

    try {
        return JSON.parse(cleaned)
    } catch (e) {
        // Find balanced brackets
        let braceCount = 0
        let inString = false
        let escape = false
        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i]
            if (escape) { escape = false; continue }
            if (char === '\\') { escape = true; continue }
            if (char === '"' && !escape) { inString = !inString; continue }
            if (!inString) {
                if (char === '[') braceCount++
                if (char === ']') braceCount--
                if (braceCount === 0 && i > 0) {
                    return JSON.parse(cleaned.slice(0, i + 1))
                }
            }
        }
        throw new Error(`JSON parse failed: ${text.slice(0, 100)}...`)
    }
}

/**
 * Generate a batch of questions
 */
async function generateQuestionBatch(topic, trackTitle, ukLevel, batchNum) {
    const systemPrompt = `You are an expert educational assessment creator for AdultEdu, a UK adult learning platform.
Create clear, fair questions with helpful explanations. Use UK English.

IMPORTANT: Respond with ONLY a valid JSON array.`

    const difficulties = ['easy', 'medium', 'hard']
    const difficulty = difficulties[batchNum % 3]

    const userPrompt = `Create 10 ${difficulty} practice questions for "${topic.title}" in "${trackTitle}" at UK Level ${ukLevel}.

Generate a JSON array:
[
  {
    "type": "mcq",
    "prompt": "Question text?",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "explanation": "Why this is correct",
    "difficulty": ${batchNum % 3 + 1}
  }
]

Requirements:
- Mix of MCQ and true_false types
- answer = 0-based index
- Practical, real-world scenarios
- Detailed explanations
- Different from basic questions - test deeper understanding`

    const response = await callLLM(systemPrompt, userPrompt)
    return parseJSON(response)
}

/**
 * Main bulk generation
 */
async function generateBulk() {
    console.log('🚀 Bulk Content Generator')
    console.log(`   Target: ${TARGET_QUESTIONS_PER_TOPIC}+ questions per topic`)
    console.log(`   Model: ${LLM_CONFIG.model}\n`)

    // Test connection
    try {
        await callLLM('Test', 'Say OK')
        console.log('✓ LLM connected\n')
    } catch (e) {
        console.error('✗ LLM connection failed:', e.message)
        process.exit(1)
    }

    // Get all topics
    const topics = await prisma.topic.findMany({
        include: {
            track: true,
            ukLevel: true,
            _count: { select: { questions: true } },
        },
        orderBy: [{ track: { title: 'asc' } }, { sortOrder: 'asc' }],
    })

    let totalNew = 0

    for (const topic of topics) {
        const currentCount = topic._count.questions
        const needed = TARGET_QUESTIONS_PER_TOPIC - currentCount

        if (needed <= 0) {
            console.log(`✓ ${topic.track.title} > ${topic.title}: ${currentCount} questions (done)`)
            continue
        }

        console.log(`\n📚 ${topic.track.title} > ${topic.title}`)
        console.log(`   Current: ${currentCount}, Need: ${needed}`)

        const batches = Math.ceil(needed / 10)
        let topicNew = 0

        for (let batch = 0; batch < batches; batch++) {
            try {
                console.log(`   Batch ${batch + 1}/${batches}...`)
                const questions = await generateQuestionBatch(
                    topic,
                    topic.track.title,
                    topic.ukLevel.code,
                    batch
                )

                for (const q of questions) {
                    if (!q.prompt || q.answer === undefined) continue

                    await prisma.question.create({
                        data: {
                            topicId: topic.id,
                            ukLevelId: topic.ukLevel.id,
                            type: q.type || 'mcq',
                            prompt: q.prompt,
                            options: JSON.stringify(q.options || []),
                            answer: JSON.stringify(q.answer),
                            explanation: q.explanation || '',
                            difficulty: parseInt(q.difficulty) || 2,
                            isPublished: true,
                        },
                    })
                    topicNew++
                    totalNew++
                }

                console.log(`   ✓ +${questions.length} questions`)
            } catch (e) {
                console.log(`   ✗ Batch failed: ${e.message}`)
            }

            // Brief pause between batches
            await new Promise(r => setTimeout(r, 500))
        }

        console.log(`   Total new for topic: ${topicNew}`)
    }

    // Final stats
    const finalCount = await prisma.question.count()
    console.log('\n' + '='.repeat(50))
    console.log('✅ Bulk generation complete!')
    console.log(`   New questions: ${totalNew}`)
    console.log(`   Total questions: ${finalCount}`)
}

generateBulk()
    .catch(e => { console.error('Fatal:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
