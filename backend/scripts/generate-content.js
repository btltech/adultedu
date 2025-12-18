/**
 * LLM Content Generator
 * Generates lessons and questions using a local LLM via LM Studio
 * 
 * Usage: node scripts/generate-content.js
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// LM Studio API Configuration
const LLM_CONFIG = {
    baseUrl: 'http://192.168.0.165:1234/v1',
    model: 'qwen3-coder-30b-a3b-instruct-mlx',
    temperature: 0.7,
    maxTokens: 3000,
    timeoutMs: 180000, // 3 minutes for instruct model
}

/**
 * Call the local LLM API with timeout handling
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
            throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data.choices[0].message.content
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Parse JSON from LLM response (handles thinker models and markdown)
 * Thinker models often output reasoning before/after JSON
 */
function parseJSON(text) {
    let cleaned = text.trim()

    // Try to find JSON in markdown code blocks first
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonBlockMatch) {
        cleaned = jsonBlockMatch[1].trim()
    }

    // If still not valid JSON, try to find JSON object or array
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
        // Look for JSON object
        const objectMatch = cleaned.match(/(\{[\s\S]*\})/)
        if (objectMatch) {
            cleaned = objectMatch[1]
        } else {
            // Look for JSON array
            const arrayMatch = cleaned.match(/(\[[\s\S]*\])/)
            if (arrayMatch) {
                cleaned = arrayMatch[1]
            }
        }
    }

    // Clean up any trailing text after JSON
    try {
        return JSON.parse(cleaned)
    } catch (e) {
        // Try to find the end of the JSON by matching braces
        let braceCount = 0
        let inString = false
        let escape = false
        for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i]
            if (escape) {
                escape = false
                continue
            }
            if (char === '\\') {
                escape = true
                continue
            }
            if (char === '"' && !escape) {
                inString = !inString
                continue
            }
            if (!inString) {
                if (char === '{' || char === '[') braceCount++
                if (char === '}' || char === ']') braceCount--
                if (braceCount === 0 && i > 0) {
                    return JSON.parse(cleaned.slice(0, i + 1))
                }
            }
        }
        throw new Error(`Could not parse JSON from response: ${text.slice(0, 100)}...`)
    }
}

/**
 * Generate a lesson for a topic
 */
async function generateLesson(topic, trackTitle, ukLevel) {
    const systemPrompt = `You are an expert educational content creator for AdultEdu, a UK adult learning platform.
You create engaging, accessible lessons aligned with UK qualification frameworks.

IMPORTANT: You must respond with ONLY valid JSON, no explanations or markdown.`

    const userPrompt = `Create a lesson for the topic "${topic.title}" in the "${trackTitle}" course at UK Level ${ukLevel}.

Topic description: ${topic.description || 'No description provided'}

Generate a JSON object with this exact structure:
{
  "title": "Lesson title",
  "summary": "One sentence summary of what learners will learn",
  "estMinutes": 15-25,
  "contentBlocks": [
    { "type": "heading", "content": "Main heading" },
    { "type": "paragraph", "content": "Introductory paragraph explaining the concept" },
    { "type": "subheading", "content": "Subtopic heading" },
    { "type": "paragraph", "content": "Explanation paragraph" },
    { "type": "list", "items": ["Item 1", "Item 2", "Item 3"] },
    { "type": "code", "content": "Example code or formula if relevant" },
    { "type": "callout", "variant": "tip", "content": "Helpful tip for learners" },
    { "type": "callout", "variant": "warning", "content": "Important warning or common mistake" }
  ]
}

Requirements:
- Use UK English spelling and terminology
- Include 6-10 content blocks
- Make content practical and accessible for adult learners
- Include at least one callout (tip, warning, or info)
- If relevant to the topic, include code examples or formulas`

    console.log(`   Generating lesson for: ${topic.title}...`)
    const response = await callLLM(systemPrompt, userPrompt)
    return parseJSON(response)
}

/**
 * Generate questions for a topic
 */
async function generateQuestions(topic, trackTitle, ukLevel, count = 8) {
    const systemPrompt = `You are an expert educational assessment creator for AdultEdu, a UK adult learning platform.
You create clear, fair assessment questions with helpful explanations.

IMPORTANT: You must respond with ONLY valid JSON array, no explanations or markdown.`

    const userPrompt = `Create ${count} practice questions for the topic "${topic.title}" in the "${trackTitle}" course at UK Level ${ukLevel}.

Topic description: ${topic.description || 'No description provided'}

Generate a JSON array of questions with this structure:
[
  {
    "type": "mcq",
    "prompt": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Detailed explanation of why this is correct and why other options are wrong",
    "difficulty": 1
  },
  {
    "type": "true_false",
    "prompt": "Statement that is either true or false",
    "options": ["True", "False"],
    "answer": 0,
    "explanation": "Explanation of why true/false",
    "difficulty": 1
  }
]

Requirements:
- Mix of MCQ (mostly) and true_false questions
- difficulty: 1 (easy), 2 (medium), 3 (hard)
- answer is the 0-based index of the correct option
- Include detailed explanations that teach, not just state the answer
- Use UK English spelling and terminology
- Questions should test practical understanding, not just memorisation
- Include at least 2 easy, 4 medium, and 2 harder questions`

    console.log(`   Generating ${count} questions for: ${topic.title}...`)
    const response = await callLLM(systemPrompt, userPrompt)
    return parseJSON(response)
}

