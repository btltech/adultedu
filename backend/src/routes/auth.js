import { Router } from 'express'
import prisma from '../lib/db.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import config from '../config/env.js'
import { requireAuth } from '../middleware/auth.js'
import { validate, signupSchema, loginSchema, verifyEmailSchema } from '../middleware/validate.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import logger from '../lib/logger.js'
import { buildAuthUser } from '../lib/learnerOnboarding.js'
import { sendPasswordResetEmail } from '../lib/email.js'
import { createEmailVerificationFields, sendVerificationEmailForUser, sendWelcomeEmailForUser } from '../lib/accountEmails.js'

const router = Router()

const VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000


// Session duration: 7 days
const SESSION_DURATION_MS = config.cookie.maxAge || (7 * 24 * 60 * 60 * 1000)
const ROTATE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // Rotate if <24h remains
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite || 'lax',
    ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
    maxAge: SESSION_DURATION_MS,
    path: '/',
}

const SESSION_CLEAR_COOKIE_OPTIONS = {
    path: '/',
    ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
}

async function rotateSessionIfNeeded(session, res) {
    const timeLeft = session.expiresAt.getTime() - Date.now()
    if (timeLeft > ROTATE_THRESHOLD_MS) return session

    const token = crypto.randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

    const updatedSession = await prisma.session.update({
        where: { id: session.id },
        data: { token, expiresAt },
        include: { user: true },
    })

    res.cookie('session', token, SESSION_COOKIE_OPTIONS)
    return updatedSession
}

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post('/auth/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
    try {
        const { password, displayName } = req.body
        const email = req.body.email.toLowerCase().trim()

        // Check if email exists
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'An account with this email already exists'
            })
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role: 'user',
                displayName: displayName || null,
                ...createEmailVerificationFields(),
            },
        })

        // Create session
        const token = crypto.randomBytes(64).toString('hex')
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        })

        // Set cookie
        res.cookie('session', token, SESSION_COOKIE_OPTIONS)

        const emailResults = await Promise.allSettled([
            sendVerificationEmailForUser(prisma, user),
            sendWelcomeEmailForUser(prisma, user),
        ])

        emailResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                logger.warn('Post-signup email failed', {
                    userId: user.id,
                    kind: index === 0 ? 'verification' : 'welcome',
                    error: result.reason?.message || String(result.reason),
                })
            }
        })

        const freshUser = await prisma.user.findUnique({ where: { id: user.id } })

        res.status(201).json({
            message: 'Account created successfully',
            verificationEmailSent: emailResults[0].status === 'fulfilled' && emailResults[0].value.sent,
            welcomeEmailSent: emailResults[1].status === 'fulfilled' && emailResults[1].value.sent,
            user: await buildAuthUser(prisma, freshUser || user),
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/auth/login
 * Log in with email and password
 */
router.post('/auth/login', authLimiter, validate(loginSchema), async (req, res, next) => {
    try {
        const email = req.body.email.toLowerCase().trim()
        const { password } = req.body

        // Find user
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            logger.warn(`Failed login attempt: user not found - ${email} from ${req.ip}`)
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            })
        }

        // Check password
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
            logger.warn(`Failed login attempt: invalid password - ${email} from ${req.ip}`)
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            })
        }

        // Create session
        const token = crypto.randomBytes(64).toString('hex')
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        })

        // Set cookie
        res.cookie('session', token, SESSION_COOKIE_OPTIONS)

        res.json({
            message: 'Logged in successfully',
            user: await buildAuthUser(prisma, user),
        })
    } catch (error) {
        next(error)
    }
})

router.post('/auth/verify-email', authLimiter, validate(verifyEmailSchema), async (req, res, next) => {
    try {
        const { token } = req.body

        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationExpiry: { gt: new Date() },
            },
        })

        if (!user) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Invalid or expired verification link. Please request a new one.',
            })
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: new Date(),
                emailVerificationToken: null,
                emailVerificationExpiry: null,
            },
        })

        const sessionToken = req.cookies?.session
        let authUser = null

        if (sessionToken) {
            const session = await prisma.session.findUnique({
                where: { token: sessionToken },
                include: { user: true },
            })

            if (session && session.expiresAt >= new Date() && session.userId === updatedUser.id) {
                authUser = await buildAuthUser(prisma, updatedUser)
            }
        }

        return res.json({
            message: 'Email verified successfully.',
            user: authUser,
        })
    } catch (error) {
        next(error)
    }
})

