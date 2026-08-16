#!/usr/bin/env node
/**
 * Phase 2: Complete Data Cleanup & Rebuild
 * 
 * This script:
 * 1. Validates question integrity
 * 2. Identifies and logs corrupt questions
 * 3. Deletes corrupt questions (keeps valid ones)
 * 4. Regenerates missing/low-quality content
 * 5. Validates all regenerated content before saving
 * 
 * Usage:
 *   node scripts/phase-2-cleanup-and-rebuild.js [--dry-run] [--target=50]
 */

import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'
import { canonicalizeMcqAnswer, safeJsonParse } from './questionQualityUtils.js'

const prisma = new PrismaClient()

const LLM_API_URL = process.env.LLM_API_URL || 'http://192.168.1.52:1234/v1'
const LLM_MODEL = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct'

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        const [k, v] = part.split('=')
        args.set(k, v ?? true)
    }
    return args
}

async function validateQuestion(q) {
    const issues = []

    // Check prompt
    if (!q.prompt || q.prompt.trim().length === 0) {
        issues.push('empty_prompt')
    }

    // Check explanation
    if (!q.explanation || q.explanation.trim().length === 0) {
        issues.push('empty_explanation')
    }

    // For option-based questions, validate against real runtime behavior.
    if (q.type === 'mcq' || q.type === 'true_false' || q.type === 'multi_select' || q.type === 'scenario') {
        const optionsParsed = safeJsonParse(q.options)
        if (!optionsParsed.ok) {
            issues.push('options_json_parse_error')
            return issues
        }

        const options = optionsParsed.value
        if (!Array.isArray(options) || options.length < 2) {
            issues.push('invalid_options_array')
            return issues
        }

        if (q.type === 'multi_select') {
            const answerParsed = safeJsonParse(q.answer)
            if (!answerParsed.ok) {
                issues.push('answer_json_parse_error')
                return issues
            }
            const answer = answerParsed.value
            if (!Array.isArray(answer) || answer.length === 0) {
                issues.push('multi_select_answer_invalid')
                return issues
            }
            for (const item of answer) {
                const idx = Number(item)
                if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
                    issues.push(`multi_select_index_invalid:${item}`)
                }
            }
            return issues
        }

        const canonical = canonicalizeMcqAnswer({
            options: q.options,
            answerRaw: q.answer,
            explanation: q.explanation,
        })
        if (!canonical.ok) {
            issues.push(`unresolvable_answer:${canonical.reason}`)
        }
    }

    return issues
}

async function generateCompletion(prompt, systemPrompt) {
    try {
        const response = await fetch(`${LLM_API_URL}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 5000,
            }),
        })

        if (!response.ok) {
            throw new Error(`LLM API error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
    } catch (error) {
        console.error('❌ LLM Request Failed:', error.message)
        return null
    }
}

function safeJsonArrayFromText(text) {
    if (!text) return []
    
    // Try direct parse
    try {
        const arr = JSON.parse(text)
        if (Array.isArray(arr)) return arr
    } catch (e) {}

    // Try extracting JSON array from text
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start !== -1 && end !== -1) {
        try {
            const extracted = text.substring(start, end + 1)
            // Fix common issues
            const cleaned = extracted
                .replace(/,(\s*[}\]])/g, '$1')  // trailing commas
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')  // unquoted keys
            const arr = JSON.parse(cleaned)
            if (Array.isArray(arr)) return arr
        } catch (e) {}
    }

    return []
}

