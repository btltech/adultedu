#!/usr/bin/env node
/**
 * Top up the question bank to a target number of published questions per topic.
 *
 * Supports:
 * - Postgres (default) via `@prisma/client` and `DATABASE_URL`
 * - Legacy SQLite `prisma/dev.db` via generated sqlite client and `SQLITE_DATABASE_URL`
 *
 * Uses a local OpenAI-compatible LLM (LM Studio) for generation.
 * Optionally uses an embeddings model for semantic de-duplication.
 *
 * Examples:
 *   # Dry-run against SQLite dev.db (no writes)
 *   LLM_API_URL="http://192.168.1.51:1234" LLM_MODEL="qwen3-coder-30b-a3b-instruct-mlx" \
 *     node scripts/top-up-question-bank.js --db=sqlite --target=50 --batch=10
 *
 *   # Apply against SQLite dev.db (writes into prisma/dev.db)
 *   LLM_API_URL="http://192.168.1.51:1234" LLM_MODEL="qwen3-coder-30b-a3b-instruct-mlx" \
 *   EMBEDDINGS_MODEL="text-embedding-nomic-embed-text-v1.5" \
 *     node scripts/top-up-question-bank.js --db=sqlite --target=50 --batch=10 --dedupe=both --apply
 *
 *   # Apply against Railway Postgres (run from backend dir after `railway link`)
 *   LLM_API_URL="http://192.168.1.51:1234" LLM_MODEL="qwen3-coder-30b-a3b-instruct-mlx" \
 *     railway run -- node scripts/top-up-question-bank.js --db=postgres --target=50 --batch=10 --apply
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient as PostgresClient } from '@prisma/client'
import { PrismaClient as SqliteClient } from '../generated/sqlite-client/index.js'
import { QUESTION_TARGET_PROFILE_NAME, resolveQuestionTarget } from './question-target-profile.js'

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        if (!part.startsWith('--')) continue
        const [k, v] = part.split('=')
        args.set(k, v ?? true)
    }
    return args
}

function clampInt(value, min, max, fallback) {
    const n = Number.parseInt(String(value), 10)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

function clampFloat(value, min, max, fallback) {
    const n = Number.parseFloat(String(value))
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

function normalizeV1Url(input) {
    const base = String(input || '').trim()
    if (!base) return 'http://127.0.0.1:1234/v1'
    const clean = base.replace(/\/+$/, '')
    return clean.endsWith('/v1') ? clean : `${clean}/v1`
}

function normalizePrompt(input) {
    return String(input || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
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

function computeTypePlanForMode(total, mode) {
    if (mode === 'diverse') {
        // Mix: 55% MCQ, 20% scenario, 10% true/false, 10% short_answer, 5% multi_step (scaffolded)
        const scenario = Math.max(0, Math.round(total * 0.2))
        const trueFalse = Math.max(0, Math.round(total * 0.1))
        const shortAnswer = Math.max(0, Math.round(total * 0.1))
        const multiStep = Math.max(0, Math.round(total * 0.05))
        const mcq = Math.max(0, total - scenario - trueFalse - shortAnswer - multiStep)
        return { mcq, scenario, true_false: trueFalse, short_answer: shortAnswer, multi_step: multiStep }
    }

    // Robust default: option-based types only.
    const scenario = Math.max(0, Math.round(total * 0.2))
    const trueFalse = Math.max(0, Math.round(total * 0.1))
    const mcq = Math.max(0, total - scenario - trueFalse)
    return { mcq, scenario, true_false: trueFalse }
}

function buildUserPrompt({ batch, trackTitle, topicTitle, levelCode, frameworkHint, plan, mode, existingSnippets, compact }) {
    if (compact) {
        return [
            `Create exactly ${batch} NEW questions.`,
            `Track: ${trackTitle}`,
            `Topic: ${topicTitle}`,
            `UK level: ${levelCode}`,
            `Hint: ${frameworkHint}`,
            '',
            `Counts: mcq=${plan.mcq}, scenario=${plan.scenario}, true_false=${plan.true_false}${mode === 'diverse' ? `, short_answer=${plan.short_answer}, multi_step=${plan.multi_step}` : ''}`,
            '',
            'Rules:',
            '- Return JSON array only.',
            '- No repeated ideas or wording.',
            '- mcq/scenario: exactly 4 options and integer answerIndex.',
            '- true_false: options must be ["True","False"] with answerIndex 0 or 1.',
            ...(mode === 'diverse'
                ? [
                    '- short_answer: use answer as a short string and no options.',
                    '- multi_step: provide 2-5 steps with prompt, 4 options, answer string, explanation.',
                ]
                : []),
            '- Include explanation, difficulty 1-5, 2 hints, and 2-4 solutionSteps.',
            existingSnippets.length ? `Avoid these prompts: ${existingSnippets.join(' | ')}` : 'Avoid previously used prompts.',
            '',
            'Schema:',
            '[{"type":"mcq|true_false|scenario' + (mode === 'diverse' ? '|short_answer|multi_step' : '') + '","prompt":"string","options":["..."],"answerIndex":0,"answer":"string(short_answer only)","steps":[{"prompt":"...","options":["...","...","...","..."],"answer":"option text","explanation":"..."}],"explanation":"string","difficulty":1,"hints":["a","b"],"solutionSteps":["a","b"]}]',
        ].join('\n')
    }

    return [
        `Create exactly ${batch} NEW questions for:`,
        `Track: ${trackTitle}`,
        `Topic: ${topicTitle}`,
        `UK level: ${levelCode}`,
        `Track slug hint: ${frameworkHint}`,
        '',
        `Mix these types (exact counts):`,
        `- mcq: ${plan.mcq}`,
        `- scenario: ${plan.scenario} (scenario-based MCQ with 4 options)`,
        `- true_false: ${plan.true_false} (options must be ["True","False"])`,
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
        '- For true_false: options must be exactly ["True","False"].',
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

function computeNorm(vec) {
    let sum = 0
    for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i]
    return Math.sqrt(sum)
}

function cosineSim(a, b, normA, normB) {
    let dot = 0
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
    return dot / (normA * normB)
}

async function embedTexts({ v1Url, model, inputs }) {
    if (!inputs.length) return []

    const response = await fetch(`${v1Url}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            input: inputs,
        }),
    })

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Embeddings API error ${response.status}: ${response.statusText}${body ? `\n${body}` : ''}`)
    }

    const data = await response.json()
    const rows = Array.isArray(data?.data) ? data.data : []
    // Response items contain { embedding, index } and should already be in order, but sort defensively.
    rows.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    return rows.map((r) => r.embedding)
}

async function generateCompletion({ v1Url, model, prompt, systemPrompt, maxTokens }) {
    const response = await fetch(`${v1Url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: maxTokens,
        }),
    })

    if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`LLM API error ${response.status}: ${response.statusText}${body ? `\n${body}` : ''}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}

function getDefaultSqliteUrl() {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url))
    const backendDir = path.resolve(scriptDir, '..')
    const dbPath = path.join(backendDir, 'prisma', 'dev.db')
    return `file:${dbPath}`
}

async function main() {
    const args = parseArgs(process.argv)

    const apply = args.get('--apply') === true
    const db = String(args.get('--db') || 'postgres') // postgres | sqlite
    const category = String(args.get('--category') || 'all') // all | workplace | qual_prep | tech | he
    const trackSlug = args.get('--track-slug') ? String(args.get('--track-slug')) : null
    const topicTitleContains = args.get('--topic-title-contains')
        ? String(args.get('--topic-title-contains')).split(',').map((value) => value.trim()).filter(Boolean)
        : []
    const target = clampInt(args.get('--target') ?? '50', 1, 500, 50)
    const targetProfile = String(args.get('--target-profile') || QUESTION_TARGET_PROFILE_NAME)
    const batchSize = clampInt(args.get('--batch') ?? '10', 1, 25, 10)
    const mode = String(args.get('--mode') || 'option') // option | diverse
    const maxTopics = args.get('--max-topics') ? clampInt(args.get('--max-topics'), 1, 10_000, 1000) : null
    const delayMs = args.get('--delay-ms') ? clampInt(args.get('--delay-ms'), 0, 60_000, 2000) : 2000
    const retries = args.get('--retries') ? clampInt(args.get('--retries'), 0, 10, 2) : 2

    const dedupe = String(args.get('--dedupe') || 'exact') // none | exact | embedding | both
    const similarity = clampFloat(args.get('--similarity') ?? '0.92', 0.5, 0.999, 0.92)

    const v1Url = normalizeV1Url(process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1')
    const model = process.env.LLM_MODEL || 'qwen3-coder-30b-a3b-instruct'
    const embedModel = process.env.EMBEDDINGS_MODEL || 'text-embedding-nomic-embed-text-v1.5'
    const maxTokens = clampInt(process.env.LLM_MAX_TOKENS || '2500', 256, 16_000, 2500)

    if (db === 'sqlite') {
        process.env.SQLITE_DATABASE_URL = process.env.SQLITE_DATABASE_URL || getDefaultSqliteUrl()
    }

    console.log(`🗄️  db:             ${db}`)
    if (db === 'sqlite') console.log(`🧱 SQLITE_DATABASE_URL: ${process.env.SQLITE_DATABASE_URL}`)
    console.log(`🔌 LLM_API_URL:     ${v1Url}`)
    console.log(`🧠 LLM_MODEL:       ${model}`)
    console.log(`🧬 EMBEDDINGS_MODEL:${embedModel}`)
    console.log(`🎯 target=${target} profile=${targetProfile} batch=${batchSize} mode=${mode} category=${category}${trackSlug ? ` track=${trackSlug}` : ''}`)
    if (topicTitleContains.length) {
        console.log(`🧭 topic filter:    ${topicTitleContains.join(', ')}`)
    }
    console.log(`🧹 dedupe=${dedupe}${dedupe.includes('embedding') ? ` similarity=${similarity}` : ''} apply=${apply}\n`)

    const prisma = db === 'sqlite' ? new SqliteClient() : new PostgresClient()

    try {
        const trackWhere = {}
        if (category !== 'all') trackWhere.category = category
        if (trackSlug) trackWhere.slug = trackSlug

        const where = Object.keys(trackWhere).length ? { track: trackWhere } : {}

        const topics = await prisma.topic.findMany({
            where,
            include: {
                track: { select: { slug: true, title: true, category: true } },
                ukLevel: { select: { code: true, title: true } },
                _count: { select: { questions: { where: { isPublished: true } } } },
            },
            orderBy: [{ track: { title: 'asc' } }, { sortOrder: 'asc' }],
        })

        const selectedTopics = topicTitleContains.length
            ? topics.filter((topic) =>
                topicTitleContains.some((needle) => topic.title.toLowerCase().includes(needle.toLowerCase()))
            )
            : topics

        if (!selectedTopics.length) {
            console.log('No topics found for the selected filters.')
            return
        }

        const low = selectedTopics
            .map((t) => {
                const effectiveTarget = targetProfile === 'flat'
                    ? target
                    : resolveQuestionTarget({
                        trackSlug: t.track?.slug,
                        category: t.track?.category,
                        fallbackTarget: target,
                    })

                return {
                    topic: t,
                    count: t._count.questions,
                    target: effectiveTarget,
                    need: Math.max(0, effectiveTarget - t._count.questions),
                }
            })
            .filter((x) => x.need > 0)

        const limited = maxTopics ? low.slice(0, maxTopics) : low

        const totalNeed = limited.reduce((sum, x) => sum + x.need, 0)
    console.log(`📚 Topics below target: ${limited.length}/${selectedTopics.length}`)
        console.log(`➕ Total questions needed to reach target: ${totalNeed}`)

        if (!apply) {
            console.log('\nDry run only. Add --apply to write questions to the database.')
            return
        }

        const systemPrompt = [
            'You are an expert UK education content writer.',
            'You generate high-quality practice questions with UK contexts.',
            'Create original questions; do not copy copyrighted exam questions verbatim.',
            'Return ONLY valid JSON (no markdown, no commentary).',
            'All questions must be answerable without images or external links.',
            'Keep language clear and supportive; avoid trick questions.',
            'Match the topic, level, and domain (e.g., GCSE science vs workplace skills vs AWS cloud).',
        ].join('\n')

        let totalCreated = 0

        for (const [i, item] of limited.entries()) {
            const { topic } = item
            const trackTitle = topic.track.title
            const topicTitle = topic.title
            const levelCode = topic.ukLevel.code
            const frameworkHint = topic.track.slug

            let need = item.need
            console.log(`\n[${i + 1}/${limited.length}] ${trackTitle} / ${topicTitle} (${levelCode}) has ${item.count}, target ${item.target}, need ${need}`)

            const existing = await prisma.question.findMany({
                where: { topicId: topic.id },
                select: { prompt: true },
            })
            const promptSet = new Set(existing.map((q) => normalizePrompt(q.prompt)))

            const useEmbeddingDedupe = dedupe === 'embedding' || dedupe === 'both'
            let embedIndex = []

            if (useEmbeddingDedupe) {
                const prompts = [...promptSet].filter(Boolean)
                try {
                    const embeddings = await embedTexts({ v1Url, model: embedModel, inputs: prompts })
                    embedIndex = embeddings.map((vec) => ({ vec, norm: computeNorm(vec) }))
                } catch (e) {
                    console.error(`   ⚠️  Embeddings unavailable; falling back to exact dedupe only: ${e.message}`)
                }
            }

            while (need > 0) {
                const batch = Math.min(batchSize, need)
                const plan = computeTypePlanForMode(batch, mode)

                const existingSnippets = existing
                    .slice(-4)
                    .map((q) => String(q.prompt).replace(/\s+/g, ' ').trim().slice(0, 60))
                    .filter(Boolean)

                let compactPrompt = false
                let currentMaxTokens = maxTokens
                let userPrompt = buildUserPrompt({
                    batch,
                    trackTitle,
                    topicTitle,
                    levelCode,
                    frameworkHint,
                    plan,
                    mode,
                    existingSnippets,
                    compact: compactPrompt,
                })

                let generated = null
                for (let attempt = 0; attempt <= retries; attempt++) {
                    let content
                    try {
                        content = await generateCompletion({ v1Url, model, prompt: userPrompt, systemPrompt, maxTokens: currentMaxTokens })
                    } catch (e) {
                        console.error(`   ❌ LLM request failed (attempt ${attempt + 1}/${retries + 1}): ${e.message}`)
                        if (String(e.message).toLowerCase().includes('context size has been exceeded')) {
                            compactPrompt = true
                            currentMaxTokens = Math.max(1200, Math.floor(currentMaxTokens * 0.7))
                            userPrompt = buildUserPrompt({
                                batch,
                                trackTitle,
                                topicTitle,
                                levelCode,
                                frameworkHint,
                                plan,
                                mode,
                                existingSnippets,
                                compact: compactPrompt,
                            })
                            console.error(`   ↪ Retrying with compact prompt and maxTokens=${currentMaxTokens}`)
                        }
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

                // Validate + exact dedupe first, then semantic dedupe if enabled.
                const candidates = []
                const batchPromptSet = new Set()

                for (const raw of generated) {
                    const validated = validateGeneratedItem(raw)
                    if (!validated.ok) continue

                    const normalized = normalizePrompt(validated.value.prompt)
                    if (!normalized) continue
                    if (promptSet.has(normalized) || batchPromptSet.has(normalized)) continue

                    batchPromptSet.add(normalized)
                    candidates.push({ normalized, value: validated.value })
                }

                if (candidates.length === 0) {
                    console.log('   ⚠️  No valid unique questions in this batch; stopping for this topic.')
                    break
                }

                let accepted = candidates
                if (useEmbeddingDedupe && embedIndex.length > 0) {
                    try {
                        const embeddings = await embedTexts({
                            v1Url,
                            model: embedModel,
                            inputs: candidates.map((c) => c.value.prompt),
                        })

                        accepted = []
                        for (let idx = 0; idx < candidates.length; idx++) {
                            const vec = embeddings[idx]
                            const norm = computeNorm(vec)

                            let maxSim = -1
                            for (const existingVec of embedIndex) {
                                const sim = cosineSim(vec, existingVec.vec, norm, existingVec.norm)
                                if (sim > maxSim) maxSim = sim
                                if (maxSim >= similarity) break
                            }

                            if (maxSim >= similarity) continue

                            accepted.push(candidates[idx])
                            embedIndex.push({ vec, norm })
                        }
                    } catch (e) {
                        console.error(`   ⚠️  Embedding dedupe failed; proceeding with exact dedupe only: ${e.message}`)
                    }
                }

                if (accepted.length === 0) {
                    console.log('   ⚠️  All generated questions looked too similar; stopping for this topic.')
                    break
                }

                const toCreate = []
                for (const candidate of accepted) {
                    const v = candidate.value

                    const sourceMeta = {
                        hints: (v.hints || []).slice(0, 4),
                        solutionSteps: (v.solutionSteps || []).slice(0, 8),
                    }

                    const common = {
                        topicId: topic.id,
                        ukLevelId: topic.ukLevelId,
                        type: v.type,
                        prompt: v.prompt,
                        explanation: v.explanation,
                        difficulty: v.difficulty,
                        sourceMeta: JSON.stringify(sourceMeta),
                        isPublished: true,
                    }

                    if (v.type === 'short_answer') {
                        toCreate.push({
                            ...common,
                            options: null,
                            answer: v.answerText,
                            assets: null,
                        })
                    } else if (v.type === 'multi_step') {
                        toCreate.push({
                            ...common,
                            options: null,
                            answer: 'Completed',
                            assets: JSON.stringify({ steps: v.steps }),
                        })
                    } else {
                        toCreate.push({
                            ...common,
                            options: JSON.stringify(v.options),
                            answer: JSON.stringify(v.answerIndex),
                            assets: null,
                        })
                    }

                    promptSet.add(candidate.normalized)
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
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((e) => {
    console.error(e)
    process.exitCode = 1
})