router.post('/auth/resend-verification', authLimiter, requireAuth, async (req, res, next) => {
    try {
        if (req.user.emailVerifiedAt) {
            return res.json({
                message: 'Your email is already verified.',
                user: await buildAuthUser(prisma, req.user),
            })
        }

        if (
            req.user.verificationEmailSentAt
            && (Date.now() - new Date(req.user.verificationEmailSentAt).getTime()) < VERIFICATION_RESEND_COOLDOWN_MS
        ) {
            return res.json({
                message: 'A verification email was sent recently. Please wait a minute and check your inbox.',
                user: await buildAuthUser(prisma, req.user),
            })
        }

        const result = await sendVerificationEmailForUser(prisma, req.user)

        return res.json({
            message: 'A new verification email is on its way.',
            user: await buildAuthUser(prisma, result.user),
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/auth/logout
 * Log out and clear session
 */
router.post('/auth/logout', async (req, res, next) => {
    try {
        const token = req.cookies?.session

        if (token) {
            // Delete session from database
            await prisma.session.deleteMany({ where: { token } })
        }

        // Clear cookie
        res.clearCookie('session', SESSION_CLEAR_COOKIE_OPTIONS)

        res.json({ message: 'Logged out successfully' })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/auth/me', async (req, res, next) => {
    try {
        const token = req.cookies?.session

        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Not logged in'
            })
        }

        // Find valid session
        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true },
        })

        if (!session || session.expiresAt < new Date()) {
            // Session expired or not found
            if (session) {
                await prisma.session.delete({ where: { id: session.id } })
            }
            res.clearCookie('session', SESSION_CLEAR_COOKIE_OPTIONS)
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Session expired'
            })
        }

        const freshSession = await rotateSessionIfNeeded(session, res)

        res.json({
            user: await buildAuthUser(prisma, freshSession.user),
        })
    } catch (error) {
        next(error)
    }
})

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /auth/forgot-password
// Generates a reset token and emails the user. Always returns 200 to avoid
// leaking whether an account exists for a given email address.
router.post('/auth/forgot-password', authLimiter, async (req, res, next) => {
    try {
        const email = (req.body?.email || '').toLowerCase().trim()

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' })
        }

        const user = await prisma.user.findUnique({ where: { email } })

        if (user) {
            const rawToken = crypto.randomBytes(32).toString('hex')
            const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: rawToken,
                    passwordResetExpiry: expiry,
                },
            })

            const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`
            await sendPasswordResetEmail(user.email, resetUrl)
            logger.info('Password reset requested', { userId: user.id })
        }

        // Always respond the same way — do not reveal account existence
        return res.json({
            message: 'If an account exists for that email, a reset link has been sent.',
        })
    } catch (error) {
        next(error)
    }
})

// ─── Reset Password ───────────────────────────────────────────────────────────
// POST /auth/reset-password
// Validates the token, sets a new password, and logs the user in.
router.post('/auth/reset-password', authLimiter, async (req, res, next) => {
    try {
        const { token, password } = req.body || {}

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Reset token is required' })
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' })
        }

        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gt: new Date() },
            },
        })

        if (!user) {
            return res.status(400).json({
                error: 'Invalid or expired reset link. Please request a new one.',
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        // Update password and clear the reset token atomically
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
            },
        })

        // Invalidate all existing sessions for this user
        await prisma.session.deleteMany({ where: { userId: user.id } })

        // Create a fresh session so the user is logged in immediately
        const newToken = crypto.randomBytes(64).toString('hex')
        const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

        const session = await prisma.session.create({
            data: {
                token: newToken,
                userId: user.id,
                expiresAt,
            },
            include: { user: true },
        })

        res.cookie('session', newToken, SESSION_COOKIE_OPTIONS)
        logger.info('Password reset completed', { userId: user.id })

        return res.json({
            user: await buildAuthUser(prisma, session.user),
        })
    } catch (error) {
        next(error)
    }
})

export default router
