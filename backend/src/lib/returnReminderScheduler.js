import config from '../config/env.js'
import prisma from './db.js'
import logger from './logger.js'
import { processDueReturnReminders } from './accountEmails.js'

const DAY_MS = 24 * 60 * 60 * 1000

// The ::int casts below are load-bearing. Prisma sends JS numbers as bigint,
// and pg_try_advisory_lock's two-argument form only exists for (int, int), so
// the uncast query threw on every run and no reminder pass ever completed.
const RETURN_REMINDER_LOCK_FAMILY = 20260426
const RETURN_REMINDER_LOCK_KEY = 1

let startupTimeout = null
let dailyInterval = null

export function getNextReturnReminderRunAt(now = new Date()) {
    const nextRunAt = new Date(now)

    nextRunAt.setUTCHours(config.returnReminders.hourUtc, config.returnReminders.minuteUtc, 0, 0)

    if (nextRunAt <= now) {
        nextRunAt.setUTCDate(nextRunAt.getUTCDate() + 1)
    }

    return nextRunAt
}

async function withReturnReminderLock(callback) {
    const rows = await prisma.$queryRaw`
        SELECT pg_try_advisory_lock(${RETURN_REMINDER_LOCK_FAMILY}::int, ${RETURN_REMINDER_LOCK_KEY}::int) AS locked
    `
    const locked = Array.isArray(rows) && rows[0]?.locked === true

    if (!locked) {
        logger.info('Skipped scheduled return reminder run because another instance owns the lock')
        return { skipped: true }
    }

    try {
        return await callback()
    } finally {
        await prisma.$queryRaw`
            SELECT pg_advisory_unlock(${RETURN_REMINDER_LOCK_FAMILY}::int, ${RETURN_REMINDER_LOCK_KEY}::int)
        `
    }
}

export async function runScheduledReturnReminderPass() {
    try {
        return await withReturnReminderLock(async () => {
            const summary = await processDueReturnReminders(prisma)
            logger.info('Scheduled return reminder run completed', summary)
            return summary
        })
    } catch (error) {
        logger.error('Scheduled return reminder run failed', {
            error: error.message,
            stack: error.stack,
        })
        throw error
    }
}

export function stopReturnReminderScheduler() {
    if (startupTimeout) {
        clearTimeout(startupTimeout)
        startupTimeout = null
    }

    if (dailyInterval) {
        clearInterval(dailyInterval)
        dailyInterval = null
    }
}

export function startReturnReminderScheduler(now = new Date()) {
    if (!config.returnReminders.enabled) {
        return null
    }

    if (startupTimeout || dailyInterval) {
        return null
    }

    const nextRunAt = getNextReturnReminderRunAt(now)
    const delayMs = Math.max(nextRunAt.getTime() - now.getTime(), 0)

    logger.info('Return reminder scheduler armed', {
        nextRunAt: nextRunAt.toISOString(),
        hourUtc: config.returnReminders.hourUtc,
        minuteUtc: config.returnReminders.minuteUtc,
    })

    startupTimeout = setTimeout(async () => {
        startupTimeout = null
        await runScheduledReturnReminderPass()

        dailyInterval = setInterval(() => {
            void runScheduledReturnReminderPass()
        }, DAY_MS)

        dailyInterval.unref?.()
    }, delayMs)

    startupTimeout.unref?.()

    return { nextRunAt }
}