/**
 * Audit question quality/consistency in the current DB.
 *
 * Usage:
 *   node scripts/audit-question-quality.js
 *   node scripts/audit-question-quality.js --max-level=L2
 */

import { PrismaClient } from '@prisma/client'
import {
    canonicalizeMcqAnswer,
    dedupeExactOptions,
    normalizeTextLoose,
    safeJsonParse,
    stableReportId,
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
    const maxLevel = args.get('--max-level') === true ? null : (args.get('--max-level') ?? null)
    const reportId = stableReportId('question-quality')

    const questions = await prisma.question.findMany({
        include: {
            ukLevel: { select: { code: true } },
            topic: {
                include: {
                    ukLevel: { select: { code: true } },
                    track: { select: { slug: true } },
                },
            },
        },
    })

    const stats = {
        reportId,
        total: questions.length,
        filtered: 0,
        byLevel: {},
        byType: {},
        issues: {
            answerNotInOptions: 0,
            answerMismatchExplanation: 0,
            invalidAnswerJson: 0,
            invalidOptionsJson: 0,
            duplicateOptionsExact: 0,
            topicQuestionLevelMismatch: 0,
        },
        samples: {
            answerMismatchExplanation: [],
            answerNotInOptions: [],
            duplicateOptionsExact: [],
            topicQuestionLevelMismatch: [],
        },
    }

    for (const q of questions) {
        const levelCode = q.ukLevel?.code ?? null
        const topicLevel = q.topic?.ukLevel?.code ?? null
        const intendedLevel = topicLevel || levelCode
        if (maxLevel && !levelAllowed(maxLevel, intendedLevel)) continue
        stats.filtered++

        stats.byLevel[levelCode ?? 'UNKNOWN'] = (stats.byLevel[levelCode ?? 'UNKNOWN'] || 0) + 1
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1

        if (topicLevel && levelCode && topicLevel !== levelCode) {
            stats.issues.topicQuestionLevelMismatch++
            if (stats.samples.topicQuestionLevelMismatch.length < 10) {
                stats.samples.topicQuestionLevelMismatch.push({
                    id: q.id,
                    track: q.topic?.track?.slug ?? null,
                    topicLevel,
                    questionLevel: levelCode,
                    prompt: (q.prompt ?? '').slice(0, 140),
                })
            }
        }

        if (q.type !== 'mcq' && q.type !== 'true_false') continue

        const canonical = canonicalizeMcqAnswer({
            options: q.options,
            answerRaw: q.answer,
            explanation: q.explanation,
        })

        if (!canonical.ok) {
            if (canonical.reason === 'answer_invalid_json') stats.issues.invalidAnswerJson++
            if (canonical.reason === 'options_invalid_json') stats.issues.invalidOptionsJson++
            continue
        }

        const options = JSON.parse(q.options || '[]')
        const deduped = dedupeExactOptions(options)
        if (deduped.length !== options.length) {
            stats.issues.duplicateOptionsExact++
            if (stats.samples.duplicateOptionsExact.length < 10) {
                stats.samples.duplicateOptionsExact.push({
                    id: q.id,
                    track: q.topic?.track?.slug ?? null,
                    prompt: (q.prompt ?? '').slice(0, 140),
                })
            }
        }

        // Check whether the stored answer is interpretable against the options.
        const parsed = safeJsonParse(q.answer)
        if (!parsed.ok) {
            stats.issues.invalidAnswerJson++
            continue
        }
        const storedValue = parsed.value
        let matches = false
        if (Number.isInteger(storedValue)) {
            matches = storedValue >= 0 && storedValue < options.length
        } else {
            const storedText = String(storedValue ?? '')
            matches = options.some((o) => normalizeTextLoose(o) === normalizeTextLoose(storedText))
        }
        if (!matches) {
            stats.issues.answerNotInOptions++
            if (stats.samples.answerNotInOptions.length < 10) {
                stats.samples.answerNotInOptions.push({
                    id: q.id,
                    track: q.topic?.track?.slug ?? null,
                    prompt: (q.prompt ?? '').slice(0, 140),
                })
            }
        }

        if (canonical.reason === 'explanation_contradiction') {
            stats.issues.answerMismatchExplanation++
            if (stats.samples.answerMismatchExplanation.length < 10) {
                stats.samples.answerMismatchExplanation.push({
                    id: q.id,
                    track: q.topic?.track?.slug ?? null,
                    prompt: (q.prompt ?? '').slice(0, 140),
                })
            }
        }
    }

    console.log(JSON.stringify(stats, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
