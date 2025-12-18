import crypto from 'crypto'
import config from '../config/env.js'

const CSRF_COOKIE_NAME = 'XSRF-TOKEN'

/**
 * Generate a CSRF token and set it as a cookie
 */
export const generateCsrfToken = (req, res, next) => {
    // Check if expected csrf token already exists
    const existingToken = req.cookies[CSRF_COOKIE_NAME]

    // Always have a token value for this request, even before the client reads the cookie
    const token = existingToken || crypto.randomBytes(32).toString('hex')

    // Only write a cookie when we had to generate a new token
    if (!existingToken) {
        res.cookie(CSRF_COOKIE_NAME, token, {
            secure: config.cookie.secure,
            sameSite: config.cookie.sameSite || 'lax', // Must be lax or strict for CSRF
            httpOnly: false, // Must be readable by frontend JS to echo in headers
            ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
            path: '/',
        })
    }

    req.csrfToken = token
    next()
}

/**
 * Verify CSRF token on mutating requests
 */
export const verifyCsrfToken = (req, res, next) => {
    // Skip GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
    }

    const tokenFromHeader = req.headers['x-csrf-token']
    const tokenFromCookie = req.cookies[CSRF_COOKIE_NAME]
    // If the cookie was just minted on this request, fall back to the freshly generated token
    const expectedToken = tokenFromCookie || req.csrfToken

    if (!expectedToken || !tokenFromHeader || tokenFromHeader !== expectedToken) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid CSRF Token'
        })
    }

    next()
}
