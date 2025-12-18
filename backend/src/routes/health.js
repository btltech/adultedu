import { Router } from 'express'
import prisma from '../lib/db.js'

const router = Router()

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        // Check DB connection
        await prisma.$queryRaw`SELECT 1`

        res.json({
            status: 'ok',
            db: 'connected',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        })
    } catch (err) {
        res.status(503).json({
            status: 'error',
            db: 'disconnected',
            message: err.message,
            timestamp: new Date().toISOString(),
        })
    }
})

export default router
