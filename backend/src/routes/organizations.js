import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

function requireAdminOrOrgAdminForParam(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    if (req.user.role === 'admin') return next()
    if (req.user.role === 'org_admin' && req.user.organizationId === req.params.id) return next()
    return res.status(403).json({ error: 'Organization admin required' })
}

/**
 * GET /api/organizations
 * List all organizations (admin only)
 */
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const organizations = await prisma.organization.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { users: true } }
            }
        })
        res.json(organizations)
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/organizations
 * Create a new organization (admin only)
 */
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { slug, name, domain, logoUrl, primaryColor, settings } = req.body

        if (!slug || !name) {
            return res.status(400).json({ error: 'slug and name are required' })
        }

        const org = await prisma.organization.create({
            data: {
                slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                name,
                domain: domain || null,
                logoUrl: logoUrl || null,
                primaryColor: primaryColor || null,
                settings: settings ? JSON.stringify(settings) : null
            }
        })

        res.status(201).json(org)
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Organization slug or domain already exists' })
        }
        next(error)
    }
})

/**
 * GET /api/organizations/branding/:slug
 * Get public branding for org login page
 */
router.get('/branding/:slug', async (req, res, next) => {
    try {
        const org = await prisma.organization.findFirst({
            where: { slug: req.params.slug, isActive: true },
            select: {
                name: true,
                logoUrl: true,
                primaryColor: true
            }
        })

        if (!org) {
            return res.status(404).json({ error: 'Organization not found' })
        }

        res.json(org)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/organizations/:id
 * Get organization details
 */
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.params.id },
            include: {
                _count: { select: { users: true } }
            }
        })

        if (!org) {
            return res.status(404).json({ error: 'Organization not found' })
        }

        // Non-admins can only see their own org
        if (req.user.role !== 'admin' && req.user.organizationId !== org.id) {
            return res.status(403).json({ error: 'Access denied' })
        }

        res.json(org)
    } catch (error) {
        next(error)
    }
})

/**
 * PATCH /api/organizations/:id
 * Update organization (org admin or admin)
 */
router.patch('/:id', requireAuth, requireAdminOrOrgAdminForParam, async (req, res, next) => {
    try {
        const { name, domain, logoUrl, primaryColor, settings, isActive } = req.body

        const org = await prisma.organization.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(domain !== undefined && { domain: domain || null }),
                ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
                ...(primaryColor !== undefined && { primaryColor: primaryColor || null }),
                ...(settings !== undefined && { settings: settings ? JSON.stringify(settings) : null }),
                ...(isActive !== undefined && { isActive })
            }
        })

        res.json(org)
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/organizations/:id/users
 * List users in organization
 */
router.get('/:id/users', requireAuth, requireAdminOrOrgAdminForParam, async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query
        const skip = (parseInt(page) - 1) * parseInt(limit)

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: { organizationId: req.params.id },
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    xpTotal: true
                }
            }),
            prisma.user.count({ where: { organizationId: req.params.id } })
        ])

        res.json({
            users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/organizations/:id/users
 * Add user to organization
 */
router.post('/:id/users', requireAuth, requireAdminOrOrgAdminForParam, async (req, res, next) => {
    try {
        const { email, role = 'user' } = req.body

        const user = await prisma.user.update({
            where: { email },
            data: {
                organizationId: req.params.id,
                role: role === 'org_admin' ? 'org_admin' : 'user'
            }
        })

        res.json({ message: 'User added to organization', userId: user.id })
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' })
        }
        next(error)
    }
})

export default router
