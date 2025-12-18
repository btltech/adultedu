import { Router } from 'express'
import prisma from '../lib/db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { awardXP, XP_CORRECT_ANSWER } from './gamification.js'
import { parseSourceMeta, scoreQuestionAnswer } from '../lib/scoring.js'

const router = Router()



// REWRITE: Explicit practice route test
// GET practice questions for a topic
router.get('/practice/:topicId', requireAuth, async (req, res, next) => {
    try {
        const { topicId } = req.params
        const { limit = 10 } = req.query

        const questions = await prisma.question.findMany({
            where: {
                topicId,
                isPublished: true,
            },
            take: Number(limit),
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                type: true,
                prompt: true,
                options: true,
                difficulty: true,
                tags: true,
                imageUrl: true,
                assets: true,
                sourceMeta: true,
                ukLevel: {
                    select: { code: true }
                }
            },
        })

        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: { track: true, ukLevel: true },
        })

        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' })
        }

        // Auto-enroll user if not already enrolled (unless admin)
        if (req.user.role !== 'admin') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_trackId: {
                        userId: req.user.id,
                        trackId: topic.trackId
                    }
                }
            })
            if (!enrollment) {
                // Auto-enroll the user in this track
                await prisma.enrollment.create({
                    data: {
                        userId: req.user.id,
                        trackId: topic.trackId,
                    }
                })
            }
        }

        const formattedQuestions = questions.map(q => {
            let options = null
            let meta = {}
            try {
                options = q.options ? JSON.parse(q.options) : null
            } catch (e) {
                options = null
            }
            try {
                meta = q.sourceMeta ? JSON.parse(q.sourceMeta) : {}
            } catch (e) {
                meta = {}
            }

            // Safe access for ukLevel
            let levelCode = 'L1';
            if (q.ukLevel && q.ukLevel.code) {
                levelCode = q.ukLevel.code;
            } else if (topic.ukLevel && topic.ukLevel.code) {
                levelCode = topic.ukLevel.code;
            }

            return {
                id: q.id,
                type: q.type,
                prompt: q.prompt,
                difficulty: q.difficulty,
                tags: q.tags,
                imageUrl: q.imageUrl,
                assets: q.assets,
                options,
                ukLevel: levelCode,
                hints: meta.hints || [],
                solutionSteps: meta.solutionSteps || []
            }
        })

        res.json({
            topic: {
                id: topic.id,
                title: topic.title,
                ukLevel: topic.ukLevel?.code,
            },
            track: {
                slug: topic.track.slug,
                title: topic.track.title,
            },
            questions: formattedQuestions,
            total: formattedQuestions.length,
        })
    } catch (error) {
        next(error)
    }
})


/**
 * GET /api/lessons/:id
 * Get lesson content
 */
router.get('/lessons/:id', optionalAuth, async (req, res, next) => {
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: req.params.id },
            include: {
                topic: {
                    include: {
                        track: {
                            select: { id: true, slug: true, title: true },
                        },
                        ukLevel: true,
                    },
                },
            },
        })

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' })
        }

        if (!lesson.isPublished && (!req.user || req.user.role !== 'admin')) {
            return res.status(404).json({ error: 'Lesson not found' })
        }

        // Parse content blocks
        let contentBlocks = []
        try {
            contentBlocks = JSON.parse(lesson.contentBlocks || '[]')
        } catch (e) {
            contentBlocks = []
        }

        res.json({
            id: lesson.id,
            title: lesson.title,
            summary: lesson.summary,
            contentBlocks,
            estMinutes: lesson.estMinutes,
            topic: {
                id: lesson.topic.id,
                title: lesson.topic.title,
                ukLevel: lesson.topic.ukLevel.code,
            },
            track: {
                id: lesson.topic.track.id,
                slug: lesson.topic.track.slug,
                title: lesson.topic.track.title,
            },
        })
    } catch (error) {
        next(error)
    }
})



/**
 * POST /api/practice/submit
 * Submit an answer and get feedback
 */
router.post('/practice/submit', requireAuth, async (req, res, next) => {
    try {
        const { questionId, answer, timeSpentSec } = req.body

        if (!questionId || answer === undefined) {
            return res.status(400).json({ error: 'questionId and answer are required' })
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: {
                topic: {
                    select: {
                        trackId: true
                    }
                }
            }
        })

        if (!question) {
            return res.status(404).json({ error: 'Question not found' })
        }

        // Auto-enroll user if not already enrolled (unless admin)
        if (req.user.role !== 'admin') {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_trackId: {
                        userId: req.user.id,
                        trackId: question.topic.trackId
                    }
                }
            })
            if (!enrollment) {
                // Auto-enroll the user in this track
                await prisma.enrollment.create({
                    data: {
                        userId: req.user.id,
                        trackId: question.topic.trackId,
                    }
                })
            }
        }

        const scored = scoreQuestionAnswer({ question, userAnswer: answer })
        if (!scored.ok) {
            return res.status(500).json({ error: 'Question scoring failed', reason: scored.reason || 'unknown' })
        }

        const isCorrect = !!scored.isCorrect
        const correctAnswerForClient = scored.correctAnswer

        // Check if this is user's first attempt on this question
        let isFirstTry = true
        let xpResult = null

        // Record attempt if user is logged in
        if (req.user) {
            // Check for previous attempts
            const previousAttempts = await prisma.attempt.count({
                where: {
                    userId: req.user.id,
                    questionId,
                }
            })
            isFirstTry = previousAttempts === 0

            await prisma.attempt.create({
                data: {
                    userId: req.user.id,
                    questionId,
                    isCorrect,
                    userAnswer: JSON.stringify(answer),
                    timeSpentSec: timeSpentSec || null,
                },
            })

            // Award XP for correct answers
            if (isCorrect) {
                xpResult = await awardXP(req.user.id, XP_CORRECT_ANSWER, isFirstTry)
            } else {
                // Add incorrect answers to review queue for spaced repetition
                const reviewEligible = (() => {
                    const type = String(question.type || '')
                    if (['mcq', 'true_false', 'scenario'].includes(type)) return true
                    // Multi-step MCQ-style questions (no assets) can be reviewed as normal MCQ.
                    if (type === 'multi_step' && !question.assets && question.options) return true
                    return false
                })()

                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)

                if (reviewEligible) {
                    await prisma.reviewItem.upsert({
                        where: {
                            userId_questionId: {
                                userId: req.user.id,
                                questionId,
                            }
                        },
                        update: {
                            // Reset if already exists
                            dueDate: tomorrow,
                            easeFactor: 2.5,
                            interval: 1,
                            repetitions: 0,
                        },
                        create: {
                            userId: req.user.id,
                            questionId,
                            dueDate: tomorrow,
                            easeFactor: 2.5,
                            interval: 1,
                            repetitions: 0,
                        }
                    })
                }
            }
        }

        const meta = parseSourceMeta(question.sourceMeta)

        res.json({
            isCorrect,
            correctAnswer: correctAnswerForClient,
            explanation: question.explanation,
            solutionSteps: meta.solutionSteps || [],
            xp: xpResult, // Include XP info if awarded
        })
    } catch (error) {
        next(error)
    }
})

export default router
