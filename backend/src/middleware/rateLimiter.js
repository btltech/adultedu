import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
