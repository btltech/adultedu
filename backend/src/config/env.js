import dotenv from 'dotenv'
dotenv.config()

function parseBooleanEnv(value, defaultValue) {
    if (value === undefined) return defaultValue
    return value === 'true'
}

function parseIntegerEnv(value, defaultValue) {
    const parsed = Number.parseInt(value || '', 10)
    return Number.isNaN(parsed) ? defaultValue : parsed
}

export const config = {
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',

    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
    trustProxy: (() => {
        // Needed for correct client IP / protocol when running behind Cloudflare/any reverse proxy.
        // Accepts: 'true' | 'false' | <number of hops> | proxy-addr string (e.g. 'loopback').
        if (process.env.TRUST_PROXY === undefined) {
            return process.env.NODE_ENV === 'production' ? 1 : false
        }
        if (process.env.TRUST_PROXY === 'true') return true
        if (process.env.TRUST_PROXY === 'false') return false

        const asInt = Number.parseInt(process.env.TRUST_PROXY, 10)
        if (!Number.isNaN(asInt)) return asInt

        return process.env.TRUST_PROXY
    })(),

    // Database
    databaseUrl:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/adultedu?schema=public',

    // Session
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Cookies
    cookie: {
        // Default to secure cookies in production; allow opt-out for local dev
        secure: process.env.COOKIE_SECURE
            ? process.env.COOKIE_SECURE === 'true'
            : process.env.NODE_ENV === 'production',
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        // For cross-domain deployment, set COOKIE_DOMAIN to your root domain
        // e.g., '.adultedu.com' to share cookies across subdomains
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },

    // Email (Resend)
    resend: {
        apiKey: process.env.RESEND_API_KEY || '',
        from: process.env.EMAIL_FROM || 'AdultEdu <noreply@adult-edu.org>',
    },

    questionAudit: {
        enabled: parseBooleanEnv(process.env.QUESTION_AUDIT_CRON_ENABLED, process.env.NODE_ENV === 'production'),
        // Monday morning UTC: a full week of attempts behind it, and a whole
        // working week ahead to act on what it finds.
        dayOfWeek: Math.min(Math.max(parseIntegerEnv(process.env.QUESTION_AUDIT_CRON_DAY, 1), 0), 6),
        hourUtc: Math.min(Math.max(parseIntegerEnv(process.env.QUESTION_AUDIT_CRON_UTC_HOUR, 4), 0), 23),
        minuteUtc: Math.min(Math.max(parseIntegerEnv(process.env.QUESTION_AUDIT_CRON_UTC_MINUTE, 30), 0), 59),
        // Reporting is on by default; unpublishing is opt-in, because it
        // changes what learners see with nobody in the loop.
        quarantine: parseBooleanEnv(process.env.QUESTION_AUDIT_QUARANTINE, false),
    },
    returnReminders: {
        enabled: parseBooleanEnv(process.env.RETURN_REMINDER_CRON_ENABLED, process.env.NODE_ENV === 'production'),
        hourUtc: Math.min(Math.max(parseIntegerEnv(process.env.RETURN_REMINDER_CRON_UTC_HOUR, 9), 0), 23),
        minuteUtc: Math.min(Math.max(parseIntegerEnv(process.env.RETURN_REMINDER_CRON_UTC_MINUTE, 0), 0), 59),
    },
}

export default config
