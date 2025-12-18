/**
 * Generate course content (topics, lessons, questions) using local LLM
 * 
 * Usage: node scripts/generate-course-content.js <track-slug>
 * Example: node scripts/generate-course-content.js functional-skills-maths
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
                { role: 'system', content: 'You are an expert educational content creator. Always respond with valid JSON only, no markdown formatting.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: options.maxTokens || 4000,
        })
    })

    if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Extract JSON from response (handle markdown code blocks and clean up)
    let jsonStr = content

    // Remove markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
        jsonStr = jsonMatch[1]
    }

    // Clean up common issues
    jsonStr = jsonStr.trim()

    // Try to find JSON array or object
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/)

    if (arrayMatch) jsonStr = arrayMatch[0]
    else if (objectMatch) jsonStr = objectMatch[0]

    try {
        return JSON.parse(jsonStr)
    } catch (e) {
        console.error('Failed to parse LLM response, attempting fix...')

        // Try to fix common issues: trailing commas, incomplete JSON
        try {
            // Remove trailing commas before ] or }
            const fixed = jsonStr.replace(/,\s*([}\]])/g, '$1')
            return JSON.parse(fixed)
        } catch (e2) {
            console.error('JSON fix failed:', content.substring(0, 500))
            // Return empty array to allow continuation
            console.log('   ⚠ Returning empty array to continue...')
            return []
        }
    }
}

/**
 * Generate topics for a track
 */
async function generateTopics(track) {
    console.log(`\n📚 Generating topics for: ${track.title}`)

    const prompt = `Create 6-8 topics for an educational course titled "${track.title}".
Description: ${track.description}
Framework: ${track.framework}

Return a JSON array of topics, each with:
- title: string (2-5 words)
- description: string (1-2 sentences)
- order: number (1-8)
- ukLevel: string (e.g., "L1", "L2", "L3" for qualification level)

Example format:
[
  {"title": "Introduction to Numbers", "description": "Understanding whole numbers, place value, and basic operations.", "order": 1, "ukLevel": "L1"}
]`

    const topics = await callLLM(prompt)
    console.log(`   ✓ Generated ${topics.length} topics`)
    return topics
}

/**
 * Generate lessons for a topic
 */
async function generateLessons(track, topic) {
    console.log(`   📖 Generating lessons for: ${topic.title}`)

    const prompt = `Create 3-4 lessons for the topic "${topic.title}" in the course "${track.title}".
Topic description: ${topic.description}

Return a JSON array of lessons, each with:
- title: string (clear lesson title)
- summary: string (1-2 sentences)
- estMinutes: number (5-15 minutes)
- order: number (1-4)
- contentBlocks: array of content blocks

Content block types:
- { "type": "heading", "content": "..." }
- { "type": "paragraph", "content": "..." }
- { "type": "list", "items": ["item1", "item2"] }
- { "type": "callout", "variant": "tip", "content": "..." }

Each lesson should have 4-6 content blocks.

Example:
[
  {
    "title": "Understanding Place Value",
    "summary": "Learn how digits represent different values based on their position.",
    "estMinutes": 10,
    "order": 1,
    "contentBlocks": [
      {"type": "heading", "content": "What is Place Value?"},
      {"type": "paragraph", "content": "Place value is..."}
    ]
  }
]`

    const lessons = await callLLM(prompt, { maxTokens: 6000 })
    console.log(`      ✓ Generated ${lessons.length} lessons`)
    return lessons
}

/**
 * Generate questions for a topic
 */
async function generateQuestions(track, topic) {
    console.log(`   ❓ Generating questions for: ${topic.title}`)

    const prompt = `Create 12-15 practice questions for the topic "${topic.title}" in the course "${track.title}".
Topic description: ${topic.description}
UK Level: ${topic.ukLevel}

IMPORTANT: Follow UK Department for Education (DfE) standards for adult education:
- Questions should be practical and relevant to real-life scenarios
- Use UK contexts (pounds sterling, metric units, UK place names)
- Ensure accessibility and clarity in question phrasing
- Include a range of difficulty levels suitable for adult learners

Return a JSON array of questions with:
- prompt: string (the question text - clear and unambiguous)
- type: "mcq" or "true_false"
- options: array of 4 strings (for mcq) or ["True", "False"] (for true_false)
- correctAnswer: number (0-based index of correct option)
- explanation: string (clear explanation of why this is correct, educational)
- difficulty: number (1-3, where 1=foundation, 2=developing, 3=secure)

Include a mix of 10 MCQ and 3-5 True/False questions with varying difficulty (4 easy, 6 medium, 3-5 hard).

Example:
[
  {
    "prompt": "What is 15% of £200?",
    "type": "mcq",
    "options": ["£20", "£30", "£40", "£50"],
    "correctAnswer": 1,
    "explanation": "To find 15% of £200: 15 ÷ 100 × 200 = 30. So 15% of £200 is £30.",
    "difficulty": 2
  }
]`

    const questions = await callLLM(prompt, { maxTokens: 8000 })
    console.log(`      ✓ Generated ${questions.length} questions`)
    return questions
}

