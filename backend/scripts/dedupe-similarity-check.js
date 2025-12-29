#!/usr/bin/env node
/**
 * Dedupe + similarity audit for questions.
 *
 * - Exact dedupe: unpublish exact duplicate prompts (scope: topic|track|global)
 * - Similarity audit: flag (and optionally unpublish) near-duplicate prompts within each topic using embeddings
 *
 * Defaults to dry-run (no writes). Use `--apply` to unpublish.
 *
 * Examples:
 *   # SQLite dev.db (dry run)
 *   LLM_API_URL="http://192.168.1.51:1234" EMBEDDINGS_MODEL="text-embedding-nomic-embed-text-v1.5" \
 *     node scripts/dedupe-similarity-check.js --db=sqlite --scope=track --similarity=0.985
 *
 *   # SQLite dev.db (apply exact + semantic dedupe)
 *   LLM_API_URL="http://192.168.1.51:1234" EMBEDDINGS_MODEL="text-embedding-nomic-embed-text-v1.5" \
 *     node scripts/dedupe-similarity-check.js --db=sqlite --scope=track --similarity=0.985 --apply --apply-semantic
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient as PostgresClient } from '@prisma/client'
import { PrismaClient as SqliteClient } from '../generated/sqlite-client/index.js'

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
    return String(input ?? '')
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
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
    rows.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    return rows.map((r) => r.embedding)
}

function getDefaultSqliteUrl() {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url))
    const backendDir = path.resolve(scriptDir, '..')
    const dbPath = path.join(backendDir, 'prisma', 'dev.db')
    return `file:${dbPath}`
}

function safeJsonParse(input) {
    if (!input) return null
    try {
        return JSON.parse(input)
    } catch {
        return null
    }
}

function normalizeAnswerText(input) {
    return String(input ?? '')
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
}

function getCorrectAnswerText(question) {
    const type = String(question?.type || '')
    if (type === 'multi_step') return null

    if (type === 'short_answer') {
        const a = normalizeAnswerText(question?.answer)
        return a || null
    }

    const parsedAnswer = safeJsonParse(question?.answer)
    if (typeof parsedAnswer === 'boolean') return String(parsedAnswer).toLowerCase()

    let idx = null
    if (typeof parsedAnswer === 'number' && Number.isInteger(parsedAnswer)) idx = parsedAnswer
    if (typeof parsedAnswer === 'string' && /^\d+$/.test(parsedAnswer.trim())) idx = Number.parseInt(parsedAnswer.trim(), 10)
    if (idx === null && typeof question?.answer === 'string' && /^\d+$/.test(question.answer.trim())) {
        idx = Number.parseInt(question.answer.trim(), 10)
    }

    if (idx === null) {
        // Some legacy rows store the correct answer as a string (or JSON string).
        const asText = typeof parsedAnswer === 'string' ? parsedAnswer : question?.answer
        const a = normalizeAnswerText(asText)
        return a || null
    }

    const options = safeJsonParse(question?.options)
    if (!Array.isArray(options) || idx < 0 || idx >= options.length) return `idx:${idx}`

    const correct = normalizeAnswerText(options[idx])
    return correct || `idx:${idx}`
}

function getAnswerSignature(question) {
    const type = String(question?.type || '')
    const correct = getCorrectAnswerText(question)
    if (!type || !correct) return null
    return `${type}::${correct}`
}

function buildMetaPatch(existing, patch) {
    const base = safeJsonParse(existing) ?? {}
    return JSON.stringify({ ...base, ...patch })
}

async function main() {
    const args = parseArgs(process.argv)

    const apply = args.get('--apply') === true
    const applySemantic = args.get('--apply-semantic') === true
    const db = String(args.get('--db') || 'sqlite') // sqlite | postgres
    const scope = String(args.get('--scope') || 'track') // topic | track | global
    const similarity = clampFloat(args.get('--similarity') ?? '0.985', 0.5, 0.999, 0.985)
    const maxTopics = args.get('--max-topics') ? clampInt(args.get('--max-topics'), 1, 10_000, 50) : null

    const v1Url = normalizeV1Url(process.env.LLM_API_URL || 'http://127.0.0.1:1234/v1')
    const embedModel = process.env.EMBEDDINGS_MODEL || 'text-embedding-nomic-embed-text-v1.5'

    if (db === 'sqlite') {
        process.env.SQLITE_DATABASE_URL = process.env.SQLITE_DATABASE_URL || getDefaultSqliteUrl()
    }

    if (!['sqlite', 'postgres'].includes(db)) throw new Error(`Invalid --db: ${db}`)
    if (!['topic', 'track', 'global'].includes(scope)) throw new Error(`Invalid --scope: ${scope}`)

    console.log(`🗄️  db: ${db}`)
    if (db === 'sqlite') console.log(`🧱 SQLITE_DATABASE_URL: ${process.env.SQLITE_DATABASE_URL}`)
    console.log(`🔌 LLM_API_URL: ${v1Url}`)
    console.log(`🧬 EMBEDDINGS_MODEL: ${embedModel}`)
    console.log(`🧹 scope=${scope} similarity=${similarity} apply=${apply} applySemantic=${applySemantic}\n`)

    const prisma = db === 'sqlite' ? new SqliteClient() : new PostgresClient()

    const report = {
        apply,
        applySemantic,
        db,
        scope,
        similarity,
        exact: {
            scannedPublished: 0,
            duplicateGroups: 0,
            wouldUnpublish: 0,
            unpublished: 0,
            samples: [],
        },
        semantic: {
            topicsScanned: 0,
            pairsAboveThreshold: 0,
            topicsWithPairs: 0,
            wouldUnpublish: 0,
            unpublished: 0,
            samples: [],
            errors: [],
        },
    }

    try {
        const topics = await prisma.topic.findMany({
            select: {
                id: true,
                title: true,
                trackId: true,
                track: { select: { slug: true, title: true } },
                ukLevel: { select: { code: true } },
            },
            orderBy: [{ track: { title: 'asc' } }, { sortOrder: 'asc' }],
        })

        const topicById = new Map(topics.map((t) => [t.id, t]))

        const questions = await prisma.question.findMany({
            where: { isPublished: true },
            select: {
                id: true,
                topicId: true,
                type: true,
                prompt: true,
                options: true,
                answer: true,
                createdAt: true,
                isPublished: true,
                sourceMeta: true,
            },
            orderBy: { createdAt: 'asc' },
        })
        report.exact.scannedPublished = questions.length
        const questionById = new Map(questions.map((q) => [q.id, q]))

        const groupKey = (q) => {
            const norm = normalizePrompt(q.prompt)
            if (!norm) return null
            if (scope === 'topic') return `${q.topicId}::${norm}`
            if (scope === 'global') return `global::${norm}`
            const topic = topicById.get(q.topicId)
            const trackId = topic?.trackId
            if (!trackId) return null
            return `${trackId}::${norm}`
        }

        const groups = new Map()
        for (const q of questions) {
            const key = groupKey(q)
            if (!key) continue
            const arr = groups.get(key) || []
            arr.push(q)
            groups.set(key, arr)
        }

        const dupGroups = [...groups.values()].filter((arr) => arr.length > 1)
        report.exact.duplicateGroups = dupGroups.length

        const exactToUnpublish = new Map() // questionId -> canonicalId

        for (const arr of dupGroups) {
            const sorted = [...arr].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            const canonical = sorted[0]
            const dups = sorted.slice(1)

            if (report.exact.samples.length < 10) {
                const t = topicById.get(canonical.topicId)
                report.exact.samples.push({
                    canonicalId: canonical.id,
                    duplicateIds: dups.map((d) => d.id),
                    prompt: String(canonical.prompt ?? '').slice(0, 160),
                    track: t?.track?.title ?? null,
                    topic: t?.title ?? null,
                })
            }

            for (const q of dups) {
                exactToUnpublish.set(q.id, canonical.id)
            }
        }

        report.exact.wouldUnpublish = exactToUnpublish.size

        if (apply && exactToUnpublish.size > 0) {
            for (const [questionId, canonicalId] of exactToUnpublish.entries()) {
                const metaPatch = buildMetaPatch(
                    questionById.get(questionId)?.sourceMeta,
                    { duplicateOf: canonicalId, dedupe: { type: 'exact', scope } }
                )

                await prisma.question.update({
                    where: { id: questionId },
                    data: { isPublished: false, version: { increment: 1 }, sourceMeta: metaPatch },
                })
                report.exact.unpublished++
            }
        }

        // Semantic similarity audit per-topic (on published questions, excluding exact-to-unpublish).
        const topicIds = topics.map((t) => t.id)
        const limitedTopicIds = maxTopics ? topicIds.slice(0, maxTopics) : topicIds

        const publishedByTopic = new Map()
        for (const q of questions) {
            if (exactToUnpublish.has(q.id)) continue
            const arr = publishedByTopic.get(q.topicId) || []
            arr.push(q)
            publishedByTopic.set(q.topicId, arr)
        }

        for (const topicId of limitedTopicIds) {
            const qs = (publishedByTopic.get(topicId) || []).filter((q) => normalizePrompt(q.prompt))
            if (qs.length < 2) continue

            report.semantic.topicsScanned++

            const sigById = new Map()
            for (const q of qs) {
                sigById.set(q.id, getAnswerSignature(q))
            }

            const prompts = qs.map((q) => q.prompt)

            let embeddings
            try {
                embeddings = await embedTexts({ v1Url, model: embedModel, inputs: prompts })
            } catch (e) {
                report.semantic.errors.push({ topicId, error: e.message })
                continue
            }

            const vecs = embeddings.map((vec) => ({ vec, norm: computeNorm(vec) }))
            const pairs = []
            const eligiblePairs = []

            for (let i = 0; i < qs.length; i++) {
                for (let j = i + 1; j < qs.length; j++) {
                    const sim = cosineSim(vecs[i].vec, vecs[j].vec, vecs[i].norm, vecs[j].norm)
                    if (sim >= similarity) {
                        const a = qs[i]
                        const b = qs[j]
                        pairs.push({ a, b, sim })

                        const sigA = sigById.get(a.id)
                        const sigB = sigById.get(b.id)
                        if (sigA && sigB && sigA === sigB) {
                            eligiblePairs.push({ a, b, sim })
                        }
                    }
                }
            }

            if (pairs.length === 0) continue

            report.semantic.topicsWithPairs++
            report.semantic.pairsAboveThreshold += pairs.length
            report.semantic.wouldUnpublish += new Set(
                (() => {
                    eligiblePairs.sort((x, y) => y.sim - x.sim)
                    const removed = new Set()
                    for (const p of eligiblePairs) {
                        if (removed.has(p.a.id) || removed.has(p.b.id)) continue
                        const aTime = new Date(p.a.createdAt).getTime()
                        const bTime = new Date(p.b.createdAt).getTime()
                        const keep = aTime <= bTime ? p.a : p.b
                        const drop = keep.id === p.a.id ? p.b : p.a
                        removed.add(drop.id)
                    }
                    return removed
                })()
            ).size

            if (report.semantic.samples.length < 10) {
                const t = topicById.get(topicId)
                const sample = pairs
                    .sort((x, y) => y.sim - x.sim)
                    .slice(0, 2)
                    .map((p) => ({
                        sim: Number(p.sim.toFixed(4)),
                        aId: p.a.id,
                        bId: p.b.id,
                        aPrompt: String(p.a.prompt ?? '').slice(0, 120),
                        bPrompt: String(p.b.prompt ?? '').slice(0, 120),
                    }))

                report.semantic.samples.push({
                    topicId,
                    track: t?.track?.title ?? null,
                    topic: t?.title ?? null,
                    ukLevel: t?.ukLevel?.code ?? null,
                    samples: sample,
                })
            }

            // Optional semantic unpublish (very conservative; requires --apply-semantic).
            if (!(apply && applySemantic)) continue

            // Greedy (eligible pairs only): sort by similarity desc; unpublish the newer one.
            eligiblePairs.sort((x, y) => y.sim - x.sim)
            const removed = new Set()

            for (const p of eligiblePairs) {
                if (removed.has(p.a.id) || removed.has(p.b.id)) continue

                const aTime = new Date(p.a.createdAt).getTime()
                const bTime = new Date(p.b.createdAt).getTime()
                const keep = aTime <= bTime ? p.a : p.b
                const drop = keep.id === p.a.id ? p.b : p.a

                removed.add(drop.id)

                const metaPatch = buildMetaPatch(drop.sourceMeta, {
                    duplicateOf: keep.id,
                    dedupe: { type: 'semantic', scope: 'topic', similarity: Number(p.sim.toFixed(6)), threshold: similarity },
                })

                await prisma.question.update({
                    where: { id: drop.id },
                    data: { isPublished: false, version: { increment: 1 }, sourceMeta: metaPatch },
                })
                report.semantic.unpublished++
            }
        }

        console.log(JSON.stringify(report, null, 2))
    } finally {
        await prisma.$disconnect()
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
