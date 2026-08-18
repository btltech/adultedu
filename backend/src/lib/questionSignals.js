/**
 * Grade the published question bank from learner behaviour.
 *
 * Shared by the CLI (scripts/audit-question-signals.js) and the weekly
 * scheduler, so a scheduled run and a manual one can never disagree about
 * what counts as a bad question.
 */
import prisma from './db.js'
import { safeJsonParse } from '../../scripts/questionQualityUtils.js'

export const SIGNAL_DEFAULTS = {
    minAttempts: 20,
    // Below this, "hard" stops being a plausible explanation.
    nearZeroSuccess: 0.15,
    // A wrong option must beat the key by this margin to look like a miskey.
    miskeyMargin: 0.10,
    // How close to uniform counts as indistinguishable from guessing.
    guessingTolerance: 0.08,
    // Wrong answers faster than this were not read properly.
    fastWrongSeconds: 6,
    // Discrimination below this counts as inverted. A small negative is noise,
    // not evidence: classical item analysis treats mild values as merely weak.
    negativeDiscrimination: -0.15,
    // Ability needs to rest on more than a couple of other questions, or one
    // unusual item swings the ranking and healthy questions look inverted.
    minRestQuestions: 5,
    // Above this, the item is doing its job: the ablest learners get it right.
    // A dominant wrong option then means a tempting misconception, not a wrong
    // key, and a low success rate means hard, not broken.
    functioningDiscrimination: 0.15,
    // Quarantine needs corroboration: one signal is a hypothesis, two
    // independent ones are a case. A learner report counts as one of them.
    quarantineHighSignals: 2,
    // A single run must never be able to empty the catalogue. If a change to
    // the thresholds ever makes everything look broken, this stops it.
    maxQuarantinePerRun: 25,
}

/** Normalise a stored answer to a comparable key. */
function answerKey(raw) {
    const parsed = safeJsonParse(raw)
    const value = parsed.ok ? parsed.value : raw
    if (value === null || value === undefined) return null
    return typeof value === 'object' ? JSON.stringify(value) : String(value).trim().toLowerCase()
}

