import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import config from './config/env.js'
import corsMiddleware from './middleware/cors.js'
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth.js'
import tracksRoutes from './routes/tracks.js'
import frameworksRoutes from './routes/frameworks.js'
import ukLevelsRoutes from './routes/ukLevels.js'
import topicsRoutes from './routes/topics.js'
import progressRoutes from './routes/progress.js'
import lessonsRoutes from './routes/lessons.js'
import adminRoutes from './routes/admin.js'
import certificatesRoutes from './routes/certificates.js'
import eventsRoutes from './routes/events.js'
import organizationsRoutes from './routes/organizations.js'
import reviewRoutes from './routes/review.js'
import analyticsRoutes from './routes/analytics.js'
import diagnosticRoutes from './routes/diagnostic.js'
import dailyRoutes from './routes/daily.js'
import gamificationRoutes from './routes/gamification.js'
import achievementsRoutes from './routes/achievements.js'
import dictionaryRoutes from './routes/dictionary.js'
import onboardingRoutes from './routes/onboarding.js'
import partnerReportsRoutes from './routes/partnerReports.js'

import logger from './lib/logger.js'
import { startReturnReminderScheduler } from './lib/returnReminderScheduler.js'

// ... imports ...
import { generateCsrfToken, verifyCsrfToken } from './middleware/csrf.js'
import { apiLimiter } from './middleware/rateLimiter.js'

const app = express()

app.set('trust proxy', config.trustProxy)

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind or inline styles if needed
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}))

// Middleware
app.use(corsMiddleware)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())
app.use('/api/v1', apiLimiter)

// CSRF Protection
// Note: Frontend must read 'XSRF-TOKEN' cookie and set 'X-CSRF-Token' header on mutations
app.use(generateCsrfToken)
app.use(verifyCsrfToken)

// Request logging
app.use((req, res, next) => {
    const startedAt = Date.now()

    res.on('finish', () => {
        logger.info('HTTP request', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
        })
    })

    next()
})

// API Routes v1
const v1Router = express.Router()

v1Router.use('/', healthRoutes)
v1Router.use('/', authRoutes)
v1Router.use('/', tracksRoutes)
v1Router.use('/', frameworksRoutes)
v1Router.use('/', ukLevelsRoutes)
v1Router.use('/', topicsRoutes)
v1Router.use('/', progressRoutes)
v1Router.use('/', lessonsRoutes)
v1Router.use('/', reviewRoutes)
v1Router.use('/', analyticsRoutes)
v1Router.use('/', diagnosticRoutes)
v1Router.use('/', onboardingRoutes)
v1Router.use('/', dailyRoutes)
v1Router.use('/', gamificationRoutes)
v1Router.use('/', achievementsRoutes)
v1Router.use('/admin', adminRoutes)
v1Router.use('/admin/partners', partnerReportsRoutes)
v1Router.use('/', certificatesRoutes)
v1Router.use('/', eventsRoutes)
v1Router.use('/organizations', organizationsRoutes)
v1Router.use('/dictionary', dictionaryRoutes)

app.use('/api/v1', v1Router)

// 404 handler
app.use('/api/v1/*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    })
})

app.use('/api', (req, res) => {
    res.status(410).json({
        error: 'Gone',
        message: 'Legacy /api routes have been removed. Use /api/v1.',
    })
})

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled request error', {
        method: req.method,
        path: req.originalUrl,
        error: err.message,
        stack: err.stack,
        name: err.name,
    })

    const statusCode = err.statusCode || 500
    const message = config.isDev ? err.message : 'Internal Server Error'

    res.status(statusCode).json({
        error: err.name || 'Error',
        message,
        ...(config.isDev && { stack: err.stack }),
    })
})

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(config.port, config.host, () => {
        logger.info('AdultEdu API server started', {
            host: config.host,
            port: config.port,
            environment: config.nodeEnv,
            healthUrl: `http://${config.host}:${config.port}/api/v1/health`,
        })

        startReturnReminderScheduler()
    })
}

export default app
