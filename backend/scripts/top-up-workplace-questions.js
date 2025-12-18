/**
 * Top up Workplace (general adult skills) topics to a target question count.
 *
 * Uses a local OpenAI-compatible LLM (LM Studio) to generate new questions.
 *
 * Usage:
 *   LLM_API_URL="http://192.168.1.51:1234/v1" LLM_MODEL="qwen3-coder-30b-a3b-instruct-mlx" \
 *     node scripts/top-up-workplace-questions.js --target=50 --batch=10 --apply
 *
 *   # More variety (adds short_answer + scaffolded multi_step):
 *   LLM_API_URL="http://192.168.1.51:1234/v1" LLM_MODEL="qwen3-coder-30b-a3b-instruct-mlx" \
 *     node scripts/top-up-workplace-questions.js --target=50 --batch=10 --mode=diverse --apply
 *
 * Defaults:
 *   --target=50
 *   --batch=10
 *   --category=workplace
 *   --mode=option
 *
 * Notes:
 * - Mode "option" generates only: mcq, true_false, scenario.
 * - Mode "diverse" adds: short_answer and scaffolded multi_step (assets.steps).
 * - Writes to DB only when --apply is provided (otherwise dry-run).
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1'
const MODEL_NAME = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct-mlx'

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        if (!part.startsWith('--')) continue
        const [k, v] = part.split('=')
        args.set(k, v ?? true)
    }
    return args
}

function normalizePrompt(input) {
    return String(input || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
}

function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10)
    if (Number.isNaN(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

function safeJsonArrayFromText(text) {
    let clean = String(text || '').trim()
    clean = clean.replace(/```json\n?|\n?```/g, '').trim()

    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    if (start !== -1 && end !== -1) {
        clean = clean.slice(start, end + 1)
    }

    // common trailing comma cleanup
    clean = clean.replace(/,(\s*[}\]])/g, '$1')

    const parsed = JSON.parse(clean)
    if (!Array.isArray(parsed)) throw new Error('LLM response is not a JSON array')
    return parsed
}

async function generateCompletion(prompt, systemPrompt) {
    const response = await fetch(`${LLM_API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 6000,
        }),
    })

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`LLM API error ${response.status}: ${response.statusText}${body ? `\n${body}` : ''}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}

function computeTypePlan(total) {
    return computeTypePlanForMode(total, 'option')
}

function computeTypePlanForMode(total, mode) {
    if (mode === 'diverse') {
        // Add some variety without making the generator too brittle.
        // Mix: 55% MCQ, 20% scenario, 10% true/false, 10% short_answer, 5% multi_step (scaffolded)
        const scenario = Math.max(0, Math.round(total * 0.2))
        const trueFalse = Math.max(0, Math.round(total * 0.1))
        const shortAnswer = Math.max(0, Math.round(total * 0.1))
        const multiStep = Math.max(0, Math.round(total * 0.05))
        const mcq = Math.max(0, total - scenario - trueFalse - shortAnswer - multiStep)
        return { mcq, scenario, true_false: trueFalse, short_answer: shortAnswer, multi_step: multiStep }
    }

    // Keep it simple and robust across the app: only option-based question types.
    // Rough mix: 70% MCQ, 20% scenario MCQ, 10% true/false.
    const scenario = Math.max(0, Math.round(total * 0.2))
    const trueFalse = Math.max(0, Math.round(total * 0.1))
    const mcq = Math.max(0, total - scenario - trueFalse)
    return { mcq, scenario, true_false: trueFalse }
}

function validateGeneratedItem(item) {
    const type = item?.type
    if (!['mcq', 'true_false', 'scenario', 'short_answer', 'multi_step'].includes(type)) {
        return { ok: false, reason: 'invalid type' }
    }

    const prompt = String(item?.prompt || '').trim()
    const explanation = String(item?.explanation || '').trim()
    if (prompt.length < 8) return { ok: false, reason: 'prompt too short' }
    if (explanation.length < 8) return { ok: false, reason: 'explanation too short' }

    const difficulty = clampInt(item?.difficulty, 1, 5, 3)
    const hints = Array.isArray(item?.hints) ? item.hints.filter((h) => typeof h === 'string') : []
    const solutionSteps = Array.isArray(item?.solutionSteps)
        ? item.solutionSteps.filter((s) => typeof s === 'string')
        : []

    if (type === 'short_answer') {
        const answerText = String(item?.answer ?? '').trim()
        if (!answerText) return { ok: false, reason: 'missing short answer' }
        return {
            ok: true,
            value: {
                type,
                prompt,
                answerText,
                explanation,
                difficulty,
                hints,
                solutionSteps,
            },
        }
    }

    if (type === 'multi_step') {
        const steps = Array.isArray(item?.steps) ? item.steps : null
        if (!steps || steps.length < 2) return { ok: false, reason: 'multi_step missing steps' }
        if (steps.length > 5) return { ok: false, reason: 'multi_step too many steps' }

        const validatedSteps = []
        for (const step of steps) {
            const stepPrompt = String(step?.prompt ?? '').trim()
            const stepExplanation = String(step?.explanation ?? '').trim()
            const stepOptions = step?.options
            const stepAnswer = String(step?.answer ?? '').trim()

            if (stepPrompt.length < 5) return { ok: false, reason: 'multi_step step prompt too short' }
            if (!Array.isArray(stepOptions) || stepOptions.length !== 4) return { ok: false, reason: 'multi_step step options invalid' }
            if (stepExplanation.length < 5) return { ok: false, reason: 'multi_step step explanation too short' }
            if (!stepAnswer) return { ok: false, reason: 'multi_step step answer missing' }

            // Ensure answer matches one of the options (case-insensitive, whitespace-normalized)
            const inOptions = stepOptions
                .map((o) => normalizePrompt(String(o)))
                .includes(normalizePrompt(stepAnswer))
            if (!inOptions) return { ok: false, reason: 'multi_step step answer not in options' }

            validatedSteps.push({
                prompt: stepPrompt,
                options: stepOptions.map((o) => String(o)),
                answer: stepAnswer,
                explanation: stepExplanation,
            })
        }

        return {
            ok: true,
            value: {
                type,
                prompt,
                steps: validatedSteps,
                explanation,
                difficulty,
                hints,
                solutionSteps,
            },
        }
    }

    const options = item?.options
    if (!Array.isArray(options) || options.length < 2) return { ok: false, reason: 'missing options' }

    if (type === 'true_false') {
        if (options.length !== 2) return { ok: false, reason: 'true_false must have 2 options' }
    } else {
        if (options.length !== 4) return { ok: false, reason: 'mcq/scenario must have 4 options' }
    }

    const answerIndex = Number(item?.answerIndex)
    if (!Number.isInteger(answerIndex)) return { ok: false, reason: 'answerIndex not integer' }
    if (answerIndex < 0 || answerIndex >= options.length) return { ok: false, reason: 'answerIndex out of range' }

    return {
        ok: true,
        value: {
            type,
            prompt,
            options: options.map((o) => String(o)),
            answerIndex,
            explanation,
            difficulty,
            hints,
            solutionSteps,
        },
    }
}

async function main() {
    const args = parseArgs(process.argv)

    const apply = args.get('--apply') === true
    const category = String(args.get('--category') || 'workplace')
    const target = clampInt(args.get('--target') ?? '50', 1, 500, 50)
    const batchSize = clampInt(args.get('--batch') ?? '10', 1, 25, 10)
    const mode = String(args.get('--mode') || 'option') // option | diverse
    const maxTopics = args.get('--max-topics') ? clampInt(args.get('--max-topics'), 1, 10_000, 1000) : null
    const delayMs = args.get('--delay-ms') ? clampInt(args.get('--delay-ms'), 0, 60_000, 2000) : 2000
    const retries = args.get('--retries') ? clampInt(args.get('--retries'), 0, 10, 2) : 2

    console.log(`🔌 LLM_API_URL: ${LLM_API_URL}`)
    console.log(`🧠 LLM_MODEL:   ${MODEL_NAME}`)
    console.log(`🎯 category=${category} target=${target} batch=${batchSize} mode=${mode} apply=${apply} retries=${retries}`)

    const topics = await prisma.topic.findMany({
        where: { track: { category } },
        include: {
            track: { select: { slug: true, title: true } },
            ukLevel: { select: { code: true, title: true } },
            _count: { select: { questions: { where: { isPublished: true } } } },
        },
        orderBy: [{ track: { title: 'asc' } }, { sortOrder: 'asc' }],
    })

    const low = topics
        .map((t) => ({
            topic: t,
            count: t._count.questions,
            need: Math.max(0, target - t._count.questions),
        }))
        .filter((x) => x.need > 0)

    const limited = maxTopics ? low.slice(0, maxTopics) : low

    const totalNeed = limited.reduce((sum, x) => sum + x.need, 0)
    console.log(`📚 Topics below target: ${limited.length}`)
    console.log(`➕ Total questions needed to reach target: ${totalNeed}`)

    if (!apply) {
        console.log('\nDry run only. Add --apply to write questions to the database.')
        return
    }

    const systemPrompt = [
        'You are an expert UK adult education content writer.',
        'You generate high-quality practice questions for adult learners (19+) with UK contexts.',
        'Create original questions; do not copy copyrighted exam questions verbatim.',
        'Return ONLY valid JSON (no markdown, no commentary).',
        'All questions must be answerable without images or external links.',
        'Keep language clear and supportive; avoid trick questions.',
    ].join('\n')

    let totalCreated = 0

    for (const [i, item] of limited.entries()) {
        const { topic } = item
        const trackTitle = topic.track.title
        const topicTitle = topic.title
        const levelCode = topic.ukLevel.code

        let need = item.need
        console.log(`\n[${i + 1}/${limited.length}] ${trackTitle} / ${topicTitle} (${levelCode}) has ${item.count}, need ${need}`)

        // Dedup: build a prompt set per-topic
        const existing = await prisma.question.findMany({
            where: { topicId: topic.id },
            select: { prompt: true },
        })
        const promptSet = new Set(existing.map((q) => normalizePrompt(q.prompt)))

        while (need > 0) {
            const batch = Math.min(batchSize, need)
            const plan = computeTypePlanForMode(batch, mode)

            const existingSnippets = existing
                .slice(-12)
                .map((q) => String(q.prompt).replace(/\s+/g, ' ').trim().slice(0, 80))
                .filter(Boolean)

            const userPrompt = [
                `Create exactly ${batch} NEW questions for:`,
                `Track: ${trackTitle}`,
                `Topic: ${topicTitle}`,
                `UK level: ${levelCode}`,
                '',
                `Mix these types (exact counts):`,
                `- mcq: ${plan.mcq}`,
                `- scenario: ${plan.scenario} (scenario-based MCQ with 4 options)`,
                `- true_false: ${plan.true_false} (options must be [\"True\",\"False\"])`,
                ...(mode === 'diverse'
                    ? [
                        `- short_answer: ${plan.short_answer} (no options; answer is a short string)`,
                        `- multi_step: ${plan.multi_step} (scaffolded; include steps array; each step has 4 options and answer is the correct option string)`,
                    ]
                    : []),
                '',
                'Hard rules:',
                '- Do NOT repeat any of the existing prompts/snippets.',
                '- For mcq/scenario: options must be exactly 4 distinct strings, with one best answer.',
                '- For true_false: options must be exactly [\"True\",\"False\"].',
                '- For mcq/scenario/true_false: provide answerIndex as an integer index into options.',
                ...(mode === 'diverse'
                    ? [
                        '- For short_answer: do NOT include options; provide "answer" as a short string.',
                        '- For multi_step: provide "steps" as an array of 2-5 steps.',
                        '- For each multi_step step: include prompt, options (4), answer (string that matches one option), explanation.',
                        '- Do NOT use answerIndex inside steps.',
                    ]
                    : []),
                '- Provide a short, helpful explanation.',
                '- Provide difficulty as integer 1-5.',
                '- Provide 2 hints and 2-4 solutionSteps for each question.',
                '',
                'Existing snippets (avoid these concepts/wording):',
                existingSnippets.length ? existingSnippets.map((s) => `- ${s}`).join('\n') : '- (none)',
                '',
                'JSON format (return ONLY a JSON array):',
                '[',
                '  {',
                `    "type": "mcq|true_false|scenario${mode === 'diverse' ? '|short_answer|multi_step' : ''}",`,
                '    "prompt": "string",',
                ...(mode === 'diverse'
                    ? [
                        '    "options": ["string", "..."] ,',
                        '    "answerIndex": 0,',
                        '    "answer": "string (short_answer only)",',
                        '    "steps": [ { "prompt":"...", "options":["...","...","...","..."], "answer":"<must match one option>", "explanation":"..." } ],',
                    ]
                    : [
                        '    "options": ["string", "..."],',
                        '    "answerIndex": 0,',
                    ]),
                '    "explanation": "string",',
                '    "difficulty": 1,',
                '    "hints": ["string", "string"],',
                '    "solutionSteps": ["string", "string"]',
                '  }',
                ']',
            ].join('\n')

            let generated = null
            for (let attempt = 0; attempt <= retries; attempt++) {
                let content
                try {
                    content = await generateCompletion(userPrompt, systemPrompt)
                } catch (e) {
                    console.error(`   ❌ LLM request failed (attempt ${attempt + 1}/${retries + 1}): ${e.message}`)
                    if (attempt === retries) break
                    continue
                }

                try {
                    generated = safeJsonArrayFromText(content)
                    break
                } catch (e) {
                    console.error(`   ❌ JSON parse failed (attempt ${attempt + 1}/${retries + 1}): ${e.message}`)
                    if (attempt === retries) break
                }
            }

            if (!generated) {
                console.log('   ⚠️  Skipping this topic due to repeated LLM/JSON failures.')
                break
            }

            const toCreate = []
            for (const raw of generated) {
                const validated = validateGeneratedItem(raw)
                if (!validated.ok) continue

                const normalized = normalizePrompt(validated.value.prompt)
                if (promptSet.has(normalized)) continue

                const sourceMeta = {
                    hints: validated.value.hints.slice(0, 4),
                    solutionSteps: validated.value.solutionSteps.slice(0, 8),
                }

                const common = {
                    topicId: topic.id,
                    ukLevelId: topic.ukLevelId,
                    type: validated.value.type,
                    prompt: validated.value.prompt,
                    explanation: validated.value.explanation,
                    difficulty: validated.value.difficulty,
                    sourceMeta: JSON.stringify(sourceMeta),
                    isPublished: true,
                }

                if (validated.value.type === 'short_answer') {
                    toCreate.push({
                        ...common,
                        options: null,
                        answer: validated.value.answerText,
                        assets: null,
                    })
                } else if (validated.value.type === 'multi_step') {
                    toCreate.push({
                        ...common,
                        options: null,
                        answer: 'Completed',
                        assets: JSON.stringify({ steps: validated.value.steps }),
                    })
                } else {
                    toCreate.push({
                        ...common,
                        options: JSON.stringify(validated.value.options),
                        answer: JSON.stringify(validated.value.answerIndex),
                        assets: null,
                    })
                }

                promptSet.add(normalized)
            }

            if (toCreate.length === 0) {
                console.log('   ⚠️  No valid unique questions in this batch; stopping for this topic.')
                break
            }

            await prisma.question.createMany({ data: toCreate })

            // Keep snippets fresh so later batches avoid newly created prompts too.
            for (const created of toCreate) {
                existing.push({ prompt: created.prompt })
            }

            totalCreated += toCreate.length
            need -= toCreate.length
            console.log(`   ✅ Added ${toCreate.length}. Remaining for topic: ${need}`)

            if (delayMs > 0) {
                await new Promise((r) => setTimeout(r, delayMs))
            }
        }
    }

    console.log(`\n✨ Done. Total new questions added: ${totalCreated}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
