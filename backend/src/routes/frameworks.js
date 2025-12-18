import { Router } from 'express'
import prisma from '../lib/db.js'

const router = Router()


/**
 * GET /api/frameworks
 * List all qualification frameworks
 */
router.get('/frameworks', async (req, res, next) => {
    try {
        const frameworks = await prisma.framework.findMany({
            include: {
                _count: {
                    select: {
                        trackFrameworks: true,
                        outcomes: true,
                    },
                },
            },
            orderBy: { slug: 'asc' },
        })

        const formatted = frameworks.map(f => ({
            id: f.id,
            slug: f.slug,
            title: f.title,
            description: f.description,
            trackCount: f._count.trackFrameworks,
            outcomeCount: f._count.outcomes,
        }))

        res.json(formatted)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/frameworks/:slug/outcomes
 * Get outcomes for a framework
 */
router.get('/frameworks/:slug/outcomes', async (req, res, next) => {
    try {
        const framework = await prisma.framework.findUnique({
            where: { slug: req.params.slug },
            include: {
                outcomes: {
                    orderBy: { code: 'asc' },
                },
            },
        })

        if (!framework) {
            return res.status(404).json({ error: 'Framework not found' })
        }

        // Group outcomes by area (for EDS)
        const groupedByArea = {}
        for (const outcome of framework.outcomes) {
            const area = outcome.area || 'general'
            if (!groupedByArea[area]) {
                groupedByArea[area] = []
            }
            groupedByArea[area].push({
                id: outcome.id,
                code: outcome.code,
                title: outcome.title,
                description: outcome.description,
            })
        }

        res.json({
            framework: {
                slug: framework.slug,
                title: framework.title,
            },
            outcomesByArea: groupedByArea,
            totalOutcomes: framework.outcomes.length,
        })
    } catch (error) {
        next(error)
    }
})

export default router