async function generateQuestionsForTopic(topic, count) {
    console.log(`\n  🔄 Generating ${count} questions for ${topic.title}...`)
    
    const systemPrompt = `You are an expert educational content creator for UK adult learning. 
Generate high-quality multiple choice questions perfect for adult learners in the UK.
Always ensure:
- 4 distinct, plausible options
- Correct answer is an INDEX (0, 1, 2, or 3)
- Clear, educational explanations
- Age-appropriate content
Output ONLY valid JSON array, no markdown.`

    const userPrompt = `Generate exactly ${count} multiple choice questions for:
Track: ${topic.track.title}
Topic: ${topic.title}
UK Level: ${topic.ukLevel?.code || 'L2'}

JSON Format (MUST be valid):
[
  {
    "prompt": "Question text?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "0",
    "explanation": "Why this answer is correct..."
  }
]`

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
        attempts++
        try {
            const content = await generateCompletion(userPrompt, systemPrompt)
            if (!content) {
                console.warn(`    ⚠️  Attempt ${attempts}: Empty response from LLM`)
                continue
            }

            const questions = safeJsonArrayFromText(content)
            if (questions.length === 0) {
                console.warn(`    ⚠️  Attempt ${attempts}: No valid JSON found in response`)
                continue
            }

            // Validate each question
            const validQuestions = []
            for (const q of questions) {
                // Ensure required fields
                if (!q.prompt || !q.options || q.answer === undefined || !q.explanation) {
                    continue
                }

                // Ensure options is array of strings
                if (!Array.isArray(q.options) || q.options.some(o => typeof o !== 'string')) {
                    continue
                }

                // Validate answer index
                const answerIdx = parseInt(q.answer, 10)
                if (isNaN(answerIdx) || answerIdx < 0 || answerIdx >= q.options.length) {
                    continue
                }

                validQuestions.push({
                    type: 'mcq',
                    prompt: q.prompt,
                    options: JSON.stringify(q.options),
                    answer: JSON.stringify(String(answerIdx)),
                    explanation: q.explanation,
                    difficulty: q.difficulty || 2,
                    topicId: topic.id,
                    ukLevelId: topic.ukLevelId,
                    isPublished: true
                })
            }

            if (validQuestions.length > 0) {
                console.log(`    ✅ Generated ${validQuestions.length}/${count} valid questions (attempt ${attempts})`)
                return validQuestions
            }
        } catch (error) {
            console.error(`    ❌ Attempt ${attempts} failed: ${error.message}`)
        }
    }

    console.warn(`    ⚠️  Could not generate valid questions after ${maxAttempts} attempts`)
    return []
}