/**
 * Main generation function
 */
async function generateContent() {
    console.log('🤖 AdultEdu Content Generator')
    console.log(`   Model: ${LLM_CONFIG.model}`)
    console.log(`   API: ${LLM_CONFIG.baseUrl}\n`)

    // Test LLM connection
    console.log('Testing LLM connection...')
    try {
        await callLLM('You are a helpful assistant.', 'Say "Connected!" in one word.')
        console.log('✓ LLM connection successful\n')
    } catch (error) {
        console.error('✗ Failed to connect to LLM:', error.message)
        console.log('\nMake sure LM Studio is running with the API server enabled.')
        process.exit(1)
    }

    // Get all topics that need content
    const topics = await prisma.topic.findMany({
        include: {
            track: true,
            ukLevel: true,
            lessons: true,
            _count: { select: { questions: true } },
        },
        orderBy: [
            { track: { title: 'asc' } },
            { sortOrder: 'asc' },
        ],
    })

    // Filter topics that need more content
    const topicsNeedingContent = topics.filter(t =>
        t.lessons.length === 0 || t._count.questions < 5
    )

    if (topicsNeedingContent.length === 0) {
        console.log('✓ All topics have sufficient content!')
        return
    }

    console.log(`Found ${topicsNeedingContent.length} topics needing content:\n`)

    let totalLessons = 0
    let totalQuestions = 0

    for (const topic of topicsNeedingContent) {
        console.log(`\n📚 ${topic.track.title} > ${topic.title}`)

        try {
            // Generate lesson if needed
            if (topic.lessons.length === 0) {
                const lessonData = await generateLesson(topic, topic.track.title, topic.ukLevel.code)

                // Parse estMinutes as int (LLM may return string like "20" or "20-25")
                let estMinutes = parseInt(String(lessonData.estMinutes)) || 20
                if (isNaN(estMinutes)) estMinutes = 20

                const lesson = await prisma.lesson.create({
                    data: {
                        topicId: topic.id,
                        title: lessonData.title || topic.title,
                        summary: lessonData.summary || '',
                        estMinutes,
                        contentBlocks: JSON.stringify(lessonData.contentBlocks || []),
                        isPublished: true,
                        sortOrder: 1,
                    },
                })
                console.log(`   ✓ Created lesson: ${lesson.title}`)
                totalLessons++
            }

            // Generate questions if needed
            if (topic._count.questions < 5) {
                const questionsNeeded = 8 - topic._count.questions
                const questions = await generateQuestions(topic, topic.track.title, topic.ukLevel.code, questionsNeeded)

                for (const q of questions) {
                    // Validate required fields
                    if (!q.prompt || q.answer === undefined) {
                        console.log(`   ⚠️ Skipping invalid question (missing prompt or answer)`)
                        continue
                    }

                    await prisma.question.create({
                        data: {
                            topicId: topic.id,
                            ukLevelId: topic.ukLevel.id,
                            type: q.type || 'mcq',
                            prompt: q.prompt,
                            options: JSON.stringify(q.options || []),
                            answer: JSON.stringify(q.answer),
                            explanation: q.explanation || 'See the correct answer above.',
                            difficulty: q.difficulty || 2,
                            isPublished: true,
                        },
                    })
                    totalQuestions++
                }
                console.log(`   ✓ Created ${questions.length} questions`)
            }

        } catch (error) {
            console.error(`   ✗ Error: ${error.message}`)
            console.log('   Continuing with next topic...')
        }

        // Small delay to avoid overwhelming the LLM
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Final counts
    const counts = {
        lessons: await prisma.lesson.count(),
        questions: await prisma.question.count(),
    }

    console.log('\n' + '='.repeat(50))
    console.log('✅ Content generation complete!')
    console.log(`   New: ${totalLessons} lessons, ${totalQuestions} questions`)
    console.log(`   Total: ${counts.lessons} lessons, ${counts.questions} questions`)
}

// Run
generateContent()
    .catch((e) => {
        console.error('Fatal error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
