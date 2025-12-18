import dotenv from 'dotenv'
dotenv.config()

export const config = {
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',

    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),

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
}

export default config