async function main() {
    const args = parseArgs(process.argv)
    const dryRun = args.has('--dry-run')
    const targetPerTopic = parseInt(args.get('--target') || '50', 10)

    console.log('\n' + '='.repeat(80))
    console.log('🔧 PHASE 2: DATA CLEANUP & REBUILD')
    console.log('='.repeat(80))
    console.log(`LLM API: ${LLM_API_URL}`)
    console.log(`LLM Model: ${LLM_MODEL}`)
    console.log(`Target questions per topic: ${targetPerTopic}`)
    console.log(`Dry run: ${dryRun}`)
    console.log('='.repeat(80) + '\n')

    // ============================================================================
    // STEP 1: Audit existing questions
    // ============================================================================
    console.log('📊 STEP 1: Auditing existing questions...\n')

    const allQuestions = await prisma.question.findMany({
        include: {
            topic: { include: { track: true, ukLevel: true } }
        }
    })

    const validQuestions = []
    const corruptQuestions = []

    for (const q of allQuestions) {
        const issues = await validateQuestion(q)
        if (issues.length === 0) {
            validQuestions.push(q)
        } else {
            corruptQuestions.push({ ...q, issues })
        }
    }

    console.log(`✅ Valid questions:   ${validQuestions.length}`)
    console.log(`❌ Corrupt questions: ${corruptQuestions.length}`)
    console.log(`📈 Health: ${Math.round((validQuestions.length / allQuestions.length) * 100)}%\n`)

    // Log some corrupt examples
    if (corruptQuestions.length > 0) {
        console.log('Sample corrupt questions (first 5):')
        corruptQuestions.slice(0, 5).forEach((q, i) => {
            console.log(`  ${i + 1}. [${q.type}] ${String(q.prompt).slice(0, 50)}...`)
            console.log(`     Issues: ${q.issues.join(', ')}`)
        })
        console.log()
    }

    // ============================================================================
    // STEP 2: Check which topics need content
    // ============================================================================
    console.log('📋 STEP 2: Analyzing topic coverage...\n')

    const topics = await prisma.topic.findMany({
        include: {
            track: true,
            ukLevel: true,
            _count: { select: { questions: true } }
        },
        orderBy: { track: { title: 'asc' } }
    })

    const underfilledTopics = topics.filter(t => t._count.questions < targetPerTopic)
    const topicsToDelete = underfilledTopics.filter(t => t._count.questions <= 15)

    console.log(`Total topics: ${topics.length}`)
    console.log(`Underfilled (< ${targetPerTopic}): ${underfilledTopics.length}`)
    console.log(`Severely underfilled (<= 15): ${topicsToDelete.length}`)

    if (topicsToDelete.length > 0) {
        console.log('\nTopics that will be cleared and regenerated:')
        topicsToDelete.forEach(t => {
            console.log(`  • [${t.track.title}] ${t.title} (${t._count.questions} → 0 → regenerate)`)
        })
    }
    console.log()

    if (dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made.\n')
        return
    }

    // ============================================================================
    // STEP 3: Delete corrupt questions
    // ============================================================================
    console.log('🗑️  STEP 3: Deleting corrupt questions...\n')

    const corruptIds = corruptQuestions.map(q => q.id)
    if (corruptIds.length > 0) {
        const deleted = await prisma.question.deleteMany({
            where: { id: { in: corruptIds } }
        })
        console.log(`✅ Deleted ${deleted.count} corrupt questions\n`)
    } else {
        console.log('✅ No corrupt questions to delete\n')
    }

    // ============================================================================
    // STEP 4: Regenerate underfilledTopics
    // ============================================================================
    console.log('🔄 STEP 4: Regenerating content for underfilled topics...\n')

    let totalGenerated = 0

    for (const topic of underfilledTopics) {
        const currentCount = await prisma.question.count({
            where: { topicId: topic.id }
        })
        
        if (currentCount >= targetPerTopic) {
            console.log(`✅ ${topic.title}: Already has ${currentCount} questions`)
            continue
        }

        const needed = targetPerTopic - currentCount
        const generated = await generateQuestionsForTopic(topic, needed)

        if (generated.length > 0) {
            await prisma.question.createMany({
                data: generated
            })
            console.log(`   ✅ Saved ${generated.length} new questions to database`)
            totalGenerated += generated.length
        } else {
            console.log(`   ⚠️  Could not generate questions for this topic`)
        }
    }

    console.log(`\n📊 Generated & saved: ${totalGenerated} new questions\n`)

    // ============================================================================
    // STEP 5: Final audit
    // ============================================================================
    console.log('📊 STEP 5: Final integrity audit...\n')

    const finalQuestions = await prisma.question.findMany({
        include: { topic: { include: { track: true } } }
    })

    let finalValid = 0
    let finalCorrupt = 0

    for (const q of finalQuestions) {
        const issues = await validateQuestion(q)
        if (issues.length === 0) {
            finalValid++
        } else {
            finalCorrupt++
        }
    }

    console.log(`✅ Final valid questions:   ${finalValid}`)
    console.log(`❌ Final corrupt questions: ${finalCorrupt}`)
    console.log(`📈 Final health: ${Math.round((finalValid / finalQuestions.length) * 100)}%\n`)

    // Topic coverage
    const finalTopicStats = await prisma.topic.findMany({
        include: {
            track: true,
            _count: { select: { questions: true } }
        },
        orderBy: { track: { title: 'asc' } }
    })

    const stillUnderfilled = finalTopicStats.filter(t => t._count.questions < targetPerTopic)
    console.log(`Topics still underfilled (< ${targetPerTopic}): ${stillUnderfilled.length}`)
    
    if (stillUnderfilled.length > 0) {
        stillUnderfilled.forEach(t => {
            console.log(`  ⚠️  ${t.title}: ${t._count.questions}/${targetPerTopic}`)
        })
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ PHASE 2 COMPLETE')
    console.log('='.repeat(80) + '\n')
}

main()
    .catch((e) => {
        console.error('\n❌ Error:', e.message)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
