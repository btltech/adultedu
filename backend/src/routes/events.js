import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * POST /api/events
 * Track an analytics event
 */
router.post('/events', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id
        const { eventType, metadata } = req.body

        if (!eventType) {
            return res.status(400).json({ error: 'eventType is required' })
        }

        const event = await prisma.analyticsEvent.create({
            data: {
                userId,
                eventType,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        })

        res.status(201).json({ id: event.id })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/admin/analytics/events
 * Get aggregated event stats (admin only)
 */
router.get('/admin/analytics/events', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { days = 30 } = req.query
        const since = new Date()
        since.setDate(since.getDate() - parseInt(days))

        // Get event counts by type
        const eventCounts = await prisma.analyticsEvent.groupBy({
            by: ['eventType'],
            _count: { id: true },
            where: { createdAt: { gte: since } },
            orderBy: { _count: { id: 'desc' } }
        })

        // Get daily activity
        const dailyEvents = await prisma.$queryRaw`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM analytics_events
            WHERE created_at >= ${since}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `

        res.json({
            eventCounts: eventCounts.map(e => ({
                eventType: e.eventType,
                count: e._count.id
            })),
            dailyActivity: dailyEvents
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/admin/analytics/time-on-task
 * Get average time spent on questions (admin only)
 */
router.get('/admin/analytics/time-on-task', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { days = 30 } = req.query
        const since = new Date()
        since.setDate(since.getDate() - parseInt(days))

        // Get average time per question type from attempts
        const timeStats = await prisma.attempt.groupBy({
            by: ['questionId'],
            _avg: { timeSpentSec: true },
            _count: { id: true },
            where: {
                createdAt: { gte: since },
                timeSpentSec: { not: null }
            }
        })

        // Get question types for these questions
        const questionIds = timeStats.map(t => t.questionId)
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            select: { id: true, type: true, difficulty: true }
        })

        const questionMap = new Map(questions.map(q => [q.id, q]))

        // Aggregate by type
        const byType = {}
        timeStats.forEach(stat => {
            const question = questionMap.get(stat.questionId)
            if (!question) return

            if (!byType[question.type]) {
                byType[question.type] = { totalTime: 0, count: 0 }
            }
            byType[question.type].totalTime += (stat._avg.timeSpentSec || 0) * stat._count.id
            byType[question.type].count += stat._count.id
        })

        const timeByType = Object.entries(byType).map(([type, data]) => ({
            type,
            avgSeconds: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
            attempts: data.count
        }))

        res.json({ timeByType })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/admin/analytics/funnel
 * Get learning funnel drop-off data (admin only)
 */
router.get('/admin/analytics/funnel', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { days = 30 } = req.query
        const since = new Date()
        since.setDate(since.getDate() - parseInt(days))

        // Funnel stages: Visit → Enroll → First Question → Complete 5 → Complete 10
        const [
            totalUsers,
            enrolledUsers,
            attemptedUsers,
            completed5,
            completed10
        ] = await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: since } } }),
            prisma.enrollment.groupBy({
                by: ['userId'],
                where: { createdAt: { gte: since } }
            }).then(r => r.length),
            prisma.attempt.groupBy({
                by: ['userId'],
                where: { createdAt: { gte: since } }
            }).then(r => r.length),
            prisma.attempt.groupBy({
                by: ['userId'],
                _count: { id: true },
                where: { createdAt: { gte: since } },
                having: { id: { _count: { gte: 5 } } }
            }).then(r => r.length),
            prisma.attempt.groupBy({
                by: ['userId'],
                _count: { id: true },
                where: { createdAt: { gte: since } },
                having: { id: { _count: { gte: 10 } } }
            }).then(r => r.length)
        ])

        res.json({
            funnel: [
                { stage: 'Registered', count: totalUsers },
                { stage: 'Enrolled', count: enrolledUsers },
                { stage: 'First Question', count: attemptedUsers },
                { stage: 'Completed 5+', count: completed5 },
                { stage: 'Completed 10+', count: completed10 }
            ]
        })
    } catch (error) {
        next(error)
    }
})

export default router
