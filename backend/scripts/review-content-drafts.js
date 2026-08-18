#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_ORIGIN = 'http://127.0.0.1:1234'
const DEFAULT_MODEL = 'qwen/qwen3.8-27b'

function args(argv = process.argv.slice(2)) {
    const out = {}
    for (const part of argv) {
        if (!part.startsWith('--')) continue
        const [key, ...rest] = part.slice(2).split('=')
        out[key] = rest.length ? rest.join('=') : true
    }
    return out
}

function parseJson(value) {
    const text = String(value || '').trim()
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] || text
    return JSON.parse(fenced)
}

function responseContent(data) {
    return data?.output?.find((item) => item.type === 'message')?.content
        || data?.choices?.[0]?.message?.content
        || ''
}

function validateReview(review, practiceCount) {
    if (!review || typeof review !== 'object' || Array.isArray(review)) throw new Error('review is not an object')
    if (!['pass', 'rewrite', 'uncertain'].includes(review.decision)) throw new Error('invalid bundle decision')
    if (!Array.isArray(review.items) || review.items.length !== practiceCount) throw new Error('item review count does not match practice count')
    for (const item of review.items) {
        if (!item || typeof item !== 'object') throw new Error('invalid item review')
        if (!['pass', 'rewrite', 'uncertain'].includes(item.decision)) throw new Error('invalid item decision')
        if (typeof item.reason !== 'string' || !item.reason.trim()) throw new Error('item review is missing a reason')
        if (item.decision === 'rewrite') {
            const proposed = item.proposed
            if (!proposed || typeof proposed.prompt !== 'string' || !Array.isArray(proposed.options) || !Number.isInteger(proposed.correctIndex) || typeof proposed.explanation !== 'string') throw new Error('rewrite proposal is incomplete')
            if (proposed.options.length !== 4 || proposed.correctIndex < 0 || proposed.correctIndex >= proposed.options.length) throw new Error('rewrite proposal has invalid options or index')
            const keys = proposed.options.map((option) => String(option).trim().toLowerCase())
            if (keys.some((option) => !option) || new Set(keys).size !== keys.length) throw new Error('rewrite proposal options are not distinct')
            if (/\b(?:A|B|C|D)[.)]\s+/.test(proposed.prompt)) throw new Error('rewrite prompt embeds answer labels')
        }
    }
    return review
}

function reviewPrompt(bundle) {
    const lesson = bundle.lesson || {}
    const unit = bundle.unit || {}
    const practice = Array.isArray(lesson.practice) ? lesson.practice : []
    const instruction = 'Review generated practice questions for a UK adult-learning platform. They are drafts, not an exam or qualification. Check factual accuracy, one unambiguous answer, answer index, explanation alignment, self-contained wording, UK context, accessible language, and objective alignment. Do not reject a question merely because it is short. Keep reasons under 18 words. Return JSON only: {"decision":"pass"|"rewrite"|"uncertain","items":[{"decision":"pass"|"rewrite"|"uncertain","reason":"short evidence-based reason","proposed":{"prompt":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}}]}. The items array must have exactly ' + practice.length + ' entries in order. Include proposed only for rewrite. Do not copy answer choices into the prompt or invent a source/objective.'
    return [instruction, `Lesson: ${unit.title || lesson.title || ''}`, `Objective(s): ${JSON.stringify(unit.objectives || [])}`, `Approved source: ${JSON.stringify(bundle.source || {})}`, `Practice JSON: ${JSON.stringify(practice)}`].join('\n\n')
}

async function requestReview(bundle, origin, model) {
    const body = {
        model,
        input: reviewPrompt(bundle),
        system_prompt: 'You are a meticulous educational content reviewer. Return JSON only. Reasoning is disabled.',
        temperature: 0.1,
        reasoning: 'off',
        max_output_tokens: 700,
        store: false,
    }
    let lastError
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const response = await fetch(`${origin.replace(/\/$/, '')}/api/v1/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(90000) })
            if (!response.ok) throw new Error(`LM Studio ${response.status}: ${await response.text()}`)
            const review = validateReview(parseJson(responseContent(await response.json())), bundle.lesson.practice.length)
            return { ok: true, review }
        } catch (error) {
            lastError = error
        }
    }
    return { ok: false, error: lastError?.message || 'model review failed' }
}

async function main(argv = process.argv.slice(2)) {
    const options = args(argv)
    const dir = options.dir && options.dir !== true ? String(options.dir) : path.resolve('exports/drafts')
    const outPath = options.out && options.out !== true ? String(options.out) : path.resolve(`content-specs/draft-model-review-${new Date().toISOString().slice(0, 10)}.json`)
    const origin = options.url && options.url !== true ? String(options.url) : (process.env.LLM_API_URL || DEFAULT_ORIGIN)
    const model = options.model && options.model !== true ? String(options.model) : (process.env.LLM_MODEL || DEFAULT_MODEL)
    const limit = options.limit && options.limit !== true ? Number(options.limit) : Infinity
    const concurrency = options.concurrency && options.concurrency !== true ? Math.max(1, Number(options.concurrency)) : 4
    const offset = options.offset && options.offset !== true ? Math.max(0, Number(options.offset)) : 0
    const files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort().slice(offset, offset + limit)
    const results = []
    let cursor = 0
    async function worker() {
        while (cursor < files.length) {
            const index = cursor++
            const file = files[index]
            try {
                const bundle = JSON.parse(await readFile(path.join(dir, file), 'utf8'))
                const review = await requestReview(bundle, origin, model)
                results[index] = { file, unitId: bundle.unit?.id || null, existingEditorialReview: bundle.editorialReview?.outcome || null, ...review }
                process.stderr.write(`Reviewed ${index + 1}/${files.length}: ${file}\n`)
            } catch (error) {
                results[index] = { file, ok: false, error: error.message }
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, () => worker()))
    const report = {
        generatedAt: new Date().toISOString(),
        scope: 'local generated draft bundles',
        model: { origin, model, reasoning: 'off' },
        publicationSafety: 'review report only; no draft files or publication fields were changed',
        totals: {
            bundles: results.length,
            reviewed: results.filter((item) => item.ok).length,
            failed: results.filter((item) => !item.ok).length,
            pass: results.filter((item) => item.ok && item.review.decision === 'pass').length,
            rewrite: results.filter((item) => item.ok && item.review.decision === 'rewrite').length,
            uncertain: results.filter((item) => item.ok && item.review.decision === 'uncertain').length,
            itemRewrites: results.filter((item) => item.ok).reduce((sum, item) => sum + item.review.items.filter((review) => review.decision === 'rewrite').length, 0),
        },
        results,
    }
    await writeFile(outPath, JSON.stringify(report, null, 2))
    console.log(JSON.stringify({ outPath, ...report.totals }, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => { console.error(error); process.exitCode = 1 })
}

export { reviewPrompt, validateReview }