function median(values) {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Discrimination: do learners who do well overall also get this right?
 * Compares the top and bottom thirds by ability.
 *
 * Ability is a REST score — each learner's accuracy across every question
 * except this one. Including the item in its own ability score makes every
 * item correlate with itself and pushes discrimination positive, which hides
 * precisely the bad items this is meant to surface. On a 6-question fixture
 * that bias turned a deliberately inverted item from -0.5 into +0.54.
 *
 * A negative value means the item rewards the learners who understand least.
 */
function discrimination(attempts, restAbility) {
    const scored = attempts
        .filter((a) => a.userId && restAbility.has(a.userId))
        .map((a) => ({ ability: restAbility.get(a.userId), correct: a.isCorrect ? 1 : 0 }))
    if (scored.length < 12) return null

    scored.sort((a, b) => a.ability - b.ability)
    const cut = Math.max(1, Math.floor(scored.length / 3))
    const weakest = scored.slice(0, cut)
    const strongest = scored.slice(-cut)

    const rate = (group) => group.reduce((sum, item) => sum + item.correct, 0) / group.length
    return Number((rate(strongest) - rate(weakest)).toFixed(3))
}

function analyseQuestion(question, attempts, restAbility, config) {
    const total = attempts.length
    const correct = attempts.filter((a) => a.isCorrect).length
    const successRate = correct / total

    const options = (() => {
        const parsed = safeJsonParse(question.options)
        return parsed.ok && Array.isArray(parsed.value) ? parsed.value : []
    })()

    // Tally chosen answers so a dominant wrong option becomes visible.
    const chosen = new Map()
    for (const attempt of attempts) {
        const key = answerKey(attempt.userAnswer)
        if (key === null) continue
        chosen.set(key, (chosen.get(key) || 0) + 1)
    }

    const keyed = answerKey(question.answer)
    const distribution = [...chosen.entries()]
        .map(([value, count]) => ({ value, count, share: count / total, isKey: value === keyed }))
        .sort((a, b) => b.count - a.count)

    const topWrong = distribution.find((entry) => !entry.isKey) || null
    const keyEntry = distribution.find((entry) => entry.isKey) || { share: 0 }

    const wrongAttempts = attempts.filter((a) => !a.isCorrect && Number.isFinite(a.timeSpentSec))
    const medianWrongSeconds = median(wrongAttempts.map((a) => a.timeSpentSec))
    const disc = discrimination(attempts, restAbility)

    // An item whose ablest learners still succeed is functioning. Difficulty
    // and a popular distractor are then properties of a hard question, not
    // evidence of a broken one, so the "broken" signals stay quiet.
    const functioning = disc !== null && disc >= config.functioningDiscrimination

    const signals = []
    if (!functioning && topWrong && topWrong.share - keyEntry.share >= config.miskeyMargin) {
        signals.push({
            signal: 'miskey_suspected',
            severity: 'high',
            detail: `${Math.round(topWrong.share * 100)}% chose one wrong option vs ${Math.round(keyEntry.share * 100)}% for the key`,
        })
    }
    if (!functioning && successRate <= config.nearZeroSuccess) {
        signals.push({ signal: 'near_zero_success', severity: 'high', detail: `${Math.round(successRate * 100)}% correct over ${total} attempts` })
    }
    if (options.length > 1 && distribution.length > 1) {
        const expected = 1 / options.length
        const uniform = distribution.every((entry) => Math.abs(entry.share - expected) <= config.guessingTolerance)
        if (uniform) signals.push({ signal: 'guessing', severity: 'medium', detail: `answers spread evenly across ${options.length} options` })
    }
    if (medianWrongSeconds !== null && medianWrongSeconds <= config.fastWrongSeconds && successRate < 0.6) {
        signals.push({ signal: 'fast_wrong', severity: 'low', detail: `median ${medianWrongSeconds}s on wrong answers` })
    }
    if (disc !== null && disc <= config.negativeDiscrimination) {
        signals.push({ signal: 'negative_discrimination', severity: 'high', detail: `strong learners score ${Math.abs(disc * 100).toFixed(0)}% worse than weak learners` })
    }

    if (!signals.length) return null

    const weight = { high: 3, medium: 2, low: 1 }
    const worst = Math.max(...signals.map((s) => weight[s.severity]))
    return {
        questionId: question.id,
        track: question.topic?.track?.slug || 'unknown',
        topic: question.topic?.title,
        prompt: question.prompt.slice(0, 100),
        attempts: total,
        successRate: Number(successRate.toFixed(3)),
        discrimination: disc,
        signals,
        // Rank by learners affected, not just severity: a weak question seen
        // 500 times does more damage than a broken one seen twice.
        impact: Number((worst * Math.log10(total + 1)).toFixed(2)),
    }
}


export function resolveSignalConfig(overrides = {}) {
    return { ...SIGNAL_DEFAULTS, ...overrides }
}

/**
 * Analyse every published question with enough attempts to judge.
 * Pure read; `quarantine` and `flag` are applied by the caller.
 */
export async function collectQuestionSignals({ config = resolveSignalConfig(), quarantine = false, flag = false, apply = false } = {}) {
    const attempts = await prisma.attempt.findMany({
        select: { questionId: true, userId: true, isCorrect: true, userAnswer: true, timeSpentSec: true },
    })

    // Per-learner totals, plus their contribution to each question, so ability
    // can be recomputed per item with that item removed.
    const perUser = new Map()
    const perUserQuestion = new Map()
    for (const attempt of attempts) {
        if (!attempt.userId) continue
        const stats = perUser.get(attempt.userId) || { correct: 0, total: 0, questions: new Set() }
        stats.total += 1
        stats.questions.add(attempt.questionId)
        if (attempt.isCorrect) stats.correct += 1
        perUser.set(attempt.userId, stats)

        const key = `${attempt.userId}::${attempt.questionId}`
        const own = perUserQuestion.get(key) || { correct: 0, total: 0 }
        own.total += 1
        if (attempt.isCorrect) own.correct += 1
        perUserQuestion.set(key, own)
    }

    /** Ability across every question except `questionId`. */
    const restAbilityFor = (questionId, config) => {
        const map = new Map()
        for (const [userId, stats] of perUser) {
            const own = perUserQuestion.get(`${userId}::${questionId}`) || { correct: 0, total: 0 }
            const total = stats.total - own.total
            const restQuestions = stats.questions.size - (stats.questions.has(questionId) ? 1 : 0)
            // Too thin to say anything about ability without one item dominating.
            if (total < 4 || restQuestions < config.minRestQuestions) continue
            map.set(userId, (stats.correct - own.correct) / total)
        }
        return map
    }

    const byQuestion = new Map()
    for (const attempt of attempts) {
        if (!byQuestion.has(attempt.questionId)) byQuestion.set(attempt.questionId, [])
        byQuestion.get(attempt.questionId).push(attempt)
    }

    const eligible = [...byQuestion.entries()].filter(([, list]) => list.length >= config.minAttempts)
    const questions = await prisma.question.findMany({
        where: { id: { in: eligible.map(([id]) => id) }, isPublished: true },
        select: {
            id: true, prompt: true, options: true, answer: true, reviewStatus: true, version: true,
            topic: { select: { title: true, track: { select: { slug: true } } } },
        },
    })

    const reportCounts = new Map(
        (await prisma.questionReport.groupBy({
            by: ['questionId'],
            where: { status: 'open' },
            _count: { questionId: true },
        })).map((row) => [row.questionId, row._count.questionId])
    )

    const findings = []
    for (const question of questions) {
        const finding = analyseQuestion(question, byQuestion.get(question.id), restAbilityFor(question.id, config), config)
        if (!finding) continue
        const reports = reportCounts.get(question.id) || 0
        if (reports > 0) {
            finding.openReports = reports
            // Learner reports and behavioural signal agreeing is the strongest
            // evidence available without anyone reading the question.
            finding.impact = Number((finding.impact + reports).toFixed(2))
            finding.signals.push({ signal: 'learner_reports', severity: 'high', detail: `${reports} open report(s)` })
        }
        findings.push(finding)
    }

    findings.sort((a, b) => b.impact - a.impact)

    const condemned = findings.filter(
        (f) => f.signals.filter((s) => s.severity === 'high').length >= config.quarantineHighSignals
    )

    let quarantined = 0
    let quarantineAborted = null
    if (quarantine) {
        const apply = apply
        if (condemned.length > config.maxQuarantinePerRun) {
            // Far more than expected looks like a threshold bug, not a bad bank.
            quarantineAborted = `${condemned.length} questions met the quarantine bar, above the ${config.maxQuarantinePerRun} cap — refusing to act. Review the findings or raise --max-quarantine deliberately.`
        } else if (apply) {
            for (const finding of condemned) {
                const question = questions.find((q) => q.id === finding.questionId)
                const result = await prisma.question.updateMany({
                    where: { id: question.id, version: question.version, isPublished: true },
                    data: {
                        isPublished: false,
                        reviewStatus: 'quarantined',
                        // Keep the reason with the row so the decision is not
                        // stranded in a console log nobody kept.
                        sourceMeta: JSON.stringify({
                            quarantinedAt: new Date().toISOString(),
                            quarantinedBy: 'audit-question-signals',
                            attempts: finding.attempts,
                            successRate: finding.successRate,
                            discrimination: finding.discrimination,
                            signals: finding.signals.map((s) => s.signal),
                        }),
                        version: { increment: 1 },
                    },
                })
                quarantined += result.count
            }
        }
    }

    let flagged = 0
    if (flag) {
        for (const finding of findings.filter((f) => f.signals.some((s) => s.severity === 'high'))) {
            const question = questions.find((q) => q.id === finding.questionId)
            const result = await prisma.question.updateMany({
                where: { id: question.id, version: question.version },
                data: { reviewStatus: 'flagged', version: { increment: 1 } },
            })
            flagged += result.count
        }
    }

    const bySignal = {}
    for (const finding of findings) {
        for (const signal of finding.signals) bySignal[signal.signal] = (bySignal[signal.signal] || 0) + 1
    }

    const report = {
        generatedAt: new Date().toISOString(),
        mode: flag ? 'flag' : 'audit',
        config,
        attemptsAnalysed: attempts.length,
        questionsWithEnoughData: questions.length,
        questionsFlagged: findings.length,
        questionsMarkedFlagged: flagged,
        quarantineCandidates: condemned.length,
        questionsQuarantined: quarantined,
        ...(quarantineAborted ? { quarantineAborted } : {}),
        bySignal,
        topFindings: findings.slice(0, 25),
    }

    return { ...report, allFindings: findings }
}
