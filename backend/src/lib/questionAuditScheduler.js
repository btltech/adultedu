import config from '../config/env.js'
import prisma from './db.js'
import logger from './logger.js'
import { collectQuestionSignals, resolveSignalConfig } from './questionSignals.js'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// Distinct from the return-reminder lock so the two schedulers never block
// each other. The ::int casts are required: Prisma sends JS numbers as bigint,
// and the two-argument pg_try_advisory_lock only exists for (int, int), so
// without them every call throws and the lock silently never engages.
const QUESTION_AUDIT_LOCK_FAMILY = 20260818
const QUESTION_AUDIT_LOCK_KEY = 1

let startupTimeout = null
let weeklyInterval = null

export function getNextQuestionAuditRunAt(now = new Date()) {
    const nextRunAt = new Date(now)
    nextRunAt.setUTCHours(config.questionAudit.hourUtc, config.questionAudit.minuteUtc, 0, 0)

    // Advance to the configured weekday, always landing in the future.
    const daysAhead = (config.questionAudit.dayOfWeek - nextRunAt.getUTCDay() + 7) % 7
    nextRunAt.setUTCDate(nextRunAt.getUTCDate() + daysAhead)
    if (nextRunAt <= now) nextRunAt.setUTCDate(nextRunAt.getUTCDate() + 7)

    return nextRunAt
}

async function withQuestionAuditLock(callback) {
    const rows = await prisma.$queryRaw`
        SELECT pg_try_advisory_lock(${QUESTION_AUDIT_LOCK_FAMILY}::int, ${QUESTION_AUDIT_LOCK_KEY}::int) AS locked
    `
    const locked = Array.isArray(rows) && rows[0]?.locked === true

    if (!locked) {
        logger.info('Skipped scheduled question audit because another instance owns the lock')
        return { skipped: true }
    }

    try {
        return await callback()
    } finally {
        await prisma.$queryRaw`
            SELECT pg_advisory_unlock(${QUESTION_AUDIT_LOCK_FAMILY}::int, ${QUESTION_AUDIT_LOCK_KEY}::int)
        `
    }
}

export async function runScheduledQuestionAudit() {
    try {
        return await withQuestionAuditLock(async () => {
            const result = await collectQuestionSignals({
                config: resolveSignalConfig(),
                quarantine: config.questionAudit.quarantine,
                apply: config.questionAudit.quarantine,
            })

            const { allFindings, topFindings, config: used, ...summary } = result
            logger.info('Scheduled question audit completed', summary)

            // Name the worst offenders so the log is actionable without
            // re-running anything.
            for (const finding of topFindings.slice(0, 5)) {
                logger.warn('Question flagged by behavioural audit', {
                    questionId: finding.questionId,
                    track: finding.track,
                    attempts: finding.attempts,
                    successRate: finding.successRate,
                    discrimination: finding.discrimination,
                    signals: finding.signals.map((signal) => signal.signal),
                })
            }

            if (result.quarantineAborted) {
                logger.error('Question audit refused to quarantine', { reason: result.quarantineAborted })
            }

            return summary
        })
    } catch (error) {
        logger.error('Scheduled question audit failed', { error: error.message, stack: error.stack })
        throw error
    }
}

export function stopQuestionAuditScheduler() {
    if (startupTimeout) {
        clearTimeout(startupTimeout)
        startupTimeout = null
    }
    if (weeklyInterval) {
        clearInterval(weeklyInterval)
        weeklyInterval = null
    }
}

export function startQuestionAuditScheduler(now = new Date()) {
    if (!config.questionAudit.enabled) return null
    if (startupTimeout || weeklyInterval) return null

    const nextRunAt = getNextQuestionAuditRunAt(now)
    const delayMs = Math.max(nextRunAt.getTime() - now.getTime(), 0)

    logger.info('Question audit scheduler armed', {
        nextRunAt: nextRunAt.toISOString(),
        quarantine: config.questionAudit.quarantine,
    })

    startupTimeout = setTimeout(async () => {
        startupTimeout = null
        await runScheduledQuestionAudit()

        weeklyInterval = setInterval(() => {
            void runScheduledQuestionAudit()
        }, WEEK_MS)

        weeklyInterval.unref?.()
    }, delayMs)

    startupTimeout.unref?.()
    return { nextRunAt }
}
