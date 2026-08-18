import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { createHash } from 'node:crypto'

// apiLimiter runs before route authentication, so req.user is not available.
// The session cookie is already parsed at this point and is a stable,
// per-learner identifier. Hash it so the raw session token never becomes a
// rate-limit key in logs or diagnostics. Anonymous traffic remains IP-keyed.
export function apiRateLimitKey(req) {
    const sessionToken = req.cookies?.session
    if (sessionToken) {
        const sessionHash = createHash('sha256').update(sessionToken).digest('hex')
        return `session:${sessionHash}`
    }
    return `ip:${ipKeyGenerator(req.ip)}`
}

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: apiRateLimitKey,
    message: { error: 'Too Many Requests', message: 'Too many requests, please try again later.' }
})

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/signup requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too Many Requests', message: 'Too many auth attempts, please try again later.' }
})

// Reporting a question is an unauthenticated write, and the per-user duplicate
// check in the route cannot cover anonymous submissions. Without this, one IP
// could fill the moderation queue up to the general API budget.
export const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // generous for a real learner, useless for flooding
    // Signed-in learners get an independent bucket, so a shared library or
    // college connection cannot exhaust the allowance for everyone. Anonymous
    // reports still use the safely-normalised client IP.
    keyGenerator: (req) => req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too Many Requests', message: 'Too many reports from this connection. Please try again later.' }
})
