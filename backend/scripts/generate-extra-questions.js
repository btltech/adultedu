/**
 * Generate additional questions for existing topics using local LLM
 * 
 * Usage: node scripts/generate-extra-questions.js <track-slug> [questions-per-topic]
 * Example: node scripts/generate-extra-questions.js python-foundations 25
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LLM_URL = process.env.LLM_URL || 'http://192.168.0.165:1234'
const LLM_MODEL = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct-mlx'

/**
 * Call local LLM API
 */
async function callLLM(prompt, options = {}) {
    const response = await fetch(`${LLM_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: LLM_MODEL,
            messages: [
                { role: 'system', content: 'You are an expert educational content creator for UK adult education. Always respond with valid JSON only, no markdown formatting or explanatory text.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: options.maxTokens || 10000,
        })
    })

    if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Extract JSON from response
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonStr = jsonMatch[1]
    jsonStr = jsonStr.trim()

    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (arrayMatch) jsonStr = arrayMatch[0]

    try {
        return JSON.parse(jsonStr)
    } catch (e) {
        try {
            const fixed = jsonStr.replace(/,\s*([}\]])/g, '$1')
            return JSON.parse(fixed)
        } catch (e2) {
            console.log('   ⚠ JSON parse failed, returning empty array')
            return []
        }
    }
}

/**
 * Generate questions for a topic
 */
async function generateQuestions(track, topic, count) {
    console.log(`   ❓ Generating ${count} questions for: ${topic.title}`)

    const prompt = `Create exactly ${count} practice questions for the topic "${topic.title}" in the course "${track.title}".
Topic description: ${topic.description || topic.title}

**CRITICAL REQUIREMENTS - DfE Level 2+ Standards:**
- All questions MUST be at UK DfE Level 2 or above (GCSE equivalent or higher)
- Questions should test higher-order thinking, not just recall
- Use real-world UK contexts (pounds sterling, metric units, UK examples)
- Language should be clear, accessible, and professionally written
- Include practical applications relevant to adult learners

Return a JSON array of exactly ${count} questions. Each question must have:
- prompt: string (clear, unambiguous question text)
- type: "mcq" (all should be MCQ for reliable assessment)
- options: array of exactly 4 distinct answer strings
- correctAnswer: number (0, 1, 2, or 3 - index of correct option)
- explanation: string (educational explanation of the correct answer)
- difficulty: number (2 = Level 2/GCSE, 3 = Level 3/A-Level)

Difficulty mix: ${Math.floor(count * 0.6)} questions at difficulty 2, ${Math.ceil(count * 0.4)} at difficulty 3.

CRITICAL: Ensure ALL 4 options are provided for EVERY question. Do not leave any options empty.

Example format:
[
  {
    "prompt": "A company's revenue increased from £450,000 to £522,000. What was the percentage increase?",
    "type": "mcq",
    "options": ["12%", "14%", "16%", "18%"],
    "correctAnswer": 2,
    "explanation": "Percentage increase = ((522000 - 450000) / 450000) × 100 = (72000 / 450000) × 100 = 16%",
    "difficulty": 2
  }
]`

    const questions = await callLLM(prompt, { maxTokens: 15000 })

    // Filter out any questions with missing options
    const validQuestions = questions.filter(q =>
        q.options && Array.isArray(q.options) && q.options.length >= 2
    )

    console.log(`      ✓ Generated ${validQuestions.length} valid questions`)
    return validQuestions
}

/**
 * Save questions to database
 */
async function saveQuestions(topic, ukLevelId, questions) {
    let saved = 0
    let skipped = 0
    for (const q of questions) {
        try {
            // Deduplication check
            const existing = await prisma.question.findFirst({
                where: {
                    topicId: topic.id,
                    prompt: q.prompt
                }
            })

            if (existing) {
                skipped++
                continue
            }

            const answer = Array.isArray(q.options) && q.correctAnswer !== undefined
                ? q.options[q.correctAnswer]
                : String(q.correctAnswer || 0)

            await prisma.question.create({
                data: {
                    prompt: q.prompt,
                    type: q.type || 'mcq',
                    options: JSON.stringify(q.options),
                    answer: answer,
                    explanation: q.explanation || '',
                    difficulty: q.difficulty || 2,
                    isPublished: true,
                    topicId: topic.id,
                    ukLevelId: ukLevelId,
                }
            })
            saved++
        } catch (e) {
            console.log(`      ⚠ Failed to save question: ${e.message}`)
        }
    }
    if (skipped > 0) {
        console.log(`      ⏭  Skipped ${skipped} duplicates`)
    }
    return saved
}

/**
 * Main function
 */
async function main() {
    const slug = process.argv[2]
    const questionsPerTopic = parseInt(process.argv[3]) || 25

    if (!slug) {
        console.log('Usage: node scripts/generate-extra-questions.js <track-slug> [questions-per-topic]')
        console.log('\nAvailable tracks:')
        const tracks = await prisma.track.findMany({
            where: { isLive: true },
            select: { slug: true, title: true }
        })
        tracks.forEach(t => console.log(`  - ${t.slug}: ${t.title}`))
        process.exit(0)
    }

    // Find track with topics
    const track = await prisma.track.findUnique({
        where: { slug },
        include: {
            topics: {
                include: { ukLevel: true },
                orderBy: { sortOrder: 'asc' }
            }
        }
    })

    if (!track) {
        console.error(`Track not found: ${slug}`)
        process.exit(1)
    }

    console.log(`\n🚀 Generating ${questionsPerTopic} questions per topic for: ${track.title}`)
    console.log(`   Topics: ${track.topics.length}`)
    console.log(`   Target total: ~${track.topics.length * questionsPerTopic} questions`)
    console.log(`   Using LLM: ${LLM_URL}\n`)

    // Get default UK level
    const defaultLevel = await prisma.ukLevel.findFirst({ where: { code: 'L2' } })
    if (!defaultLevel) {
        throw new Error('No UK levels found')
    }

    let totalSaved = 0

    for (const topic of track.topics) {
        try {
            const questions = await generateQuestions(track, topic, questionsPerTopic)
            const ukLevelId = topic.ukLevelId || defaultLevel.id
            const saved = await saveQuestions(topic, ukLevelId, questions)
            totalSaved += saved
            console.log(`      💾 Saved ${saved} questions to database`)
        } catch (error) {
            console.error(`   ❌ Error on topic "${topic.title}": ${error.message}`)
        }
    }

    // Get final count for this track
    const finalCount = await prisma.question.count({
        where: { topic: { trackId: track.id } }
    })

    console.log(`\n✅ Complete!`)
    console.log(`   New questions added: ${totalSaved}`)
    console.log(`   Total questions for ${track.title}: ${finalCount}`)

    await prisma.$disconnect()
}

main()
