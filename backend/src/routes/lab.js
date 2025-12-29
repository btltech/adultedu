import { Router } from 'express'
import { z } from 'zod'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { awardXP } from './gamification.js'

const router = Router()

const XP_LAB_COMPLETE = 5

const labCompleteSchema = z.object({
    labType: z.enum(['graph', 'logic']),
    levelId: z.preprocess((v) => {
        if (typeof v === 'number') return v
        if (typeof v === 'string' && v.trim() !== '') return Number.parseInt(v.trim(), 10)
        return v
    }, z.number().int().positive()),
})

function safeParseLevelId(metadata) {
    try {
        const parsed = JSON.parse(metadata || '{}')
        const n = Number(parsed?.levelId)
        return Number.isInteger(n) && n > 0 ? n : null
    } catch {
        return null
    }
}

/**
 * GET /api/lab/progress
 * Returns the user's completed Lab levels (unique, server-side).
 */
router.get('/lab/progress', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id

        const [graphEvents, logicEvents] = await Promise.all([
            prisma.analyticsEvent.findMany({
                where: { userId, eventType: 'lab_graph_complete' },
                select: { metadata: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.analyticsEvent.findMany({
                where: { userId, eventType: 'lab_logic_complete' },
                select: { metadata: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
            }),
        ])

        const graphCompletedIds = [...new Set(graphEvents.map((e) => safeParseLevelId(e.metadata)).filter(Boolean))]
        const logicCompletedIds = [...new Set(logicEvents.map((e) => safeParseLevelId(e.metadata)).filter(Boolean))]

        res.json({
            graph: { completedIds: graphCompletedIds, count: graphCompletedIds.length },
            logic: { completedIds: logicCompletedIds, count: logicCompletedIds.length },
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/lab/complete
 * Mark a Lab level as completed (idempotent) and award a small amount of XP once.
 */
router.post('/lab/complete', requireAuth, validate(labCompleteSchema), async (req, res, next) => {
    try {
        const userId = req.user.id
        const { labType, levelId } = req.body

        const eventType = labType === 'graph' ? 'lab_graph_complete' : 'lab_logic_complete'
        const metadata = JSON.stringify({ levelId })

        const existing = await prisma.analyticsEvent.findFirst({
            where: { userId, eventType, metadata },
            select: { id: true },
        })

        if (existing) {
            const [graphCount, logicCount] = await Promise.all([
                prisma.analyticsEvent.count({ where: { userId, eventType: 'lab_graph_complete' } }),
                prisma.analyticsEvent.count({ where: { userId, eventType: 'lab_logic_complete' } }),
            ])

            return res.json({
                completed: false,
                alreadyCompleted: true,
                xp: { xpAwarded: 0 },
                progress: { graphCount, logicCount },
            })
        }

        await prisma.analyticsEvent.create({
            data: {
                userId,
                eventType,
                metadata,
            },
        })

        const xp = await awardXP(userId, XP_LAB_COMPLETE, false)

        const [graphCount, logicCount] = await Promise.all([
            prisma.analyticsEvent.count({ where: { userId, eventType: 'lab_graph_complete' } }),
            prisma.analyticsEvent.count({ where: { userId, eventType: 'lab_logic_complete' } }),
        ])

        res.status(201).json({
            completed: true,
            alreadyCompleted: false,
            xp,
            progress: { graphCount, logicCount },
        })
    } catch (error) {
        next(error)
    }
})

export default router

