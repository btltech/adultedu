import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * SM-2 Algorithm Implementation
 * Quality ratings: 0=complete blackout, 1=wrong, 2=wrong but remembered, 3=correct with difficulty, 4=correct, 5=perfect
 */
function calculateSM2(quality, repetitions, easeFactor, interval) {
    let newEaseFactor = easeFactor
    let newInterval = interval
    let newRepetitions = repetitions

    if (quality >= 3) {
        // Correct response
        if (repetitions === 0) {
            newInterval = 1
        } else if (repetitions === 1) {
            newInterval = 6
        } else {
            newInterval = Math.round(interval * easeFactor)
        }
        newRepetitions = repetitions + 1
    } else {
        // Incorrect response - reset
        newRepetitions = 0
        newInterval = 1
    }

    // Update ease factor
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    // Ensure ease factor doesn't go below 1.3
    if (newEaseFactor < 1.3) newEaseFactor = 1.3

    return {
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
    }
}

/**
 * GET /api/review/due
 * Get questions due for review
 */
router.get('/review/due', requireAuth, async (req, res, next) => {
    try {
        const { limit = 10 } = req.query
        const now = new Date()

        // Get items due for review
        const dueItems = await prisma.reviewItem.findMany({
            where: {
                userId: req.user.id,
                dueDate: { lte: now },
                question: {
                    OR: [
                        {
                            type: { in: ['mcq', 'true_false', 'scenario'] },
                            options: { not: null },
                        },
                        {
                            type: 'multi_step',
                            options: { not: null },
                            assets: null,
                        }
                    ]
                }
            },
            include: {
                question: {
                    include: {
                        topic: { include: { track: true } },
                        ukLevel: true,
                    }
                }
            },
            orderBy: { dueDate: 'asc' },
            take: Number(limit)
        })

        // Format for frontend
        const questions = dueItems.map(item => {
            let options = []
            try {
                options = JSON.parse(item.question.options || '[]')
            } catch { options = [] }

            let meta = {}
            try {
                meta = JSON.parse(item.question.sourceMeta || '{}')
            } catch { meta = {} }

            return {
                reviewItemId: item.id,
                id: item.question.id,
                prompt: item.question.prompt,
                options,
                type: item.question.type,
                ukLevel: item.question.ukLevel?.code || 'L1',
                hints: meta.hints || [],
                topic: {
                    id: item.question.topic.id,
                    title: item.question.topic.title,
                },
                track: {
                    slug: item.question.topic.track.slug,
                    title: item.question.topic.track.title,
                },
                daysOverdue: Math.floor((now - item.dueDate) / (1000 * 60 * 60 * 24)),
                repetitions: item.repetitions,
            }
        })

        res.json({
            dueCount: questions.length,
            questions,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/review/stats
 * Get review statistics
 */
router.get('/review/stats', requireAuth, async (req, res, next) => {
    try {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        const weekFromNow = new Date(now)
        weekFromNow.setDate(weekFromNow.getDate() + 7)

        // Count due today
        const dueNow = await prisma.reviewItem.count({
            where: {
                userId: req.user.id,
                dueDate: { lte: now }
            }
        })

        // Count due this week (excluding today)
        const dueThisWeek = await prisma.reviewItem.count({
            where: {
                userId: req.user.id,
                dueDate: { gt: now, lte: weekFromNow }
            }
        })

        // Total in review queue
        const totalInQueue = await prisma.reviewItem.count({
            where: { userId: req.user.id }
        })

        // Questions reviewed today
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const reviewedToday = await prisma.reviewItem.count({
            where: {
                userId: req.user.id,
                lastReviewed: { gte: todayStart }
            }
        })

        res.json({
            dueNow,
            dueThisWeek,
            totalInQueue,
            reviewedToday,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/review/submit
 * Submit a review answer and update schedule
 */
router.post('/review/submit', requireAuth, async (req, res, next) => {
    try {
        const { reviewItemId, answer, quality } = req.body
        // quality: 0-5 (0=blackout, 5=perfect recall)

        if (!reviewItemId || answer === undefined || quality === undefined) {
            return res.status(400).json({ error: 'reviewItemId, answer, and quality are required' })
        }

        // Get the review item
        const reviewItem = await prisma.reviewItem.findUnique({
            where: { id: reviewItemId },
            include: { question: true }
        })

        if (!reviewItem || reviewItem.userId !== req.user.id) {
            return res.status(404).json({ error: 'Review item not found' })
        }

        // Check if answer is correct
        let correctAnswer
        try {
            correctAnswer = JSON.parse(reviewItem.question.answer)
        } catch {
            correctAnswer = reviewItem.question.answer
        }

        let options = []
        try {
            options = JSON.parse(reviewItem.question.options || '[]')
        } catch { options = [] }

        // Resolve index to value if needed (prefer literal option match first)
        if (Array.isArray(options) && options.length > 0) {
            if (typeof correctAnswer === 'number' && Number.isInteger(correctAnswer) && options[correctAnswer]) {
                correctAnswer = options[correctAnswer]
            } else if (typeof correctAnswer === 'string') {
                const trimmed = correctAnswer.trim()
                const literalMatch = options.find((o) => String(o).trim() === trimmed)
                if (literalMatch !== undefined) {
                    correctAnswer = literalMatch
                } else if (/^\d+$/.test(trimmed)) {
                    const idx = parseInt(trimmed, 10)
                    if (idx >= 0 && idx < options.length && options[idx] !== undefined) {
                        correctAnswer = options[idx]
                    }
                }
            }
        }

        const isCorrect = String(answer).toLowerCase().trim() ===
            String(correctAnswer).toLowerCase().trim()

        // Calculate new schedule using SM-2
        const { easeFactor, interval, repetitions } = calculateSM2(
            quality,
            reviewItem.repetitions,
            reviewItem.easeFactor,
            reviewItem.interval
        )

        // Calculate next due date
        const nextDueDate = new Date()
        nextDueDate.setDate(nextDueDate.getDate() + interval)

        // Update the review item
        await prisma.reviewItem.update({
            where: { id: reviewItemId },
            data: {
                easeFactor,
                interval,
                repetitions,
                dueDate: nextDueDate,
                lastReviewed: new Date(),
            }
        })

        // Record attempt
        await prisma.attempt.create({
            data: {
                userId: req.user.id,
                questionId: reviewItem.questionId,
                isCorrect,
                userAnswer: JSON.stringify(answer),
            }
        })

        res.json({
            isCorrect,
            correctAnswer,
            explanation: reviewItem.question.explanation,
            nextReviewIn: interval,
            repetitions,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/review/add
 * Add a question to review queue (called when user gets question wrong)
 */
router.post('/review/add', requireAuth, async (req, res, next) => {
    try {
        const { questionId } = req.body

        if (!questionId) {
            return res.status(400).json({ error: 'questionId is required' })
        }

        // Check if already in queue
        const existing = await prisma.reviewItem.findUnique({
            where: {
                userId_questionId: {
                    userId: req.user.id,
                    questionId,
                }
            }
        })

        if (existing) {
            return res.json({ message: 'Already in review queue', reviewItemId: existing.id })
        }

        // Add to queue - due immediately for first review
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        const reviewItem = await prisma.reviewItem.create({
            data: {
                userId: req.user.id,
                questionId,
                dueDate: tomorrow,
                easeFactor: 2.5,
                interval: 1,
                repetitions: 0,
            }
        })

        res.json({
            message: 'Added to review queue',
            reviewItemId: reviewItem.id,
            dueDate: reviewItem.dueDate,
        })
    } catch (error) {
        next(error)
    }
})

export default router
