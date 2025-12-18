import express from 'express'
import cookieParser from 'cookie-parser'
import config from './config/env.js'
import corsMiddleware from './middleware/cors.js'
import { apiLimiter } from './middleware/rateLimiter.js'
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

import logger from './lib/logger.js'

// ... imports ...
import { generateCsrfToken, verifyCsrfToken } from './middleware/csrf.js'

const app = express()

// Middleware
app.use(corsMiddleware)
app.use(apiLimiter)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// CSRF Protection
// Note: Frontend must read 'XSRF-TOKEN' cookie and set 'X-CSRF-Token' header on mutations
app.use(generateCsrfToken)
app.use(verifyCsrfToken)

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
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
v1Router.use('/', dailyRoutes)
v1Router.use('/', gamificationRoutes)
v1Router.use('/', achievementsRoutes)
v1Router.use('/admin', adminRoutes)
v1Router.use('/', certificatesRoutes)
v1Router.use('/', eventsRoutes)
v1Router.use('/organizations', organizationsRoutes)

app.use('/api/v1', v1Router)
// Keep /api for backward compatibility safely or redirect? 
// For now, let's just make v1 standard. 
// But the frontend uses /api currently. 
// I should update frontend base URL or map /api to /api/v1 temporarily.
app.use('/api', v1Router) // Alias for backward compatibility if needed, but let's stick to plan.

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    })
})

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err)

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
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎓 AdultEdu API Server                          ║
║                                                   ║
║   Running at: http://${config.host}:${config.port}           ║
║   Environment: ${config.nodeEnv.padEnd(32)}║
║                                                   ║
║   Health: http://${config.host}:${config.port}/api/health    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `)
    })
}

export default app
