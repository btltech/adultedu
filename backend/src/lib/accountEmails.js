import crypto from 'crypto'
import config from '../config/env.js'
import logger from './logger.js'
import { sendReturnReminderEmail, sendVerificationEmail, sendWelcomeEmail } from './email.js'

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const RETURN_REMINDER_DELAY_HOURS = Number.parseInt(process.env.RETURN_REMINDER_DELAY_HOURS || '36', 10)
const RETURN_REMINDER_BATCH_SIZE = Number.parseInt(process.env.RETURN_REMINDER_BATCH_SIZE || '100', 10)

export function createEmailVerificationFields(now = new Date()) {
    return {
        emailVerificationToken: crypto.randomBytes(32).toString('hex'),
        emailVerificationExpiry: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
    }
}

function buildVerificationUrl(token) {
    return `${config.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`
}

function buildContinueUrl() {
    return `${config.frontendUrl}/start`
}

export async function ensureEmailVerificationToken(prisma, user) {
    if (user.emailVerifiedAt) return user

    if (user.emailVerificationToken && user.emailVerificationExpiry && user.emailVerificationExpiry > new Date()) {
        return user
    }

    return prisma.user.update({
        where: { id: user.id },
        data: createEmailVerificationFields(),
    })
}

export async function sendVerificationEmailForUser(prisma, user) {
    if (user.emailVerifiedAt) {
        return { sent: false, reason: 'already_verified', user }
    }

    const targetUser = await ensureEmailVerificationToken(prisma, user)
    const verifyUrl = buildVerificationUrl(targetUser.emailVerificationToken)

    await sendVerificationEmail(targetUser.email, verifyUrl)

    const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { verificationEmailSentAt: new Date() },
    })

    return { sent: true, user: updatedUser, verifyUrl }
}

export async function sendWelcomeEmailForUser(prisma, user) {
    await sendWelcomeEmail(user.email, buildContinueUrl())

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { welcomeEmailSentAt: new Date() },
    })

    return { sent: true, user: updatedUser }
}

export async function sendReturnReminderEmailForUser(prisma, user) {
    let verifyUrl = null
    let targetUser = user

    if (!user.emailVerifiedAt) {
        targetUser = await ensureEmailVerificationToken(prisma, user)
        verifyUrl = buildVerificationUrl(targetUser.emailVerificationToken)
    }

    await sendReturnReminderEmail(targetUser.email, buildContinueUrl(), verifyUrl)

    const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { returnReminderSentAt: new Date() },
    })

    return { sent: true, user: updatedUser, verifyUrl }
}

export async function processDueReturnReminders(prisma, { now = new Date() } = {}) {
    const cutoff = new Date(now.getTime() - (RETURN_REMINDER_DELAY_HOURS * 60 * 60 * 1000))
    const dueUsers = await prisma.user.findMany({
        where: {
            role: 'user',
            createdAt: { lte: cutoff },
            lastActiveDate: null,
            returnReminderSentAt: null,
        },
        orderBy: { createdAt: 'asc' },
        take: RETURN_REMINDER_BATCH_SIZE,
    })

    const results = []

    for (const user of dueUsers) {
        try {
            await sendReturnReminderEmailForUser(prisma, user)
            results.push({ userId: user.id, status: 'sent' })
        } catch (error) {
            logger.error('Failed to send return reminder', {
                userId: user.id,
                email: user.email,
                error: error.message,
            })
            results.push({ userId: user.id, status: 'failed', error: error.message })
        }
    }

    return {
        scanned: dueUsers.length,
        sent: results.filter((result) => result.status === 'sent').length,
        failed: results.filter((result) => result.status === 'failed').length,
        results,
    }
}