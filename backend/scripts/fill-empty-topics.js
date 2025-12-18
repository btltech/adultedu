/**
 * Fill Empty Topics
 * Finds topics with 0 questions and generates content for them.
 * 
 * Usage: node scripts/fill-empty-topics.js
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// LLM Configuration
const LLM_URL = process.env.LLM_URL || 'http://192.168.0.165:1234'
const LLM_MODEL = process.env.LLM_MODEL || 'qwen2.5-coder-32b-instruct'

async function generateQuestionsForTopic(topic, trackTitle) {
    console.log(`\n   ❓ Generating questions for: ${topic.title} (${trackTitle})`)

    const prompt = `
    You are an expert UK curriculum developer. Created 15 multiple-choice questions (MCQs) for the topic "${topic.title}" which is part of the course "${trackTitle}".
    
    CRITICAL RULES:
    1. **Format**: Return ONLY a valid JSON array. No markdown, no explanations outside the JSON.
    2. **Standards**: Questions must be DfE Level 2+ standard (practical, real-world UK context).
    3. **Structure**: 
       - "prompt": The question text.
       - "type": "mcq".
       - "options": Array of 4 distinct strings.
       - "correctAnswer": Index of the correct option (0-3).
       - "explanation": Brief explanation of why the answer is correct.
       - "difficulty": Integer 2 or 3 (Level 2 or 3).
    4. **Context**: Use UK currency (£), metric units, and British spelling.
    5. **Math/Code**: If using LaTeX or code, ensure backslashes are escaped properly for JSON (e.g. "\\\\frac").

    Example JSON structure:
    [
      {
        "prompt": "Which of these is a renewable energy source?",
        "type": "mcq",
        "options": ["Coal", "Natural Gas", "Solar Power", "Nuclear"],
        "correctAnswer": 2,
        "explanation": "Solar power is renewable because...",
        "difficulty": 2
      }
    ]
    `

    try {
        const response = await fetch(`${LLM_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    { role: 'system', content: 'You are a strict JSON generator. Output only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        })

        if (!response.ok) throw new Error(`LLM API Error: ${response.status}`)

        const data = await response.json()
        let content = data.choices[0].message.content

        // Extract JSON
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
        let jsonStr = jsonMatch[1] || content
        jsonStr = jsonStr.trim()

        // Cleanup common broken JSON patterns
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1') // Trailing commas

        const questions = JSON.parse(jsonStr)

        if (!Array.isArray(questions)) throw new Error('Response is not an array')

        let savedCount = 0
        const defaultLevel = await prisma.ukLevel.findFirst({ where: { code: 'L2' } })

        for (const q of questions) {
            if (!q.prompt || !Array.isArray(q.options) || q.options.length < 2) continue

            // Determine Answer String
            let answerString = ""
            if (typeof q.correctAnswer === 'number' && q.options[q.correctAnswer]) {
                answerString = q.options[q.correctAnswer]
            } else {
                answerString = String(q.options[0]) // Fallback
            }

            await prisma.question.create({
                data: {
                    topicId: topic.id,
                    ukLevelId: defaultLevel.id,
                    type: 'mcq',
                    prompt: q.prompt,
                    options: JSON.stringify(q.options),
                    answer: answerString,
                    explanation: q.explanation || 'See topic materials for details.',
                    difficulty: q.difficulty || 2,
                    isPublished: true,
                    version: 1
                }
            })
            savedCount++
        }

        console.log(`      ✓ Saved ${savedCount} questions`)
        return savedCount

    } catch (e) {
        console.log(`      ⚠ Failed to generate: ${e.message}`)
        return 0
    }
}

async function run() {
    console.log('🔍 Finding empty topics...')

    const topics = await prisma.topic.findMany({
        include: {
            _count: { select: { questions: true } },
            track: { select: { title: true } }
        }
    })

    const emptyTopics = topics.filter(t => t._count.questions === 0)
    console.log(`Found ${emptyTopics.length} empty topics.`)

    if (emptyTopics.length === 0) {
        console.log('All topics have content!')
        return
    }

    for (const topic of emptyTopics) {
        await generateQuestionsForTopic(topic, topic.track.title)
    }

    console.log('\n✅ Done filling gaps.')
}

run()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
