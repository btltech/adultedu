/**
 * Normalize option-based questions (mcq/true_false/scenario) so answers are:
 * - always valid JSON
 * - stored as a 0-based integer index into the options array where possible
 *
 * Safe by default (dry-run). Use --apply to write changes.
 *
 * Usage:
 *   node scripts/normalize-option-answers.js
 *   node scripts/normalize-option-answers.js --apply
 *   node scripts/normalize-option-answers.js --apply --category=workplace
 *   node scripts/normalize-option-answers.js --apply --unpublish-unresolved
 */

import { PrismaClient } from '@prisma/client'
import {
    extractAnswerCandidateFromExplanation,
    findOptionMatch,
    normalizeTextStrict,
    safeJsonParse,
} from './questionQualityUtils.js'

const prisma = new PrismaClient()

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
    if (Number.isNaN(n)) return fallback
    return Math.min(max, Math.max(min, n))
}

function findIndexByLooseMatch(options, target) {
    const targetNorm = normalizeTextStrict(target)
    if (!targetNorm) return null
    const idx = options.findIndex((o) => normalizeTextStrict(o) === targetNorm)
    return idx >= 0 ? idx : null
}

function resolveIndexFromAnswerValue({ type, options, answerValue }) {
    // 1) Integer index
    if (Number.isInteger(answerValue)) {
        const idx = answerValue
        if (idx >= 0 && idx < options.length) return { ok: true, index: idx, source: 'answer:index' }

        // If out of range, treat as literal and try to match to an option
        const asText = findOptionMatch(options, String(answerValue))
        if (asText !== null) {
            const matchIdx = findIndexByLooseMatch(options, asText)
            if (matchIdx !== null) return { ok: true, index: matchIdx, source: 'answer:literal-number' }
        }
        return { ok: false, reason: 'integer_out_of_range' }
    }

    // 2) Boolean (mostly true_false)
    if (typeof answerValue === 'boolean') {
        const expected = answerValue ? 'True' : 'False'
        const asText = findOptionMatch(options, expected) ?? findOptionMatch(options, expected.toLowerCase())
        if (asText !== null) {
            const matchIdx = findIndexByLooseMatch(options, asText)
            if (matchIdx !== null) return { ok: true, index: matchIdx, source: 'answer:boolean' }
        }

        // If the options aren't obviously TF, we can't reliably map.
        if (type === 'true_false' && options.length === 2) {
            return { ok: true, index: answerValue ? 0 : 1, source: 'answer:boolean:assume-order' }
        }
        return { ok: false, reason: 'boolean_no_match' }
    }

    // 3) String: try literal option match first, then numeric index, then stripped quotes
    if (typeof answerValue === 'string') {
        const trimmed = answerValue.trim()

        const literal = findOptionMatch(options, trimmed)
        if (literal !== null) {
            const matchIdx = findIndexByLooseMatch(options, literal)
            if (matchIdx !== null) return { ok: true, index: matchIdx, source: 'answer:literal' }
        }

        // numeric string -> index
        if (/^\d+$/.test(trimmed)) {
            const idx = parseInt(trimmed, 10)
            if (idx >= 0 && idx < options.length) return { ok: true, index: idx, source: 'answer:numeric-string-index' }
        }

        // true/false strings
        if (type === 'true_false') {
            const tf = trimmed.toLowerCase()
            if (tf === 'true' || tf === 'false') {
                const expected = tf === 'true' ? 'True' : 'False'
                const asText = findOptionMatch(options, expected) ?? findOptionMatch(options, expected.toLowerCase())
                if (asText !== null) {
                    const matchIdx = findIndexByLooseMatch(options, asText)
                    if (matchIdx !== null) return { ok: true, index: matchIdx, source: 'answer:tf-string' }
                }
                if (options.length === 2) {
                    return { ok: true, index: tf === 'true' ? 0 : 1, source: 'answer:tf-string:assume-order' }
                }
            }
        }

        const stripped = trimmed.replace(/^["']|["']$/g, '').trim()
        if (stripped && stripped !== trimmed) {
            const strippedLiteral = findOptionMatch(options, stripped)
            if (strippedLiteral !== null) {
                const matchIdx = findIndexByLooseMatch(options, strippedLiteral)
                if (matchIdx !== null) return { ok: true, index: matchIdx, source: 'answer:stripped' }
            }
            if (/^\d+$/.test(stripped)) {
                const idx = parseInt(stripped, 10)
                if (idx >= 0 && idx < options.length) return { ok: true, index: idx, source: 'answer:stripped-numeric-index' }
            }
        }
    }

    // 4) Number (float) -> match to option text
    if (typeof answerValue === 'number') {
        const asText = findOptionMatch(options, String(answerValue))
        if (asText !== null) {
            const matchIdx = findIndexByLooseMatch(options, asText)
            if (matchIdx !== null) return { ok: true, index: matchIdx, source: 'answer:literal-number-float' }
        }
    }

    return { ok: false, reason: 'no_match' }
}

function resolveIndex({ type, options, answerRaw, explanation }) {
    const parsedAnswer = safeJsonParse(answerRaw)
    const answerValue = parsedAnswer.ok ? parsedAnswer.value : answerRaw

    const storedResolved = resolveIndexFromAnswerValue({ type, options, answerValue })

    // Explanation-derived candidate (used to resolve missing/contradicting answers)
    const fromExplanation = extractAnswerCandidateFromExplanation(explanation)
    const candidate = fromExplanation?.candidate ?? null
    const explanationSource = fromExplanation?.source ?? null
    const explanationMatch = candidate ? findOptionMatch(options, candidate) : null
    const explanationIndex = explanationMatch !== null ? findIndexByLooseMatch(options, explanationMatch) : null

    if (storedResolved.ok && explanationIndex !== null && explanationSource === 'phrase') {
        const storedText = options[storedResolved.index]
        const explanationText = options[explanationIndex]
        if (normalizeTextStrict(storedText) !== normalizeTextStrict(explanationText)) {
            return { ok: true, index: explanationIndex, reason: 'explanation_contradiction', source: 'explanation:phrase' }
        }
    }

    if (storedResolved.ok) return { ok: true, index: storedResolved.index, source: storedResolved.source }
    if (explanationIndex !== null) return { ok: true, index: explanationIndex, source: 'explanation:fallback' }

    return { ok: false, reason: storedResolved.reason ?? 'unresolved' }
}

async function main() {
    const args = parseArgs(process.argv)

    const apply = args.get('--apply') === true
    const category = args.get('--category') === true ? null : (args.get('--category') ?? null)
    const limit = args.get('--limit') ? clampInt(args.get('--limit'), 1, 1_000_000, 10_000) : null
    const unpublishUnresolved = args.get('--unpublish-unresolved') === true

    const where = {
        type: { in: ['mcq', 'true_false', 'scenario'] },
        options: { not: null },
        ...(category ? { topic: { track: { category } } } : {}),
    }

    const questions = await prisma.question.findMany({
        where,
        select: {
            id: true,
            type: true,
            options: true,
            answer: true,
            explanation: true,
            isPublished: true,
            sourceMeta: true,
            topic: { select: { track: { select: { category: true, slug: true } } } },
        },
        orderBy: { createdAt: 'asc' },
    })

    const counters = {
        scanned: 0,
        limited: limit ? Math.min(limit, questions.length) : questions.length,
        wouldUpdate: 0,
        updated: 0,
        updatedAnswer: 0,
        updatedSourceMeta: 0,
        unpublished: 0,
        skippedInvalidOptionsJson: 0,
        unresolved: 0,
        byReason: {},
    }

    for (const q of questions) {
        if (limit && counters.scanned >= limit) break
        counters.scanned++

        let options
        try {
            options = JSON.parse(q.options || '[]')
        } catch {
            counters.skippedInvalidOptionsJson++
            continue
        }
        if (!Array.isArray(options) || options.length < 2) {
            counters.skippedInvalidOptionsJson++
            continue
        }

        const resolved = resolveIndex({
            type: q.type,
            options: options.map((o) => String(o)),
            answerRaw: q.answer,
            explanation: q.explanation,
        })

        const updates = {}

        if (resolved.ok) {
            const newAnswer = JSON.stringify(resolved.index)
            if (q.answer !== newAnswer) {
                updates.answer = newAnswer
            }
        } else {
            counters.unresolved++
            const reason = resolved.reason || 'unresolved'
            counters.byReason[reason] = (counters.byReason[reason] || 0) + 1

            // Even if we can't resolve to an index, make answer valid JSON for consistency.
            const parsed = safeJsonParse(q.answer)
            if (!parsed.ok) {
                const fixed = JSON.stringify(String(q.answer ?? '').trim())
                if (q.answer !== fixed) updates.answer = fixed
            }

            if (unpublishUnresolved && q.isPublished) {
                updates.isPublished = false
            }

            // Record a small note in sourceMeta for admin triage.
            try {
                const meta = q.sourceMeta ? JSON.parse(q.sourceMeta) : {}
                meta.normalizationIssues = Array.isArray(meta.normalizationIssues) ? meta.normalizationIssues : []
                const note = `unresolved_answer:${reason}`
                if (!meta.normalizationIssues.includes(note)) meta.normalizationIssues.push(note)
                updates.sourceMeta = JSON.stringify(meta)
            } catch {
                updates.sourceMeta = JSON.stringify({ normalizationIssues: [`unresolved_answer:${reason}`] })
            }
        }

        const keys = Object.keys(updates)
        if (keys.length === 0) continue

        if (!apply) {
            counters.wouldUpdate++
            continue
        }

        await prisma.question.update({
            where: { id: q.id },
            data: {
                ...updates,
                version: { increment: 1 },
            },
        })

        counters.updated++
        if (Object.prototype.hasOwnProperty.call(updates, 'answer')) counters.updatedAnswer++
        if (Object.prototype.hasOwnProperty.call(updates, 'sourceMeta')) counters.updatedSourceMeta++
        if (updates.isPublished === false) counters.unpublished++

        if (counters.updated % 500 === 0) process.stdout.write('.')
    }

    process.stdout.write('\n')
    console.log(JSON.stringify({ apply, category, limit, unpublishUnresolved, ...counters }, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
