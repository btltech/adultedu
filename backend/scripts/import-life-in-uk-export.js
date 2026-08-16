#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import { canonicalizeMcqAnswer, normalizeTextStrict } from './questionQualityUtils.js'

// Resolved from this file so the script works from any checkout, not just the
// machine it was written on.
const DEFAULT_EXPORT_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../exports/life-in-uk-questions-final.json'
)

const prisma = new PrismaClient()

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        if (!part.startsWith('--')) continue
        const [key, value] = part.split('=')
        args.set(key, value ?? true)
    }
    return args
}

function clampInt(value, min, max, fallback) {
    const parsed = Number.parseInt(String(value), 10)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
}

function resolveDifficulty(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return clampInt(value, 1, 5, 3)
    }

    const mapped = {
        easy: 2,
        medium: 3,
        hard: 4,
    }

    return mapped[String(value || '').toLowerCase()] || 3
}

function loadQuestions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) {
        throw new Error('Question export must be a JSON array')
    }
    return parsed
}

function canonicalizeExportRow(row) {
    const prompt = String(row?.prompt || '').trim()
    const explanation = String(row?.explanation || '').trim()
    const options = Array.isArray(row?.options)
        ? row.options.map((option) => String(option || '').trim()).filter(Boolean)
        : null

    if (!prompt || !explanation || !options || options.length !== 4) {
        return { ok: false, reason: 'invalid_shape' }
    }

    const resolved = canonicalizeMcqAnswer({
        options: JSON.stringify(options),
        answerRaw: JSON.stringify(row?.answer),
        explanation,
    })

    if (!resolved.ok) {
        return { ok: false, reason: resolved.reason }
    }

    const answerIndex = options.findIndex((option) => normalizeTextStrict(option) === normalizeTextStrict(resolved.answer))
    if (answerIndex === -1) {
        return { ok: false, reason: 'resolved_answer_missing_from_options' }
    }

    return {
        ok: true,
        value: {
            prompt,
            explanation,
            options,
            answer: String(answerIndex),
            difficulty: resolveDifficulty(row?.difficulty),
            topicId: String(row?.topicId || '').trim(),
        },
    }
}

async function main() {
    const args = parseArgs(process.argv)
    const apply = args.get('--apply') === true
    const trackSlug = String(args.get('--track-slug') || 'life-in-the-uk-test')
    const targetPerTopic = clampInt(args.get('--target') || '100', 1, 500, 100)
    const exportPath = args.get('--file')
        ? path.resolve(String(args.get('--file')))
        : DEFAULT_EXPORT_PATH

    console.log(`📥 export: ${exportPath}`)
    console.log(`🎯 track:  ${trackSlug}`)
    console.log(`🎯 target: ${targetPerTopic} per topic`)
    console.log(`✍️  apply:  ${apply}\n`)

    const sourceRows = loadQuestions(exportPath)

    const topics = await prisma.topic.findMany({
        where: { track: { slug: trackSlug } },
        select: {
            id: true,
            title: true,
            ukLevelId: true,
            sortOrder: true,
            _count: {
                select: {
                    questions: {
                        where: { isPublished: true },
                    },
                },
            },
            questions: {
                select: { prompt: true },
            },
        },
        orderBy: { sortOrder: 'asc' },
    })

    if (!topics.length) {
        throw new Error(`No topics found for track ${trackSlug}`)
    }

    const rowsByTopic = new Map()
    for (const row of sourceRows) {
        const topicId = String(row?.topicId || '').trim()
        if (!topicId) continue
        const bucket = rowsByTopic.get(topicId) || []
        bucket.push(row)
        rowsByTopic.set(topicId, bucket)
    }

    let totalPrepared = 0
    let totalCreated = 0

    for (const topic of topics) {
        const publishedCount = topic._count.questions
        const need = Math.max(0, targetPerTopic - publishedCount)
        const source = rowsByTopic.get(topic.id) || []
        const existingPrompts = new Set(topic.questions.map((question) => normalizeTextStrict(question.prompt)))
        const batchPromptSet = new Set()
        const prepared = []
        let invalid = 0
        let duplicate = 0

        if (need === 0) {
            console.log(`✅ ${topic.title}: already at ${publishedCount}/${targetPerTopic}`)
            continue
        }

        for (const row of source) {
            if (prepared.length >= need) break

            const normalized = canonicalizeExportRow(row)
            if (!normalized.ok) {
                invalid++
                continue
            }

            const promptKey = normalizeTextStrict(normalized.value.prompt)
            if (existingPrompts.has(promptKey) || batchPromptSet.has(promptKey)) {
                duplicate++
                continue
            }

            batchPromptSet.add(promptKey)
            prepared.push({
                topicId: topic.id,
                ukLevelId: topic.ukLevelId,
                type: 'mcq',
                prompt: normalized.value.prompt,
                options: JSON.stringify(normalized.value.options),
                answer: normalized.value.answer,
                explanation: normalized.value.explanation,
                difficulty: normalized.value.difficulty,
                isPublished: true,
            })
        }

        totalPrepared += prepared.length

        console.log(`• ${topic.title}: live=${publishedCount}, need=${need}, export=${source.length}, prepared=${prepared.length}, dupes=${duplicate}, invalid=${invalid}`)

        if (!apply || prepared.length === 0) continue

        const created = await prisma.question.createMany({ data: prepared })
        totalCreated += created.count
    }

    console.log(`\n📊 prepared=${totalPrepared}`)
    if (apply) {
        console.log(`✅ created=${totalCreated}`)
    } else {
        console.log('Dry run only. Add --apply to write to the database.')
    }
}

main()
    .catch((error) => {
        console.error(`❌ ${error.message}`)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })