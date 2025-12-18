import prisma from '../lib/db.js'
import config from '../config/env.js'


const SESSION_CLEAR_COOKIE_OPTIONS = {
    path: '/',
    ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
}

/**
 * Auth middleware - checks for valid session and attaches user to request
 * Use this for protected routes
 */
export async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.session

        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            })
        }

        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true },
        })

        if (!session || session.expiresAt < new Date()) {
            if (session) {
                await prisma.session.delete({ where: { id: session.id } })
            }
            res.clearCookie('session', SESSION_CLEAR_COOKIE_OPTIONS)
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Session expired'
            })
        }

        // Attach user to request
        req.user = session.user
        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Admin-only middleware
 */
export async function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        })
    }
    next()
}

/**
 * Optional auth - attaches user if logged in, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
    try {
        const token = req.cookies?.session

        if (token) {
            const session = await prisma.session.findUnique({
                where: { token },
                include: { user: true },
            })

            if (session && session.expiresAt >= new Date()) {
                req.user = session.user
            }
        }

        next()
    } catch (error) {
        // Don't fail on auth errors for optional auth
        next()
    }
}

export default { requireAuth, requireAdmin, optionalAuth }
