import { Router } from 'express'
import prisma from '../lib/db.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import config from '../config/env.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { validate, signupSchema, loginSchema } from '../middleware/validate.js'

const router = Router()


// Session duration: 7 days
const SESSION_DURATION_MS = config.cookie.maxAge || (7 * 24 * 60 * 60 * 1000)
const ROTATE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // Rotate if <24h remains
const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite || 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
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
        const { email, password } = req.body

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

        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
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
        const { email, password } = req.body

        // Find user
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            })
        }

        // Check password
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
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
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
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
        res.clearCookie('session', { path: '/' })

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
            res.clearCookie('session', { path: '/' })
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Session expired'
            })
        }

        const freshSession = await rotateSessionIfNeeded(session, res)

        res.json({
            user: {
                id: freshSession.user.id,
                email: freshSession.user.email,
                role: freshSession.user.role,
            },
        })
    } catch (error) {
        next(error)
    }
})

export default router
