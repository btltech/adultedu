import { Router } from 'express'
import PDFDocument from 'pdfkit'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/certificates/:id.pdf', requireAuth, async (req, res, next) => {
    try {
        const { id } = req.params
        const cert = await prisma.certificate.findUnique({
            where: { id },
            include: {
                user: true,
                track: true
            }
        })

        if (!cert) {
            return res.status(404).json({ error: 'Certificate not found' })
        }

        if (cert.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' })
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename="${cert.track.slug}-certificate.pdf"`)

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50
        })

        doc.pipe(res)

        doc.fontSize(22).text('Certificate of Mastery', { align: 'center' })
        doc.moveDown()
        doc.fontSize(16).text(`Awarded to: ${cert.user.email}`, { align: 'center' })
        doc.moveDown(0.5)
        doc.fontSize(14).text(cert.title, { align: 'center' })
        doc.moveDown()
        doc.fontSize(12).text(cert.description || `Completed all topics in ${cert.track.title}`, { align: 'center' })
        doc.moveDown()
        doc.text(`Track: ${cert.track.title}`, { align: 'center' })
        doc.text(`Awarded on: ${new Date(cert.awardedAt).toLocaleDateString()}`, { align: 'center' })

        doc.end()
    } catch (error) {
        next(error)
    }
})

export default router
