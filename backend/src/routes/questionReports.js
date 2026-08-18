import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import prisma from '../lib/db.js'
import { optionalAuth } from '../middleware/auth.js'
import { reportLimiter } from '../middleware/rateLimiter.js'

const router = Router()

const REPORT_REASONS = new Set([
    'incorrect_answer',
    'unclear_question',
    'typo_or_formatting',
    'out_of_date',
    'other',
])

function cleanContext(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const allowed = ['surface', 'route', 'trackSlug', 'topicId', 'selectedAnswerIndex', 'answered']
    const context = {}
    for (const key of allowed) {
        if (value[key] === undefined || value[key] === null) continue
        if (typeof value[key] === 'string') context[key] = value[key].slice(0, 200)
        else if (typeof value[key] === 'number' || typeof value[key] === 'boolean') context[key] = value[key]
    }
    return Object.keys(context).length ? context : null
}

// Learners can flag a published question without an account. The report is
// deliberately separate from attempts: it never changes scoring or visibility.
router.post('/', optionalAuth, reportLimiter, async (req, res, next) => {
    try {
        const { questionId, reason, details, context } = req.body || {}

        if (!questionId || typeof questionId !== 'string') {
            return res.status(400).json({ error: 'questionId is required' })
        }
        if (!REPORT_REASONS.has(reason)) {
            return res.status(400).json({ error: 'Choose a valid report reason' })
        }
        if (details !== undefined && details !== null && (typeof details !== 'string' || details.length > 2000)) {
            return res.status(400).json({ error: 'Details must be 2,000 characters or fewer' })
        }

        const question = await prisma.question.findFirst({
            where: { id: questionId, isPublished: true },
            select: { id: true },
        })
        if (!question) return res.status(404).json({ error: 'Question not found' })

        // Avoid repeated submissions from a signed-in learner for the same
        // question and reason during the seven-day moderation window. A
        // different reason is still accepted as a separate signal.
        if (req.user) {
            const recent = await prisma.questionReport.findFirst({
                where: {
                    questionId,
                    userId: req.user.id,
                    reason,
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                },
                select: { id: true },
            })
            if (recent) return res.json({ ok: true, alreadyReported: true })
        }

        // JSON.stringify(null) is the 4-char string "null", which would make
        // the nullable column never satisfy `context IS NULL`.
        const cleanedContext = cleanContext(context)

        const report = await prisma.questionReport.create({
            data: {
                id: randomUUID(),
                questionId,
                userId: req.user?.id || null,
                reason,
                details: typeof details === 'string' ? details.trim().slice(0, 2000) || null : null,
                context: cleanedContext ? JSON.stringify(cleanedContext) : null,
            },
            select: { id: true, status: true },
        })

        res.status(201).json({ ok: true, reportId: report.id, status: report.status })
    } catch (error) {
        next(error)
    }
})

export { REPORT_REASONS }
export default router
