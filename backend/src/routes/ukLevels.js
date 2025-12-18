import { Router } from 'express'
import prisma from '../lib/db.js'

const router = Router()


/**
 * GET /api/uk-levels
 * List all UK qualification levels
 */
router.get('/uk-levels', async (req, res, next) => {
    try {
        const levels = await prisma.ukLevel.findMany({
            orderBy: { sortOrder: 'asc' },
        })

        res.json(levels.map(l => ({
            id: l.id,
            code: l.code,
            title: l.title,
            order: l.sortOrder,
        })))
    } catch (error) {
        next(error)
    }
})

export default router
