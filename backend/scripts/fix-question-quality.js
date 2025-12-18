/**
 * Fix mechanical question consistency issues (safe, automated).
 *
 * What it fixes:
 * - MCQ/True-False: canonicalize answer to exact option text (also resolves numeric indices)
 * - MCQ/True-False: fixes answers that contradict explanation when the explanation ends with an option
 * - MCQ/True-False: fixes answers not matching options due to unicode/quote/whitespace mismatch
 * - MCQ/True-False: removes exact duplicate options (keeps first occurrence)
 * - Optional: align question level to topic level
 *
 * Usage:
 *   node scripts/fix-question-quality.js --apply
 *   node scripts/fix-question-quality.js --apply --max-level=L2
 *   node scripts/fix-question-quality.js --apply --align-levels
 *   node scripts/fix-question-quality.js --apply --align-levels
 *   node scripts/fix-question-quality.js --apply --align-levels --ignore-explanation
 */

import { PrismaClient } from '@prisma/client'
import {
    canonicalizeMcqAnswer,
    dedupeExactOptions,
    normalizeTextLoose,
    safeJsonParse,
} from './questionQualityUtils.js'

const prisma = new PrismaClient()

function parseArgs(argv) {
    const args = new Map()
    for (const part of argv.slice(2)) {
        const [k, v] = part.split('=')
        args.set(k, v ?? true)
    }
    return args
}

function levelAllowed(maxLevel, code) {
    const order = { E1: 1, E2: 2, E3: 3, L1: 4, L2: 5, L3: 6, L4: 7, L5: 8, L6: 9, L7: 10, L8: 11 }
    if (!maxLevel) return true
    if (!code) return false
    return (order[code] ?? 999) <= (order[maxLevel] ?? 999)
}

async function main() {
    const args = parseArgs(process.argv)
    const apply = args.has('--apply')
    const alignLevels = args.has('--align-levels')
    const ignoreExplanation = args.has('--ignore-explanation')
    const maxLevel = args.get('--max-level') === true ? null : (args.get('--max-level') ?? null)

    const questions = await prisma.question.findMany({
        include: {
            ukLevel: { select: { code: true } },
            topic: {
                include: {
                    ukLevel: { select: { id: true, code: true } },
                },
            },
        },
    })

    const counters = {
        scanned: 0,
        updated: 0,
        updatedAnswer: 0,
        updatedOptions: 0,
        updatedLevel: 0,
        skippedInvalidOptions: 0,
        skippedInvalidAnswer: 0,
        wouldUpdate: 0,
    }

    for (const q of questions) {
        const levelCode = q.ukLevel?.code ?? null
        const topicLevel = q.topic?.ukLevel?.code ?? null
        const intendedLevel = topicLevel || levelCode
        if (maxLevel && !levelAllowed(maxLevel, intendedLevel)) continue
        counters.scanned++

        const updates = {}

        if (alignLevels && q.topic?.ukLevel?.id) {
            if (q.ukLevelId !== q.topic.ukLevel.id) {
                updates.ukLevelId = q.topic.ukLevel.id
            }
        }

        if (q.type === 'mcq' || q.type === 'true_false') {
            const canonical = canonicalizeMcqAnswer({
                options: q.options,
                answerRaw: q.answer,
                explanation: q.explanation,
            })

            if (!canonical.ok) {
                if (canonical.reason === 'options_invalid_json' || canonical.reason === 'options_invalid_or_too_short') {
                    counters.skippedInvalidOptions++
                } else if (canonical.reason === 'answer_invalid_json') {
                    counters.skippedInvalidAnswer++
                }
                continue
            }

            const options = JSON.parse(q.options || '[]')
            const deduped = dedupeExactOptions(options)
            if (deduped.length !== options.length) {
                updates.options = JSON.stringify(deduped)
            }

            // Ensure answer is stored as a JSON string containing the option text exactly.
            let answerTarget = canonical.answer
            if (ignoreExplanation && canonical.reason === 'explanation_contradiction' && canonical.stored) {
                answerTarget = canonical.stored
            }
            const answerJson = JSON.stringify(answerTarget)
            if (q.answer !== answerJson) {
                updates.answer = answerJson
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
            data: updates,
        })

        counters.updated++
        if (Object.prototype.hasOwnProperty.call(updates, 'answer')) counters.updatedAnswer++
        if (Object.prototype.hasOwnProperty.call(updates, 'options')) counters.updatedOptions++
        if (Object.prototype.hasOwnProperty.call(updates, 'ukLevelId')) counters.updatedLevel++

        if (counters.updated % 200 === 0) process.stdout.write('.')
    }

    process.stdout.write('\n')
    console.log(JSON.stringify(counters, null, 2))

    if (apply && counters.updatedOptions > 0) {
        // Re-check that answers still match options after dedupe.
        const check = await prisma.question.findMany({
            where: { type: { in: ['mcq', 'true_false'] } },
            select: { id: true, options: true, answer: true },
        })
        const mismatches = []
        for (const q of check) {
            let options = []
            try {
                options = JSON.parse(q.options || '[]')
            } catch {
                continue
            }
            const parsed = safeJsonParse(q.answer)
            if (!parsed.ok) continue
            const answerValue = parsed.value

            let found = false
            if (Number.isInteger(answerValue)) {
                found = answerValue >= 0 && answerValue < options.length
            } else {
                found = options.some((o) => normalizeTextLoose(o) === normalizeTextLoose(String(answerValue ?? '')))
            }
            if (!found) mismatches.push(q.id)
        }
        if (mismatches.length > 0) {
            console.warn(`⚠️  Post-fix: ${mismatches.length} MCQ/TF answers still do not match options.`)
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
