import prisma from '../lib/db.js'

/**
 * Middleware to resolve organization from request
 * Checks: subdomain, domain header, or user's organization
 */
export async function resolveOrganization(req, res, next) {
    try {
        let org = null

        // 1. Check X-Organization header (for API clients)
        const orgSlug = req.headers['x-organization']
        if (orgSlug) {
            org = await prisma.organization.findFirst({
                where: { slug: orgSlug, isActive: true },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    logoUrl: true,
                    primaryColor: true,
                    settings: true
                }
            })
        }

        // 2. Check user's organization
        if (!org && req.user?.organizationId) {
            org = await prisma.organization.findFirst({
                where: { id: req.user.organizationId, isActive: true },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    logoUrl: true,
                    primaryColor: true,
                    settings: true
                }
            })
        }

        // 3. Parse settings if JSON
        if (org?.settings) {
            try {
                org.settings = JSON.parse(org.settings)
            } catch {
                org.settings = {}
            }
        }

        req.organization = org
        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Middleware to require organization context
 */
export function requireOrganization(req, res, next) {
    if (!req.organization) {
        return res.status(400).json({ error: 'Organization context required' })
    }
    next()
}

/**
 * Middleware to require org admin role
 */
export function requireOrgAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    if (req.user.role !== 'admin' && req.user.role !== 'org_admin') {
        return res.status(403).json({ error: 'Organization admin required' })
    }
    if (req.user.role === 'org_admin' && req.user.organizationId !== req.organization?.id) {
        return res.status(403).json({ error: 'Not authorized for this organization' })
    }
    next()
}
