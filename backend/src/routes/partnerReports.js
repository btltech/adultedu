import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { buildPartnerOverview } from '../lib/partnerReports.js'

const router = Router()

router.use(requireAuth)
router.use(requireAdmin)

/**
 * GET /api/admin/partners/overview
 * Lightweight partner delivery and evidence summary.
 */
router.get('/overview', async (req, res, next) => {
    try {
        const overview = await buildPartnerOverview(prisma, {
            search: String(req.query.search || '').trim(),
            organizationTag: String(req.query.organizationTag || '').trim(),
            cohortTag: String(req.query.cohortTag || '').trim(),
            referralSource: String(req.query.referralSource || '').trim(),
        })

        res.json(overview)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/admin/partners/export
 * CSV export of partner learner evidence rows.
 */
router.get('/export', async (req, res, next) => {
    try {
        const overview = await buildPartnerOverview(prisma, {
            search: String(req.query.search || '').trim(),
            organizationTag: String(req.query.organizationTag || '').trim(),
            cohortTag: String(req.query.cohortTag || '').trim(),
            referralSource: String(req.query.referralSource || '').trim(),
        })

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename="adultedu-partner-evidence.csv"')
        res.status(200).send(overview.csv)
    } catch (error) {
        next(error)
    }
})

export default router