/**
 * Save generated content to database
 */
async function saveContent(track, topicsData) {
    console.log(`\n💾 Saving content to database...`)

    // Get default UK level
    const defaultLevel = await prisma.ukLevel.findFirst({ where: { code: 'L2' } })
    if (!defaultLevel) {
        throw new Error('No UK levels found. Run seed first.')
    }

    for (const topicData of topicsData) {
        // Find or get UK level
        let ukLevel = await prisma.ukLevel.findFirst({
            where: { code: topicData.ukLevel }
        })
        if (!ukLevel) ukLevel = defaultLevel

        // Create topic
        const topic = await prisma.topic.create({
            data: {
                title: topicData.title,
                description: topicData.description,
                sortOrder: topicData.order,
                trackId: track.id,
                ukLevelId: ukLevel.id,
            }
        })
        console.log(`   ✓ Created topic: ${topic.title}`)

        // Create lessons
        for (const lessonData of topicData.lessons || []) {
            await prisma.lesson.create({
                data: {
                    title: lessonData.title,
                    summary: lessonData.summary,
                    estMinutes: lessonData.estMinutes || 10,
                    sortOrder: lessonData.order,
                    contentBlocks: JSON.stringify(lessonData.contentBlocks || []),
                    topicId: topic.id,
                }
            })
        }

        // Create questions
        for (const qData of topicData.questions || []) {
            // Derive answer from correctAnswer index and options
            const answer = Array.isArray(qData.options) && qData.correctAnswer !== undefined
                ? qData.options[qData.correctAnswer]
                : String(qData.correctAnswer || 0)

            await prisma.question.create({
                data: {
                    prompt: qData.prompt,
                    type: qData.type,
                    options: JSON.stringify(qData.options || []),
                    answer: answer,
                    explanation: qData.explanation || '',
                    difficulty: qData.difficulty || 2,
                    isPublished: true,
                    topicId: topic.id,
                    ukLevelId: ukLevel.id,
                }
            })
        }
    }

    // Mark track as live
    await prisma.track.update({
        where: { id: track.id },
        data: { isLive: true }
    })

    console.log(`   ✓ Track marked as live!`)
}

/**
 * Main function
 */
async function main() {
    const slug = process.argv[2]

    if (!slug) {
        console.log('Available Coming Soon courses:')
        const comingSoon = await prisma.track.findMany({
            where: { isLive: false },
            select: { slug: true, title: true }
        })
        comingSoon.forEach(t => console.log(`  - ${t.slug}: ${t.title}`))
        console.log('\nUsage: node scripts/generate-course-content.js <track-slug>')
        process.exit(0)
    }

    // Find track
    const track = await prisma.track.findUnique({ where: { slug } })
    if (!track) {
        console.error(`Track not found: ${slug}`)
        process.exit(1)
    }

    if (track.isLive) {
        console.log(`Track "${track.title}" is already live!`)
        process.exit(0)
    }

    console.log(`\n🚀 Generating content for: ${track.title}`)
    console.log(`   Using LLM: ${LLM_URL} (${LLM_MODEL})`)

    try {
        // Generate topics
        const topics = await generateTopics(track)

        // Generate lessons and questions for each topic
        for (const topic of topics) {
            topic.lessons = await generateLessons(track, topic)
            topic.questions = await generateQuestions(track, topic)
        }

        // Save to database
        await saveContent(track, topics)

        console.log(`\n✅ Successfully generated content for "${track.title}"!`)
        console.log(`   Topics: ${topics.length}`)
        console.log(`   Lessons: ${topics.reduce((sum, t) => sum + (t.lessons?.length || 0), 0)}`)
        console.log(`   Questions: ${topics.reduce((sum, t) => sum + (t.questions?.length || 0), 0)}`)

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
