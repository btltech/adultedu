import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import { awardXP, XP_CORRECT_ANSWER } from './gamification.js'
import { checkAchievements } from './achievements.js'

const router = Router()

// XP multiplier for daily challenge
const DAILY_XP_MULTIPLIER = 2.0

/**
 * Helper to get today's date at midnight (UTC)
 */
function getTodayDate() {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * Helper to get time until next challenge (midnight UTC)
 */
function getTimeUntilNextChallenge() {
    const now = new Date()
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
    return tomorrow - now // milliseconds
}

/**
 * GET /api/daily/challenge
 * Get today's daily challenge
 */
router.get('/daily/challenge', requireAuth, async (req, res, next) => {
    try {
        const today = getTodayDate()

        // Try to find existing challenge for today
        let challenge = await prisma.dailyChallenge.findUnique({
            where: { date: today },
            include: {
                question: {
                    include: {
                        topic: {
                            include: { track: true }
                        }
                    }
                }
            }
        })

        // If no challenge exists for today, create one
        if (!challenge) {
            // Select a random published, option-based question (compatible with the daily challenge UI)
            const rows = await prisma.$queryRaw`
                SELECT id
                FROM questions
                WHERE is_published = true
                  AND type IN ('mcq', 'true_false', 'scenario')
                  AND options IS NOT NULL
                ORDER BY RANDOM()
                LIMIT 1;
            `

            const randomId = rows?.[0]?.id
            if (!randomId) {
                return res.status(404).json({ error: 'No questions available for daily challenge' })
            }

            challenge = await prisma.dailyChallenge.create({
                data: {
                    date: today,
                    questionId: randomId,
                    xpMultiplier: DAILY_XP_MULTIPLIER
                },
                include: {
                    question: {
                        include: {
                            topic: {
                                include: { track: true }
                            }
                        }
                    }
                }
            })
        }

        // Check if user has already attempted today's challenge
        const attempt = await prisma.dailyChallengeAttempt.findUnique({
            where: {
                userId_dailyChallengeId: {
                    userId: req.user.id,
                    dailyChallengeId: challenge.id
                }
            }
        })

        // Parse question options
        let options = []
        try {
            options = JSON.parse(challenge.question.options || '[]')
        } catch (e) {
            options = []
        }

        res.json({
            id: challenge.id,
            date: challenge.date,
            xpMultiplier: challenge.xpMultiplier,
            question: {
                id: challenge.question.id,
                type: challenge.question.type,
                prompt: challenge.question.prompt,
                options,
                difficulty: challenge.question.difficulty,
                imageUrl: challenge.question.imageUrl,
                topic: challenge.question.topic.title,
                track: challenge.question.topic.track.title
            },
            completed: attempt?.completed || false,
            isCorrect: attempt?.isCorrect || null,
            xpEarned: attempt?.xpEarned || 0,
            timeUntilNext: getTimeUntilNextChallenge()
        })
    } catch (error) {
        next(error)
    }
})

/**
 * POST /api/daily/submit
 * Submit answer for today's daily challenge
 */
router.post('/daily/submit', requireAuth, async (req, res, next) => {
    try {
        const { answer } = req.body
        const today = getTodayDate()

        // Get today's challenge
        const challenge = await prisma.dailyChallenge.findUnique({
            where: { date: today },
            include: { question: true }
        })

        if (!challenge) {
            return res.status(404).json({ error: 'No daily challenge found for today' })
        }

        // Check if already attempted
        const existingAttempt = await prisma.dailyChallengeAttempt.findUnique({
            where: {
                userId_dailyChallengeId: {
                    userId: req.user.id,
                    dailyChallengeId: challenge.id
                }
            }
        })

        if (existingAttempt) {
            return res.status(400).json({
                error: 'Already completed today\'s challenge',
                isCorrect: existingAttempt.isCorrect,
                xpEarned: existingAttempt.xpEarned
            })
        }

        // Check answer
        let correctAnswer
        try {
            correctAnswer = JSON.parse(challenge.question.answer)
        } catch (e) {
            correctAnswer = challenge.question.answer
        }

        // Resolve index to option text if needed (prefer literal option match first)
        let options = []
        try {
            options = JSON.parse(challenge.question.options || '[]')
        } catch {
            options = []
        }
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

        const isCorrect = String(answer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase()

        // Calculate XP
        let xpEarned = 0
        let xpResult = null

        if (isCorrect) {
            xpResult = await awardXP(req.user.id, Math.round(XP_CORRECT_ANSWER * challenge.xpMultiplier), true)
            xpEarned = xpResult.xpAwarded
        }

        // Update daily challenge streak
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { dailyChallengeStreak: true }
        })

        // Check if user completed yesterday's challenge
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const yesterdayChallenge = await prisma.dailyChallenge.findUnique({
            where: { date: yesterday },
            include: {
                attempts: {
                    where: { userId: req.user.id, completed: true }
                }
            }
        })

        let newDailyStreak = 1
        if (yesterdayChallenge?.attempts.length > 0) {
            newDailyStreak = user.dailyChallengeStreak + 1
        }

        // Create attempt and update streak
        await prisma.$transaction([
            prisma.dailyChallengeAttempt.create({
                data: {
                    userId: req.user.id,
                    dailyChallengeId: challenge.id,
                    completed: true,
                    isCorrect,
                    xpEarned
                }
            }),
            prisma.user.update({
                where: { id: req.user.id },
                data: { dailyChallengeStreak: newDailyStreak }
            })
        ])

        // Check for new achievements
        const newAchievements = await checkAchievements(req.user.id)

        res.json({
            isCorrect,
            correctAnswer,
            explanation: challenge.question.explanation,
            xpEarned,
            xpMultiplier: challenge.xpMultiplier,
            dailyStreak: newDailyStreak,
            newAchievements,
            xp: xpResult
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/daily/streak
 * Get user's daily challenge streak info
 */
router.get('/daily/streak', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { dailyChallengeStreak: true }
        })

        // Get recent challenge history (last 7 days)
        const today = getTodayDate()
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const recentAttempts = await prisma.dailyChallengeAttempt.findMany({
            where: {
                userId: req.user.id,
                createdAt: { gte: weekAgo }
            },
            include: {
                dailyChallenge: {
                    select: { date: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const history = recentAttempts.map(a => ({
            date: a.dailyChallenge.date,
            completed: a.completed,
            isCorrect: a.isCorrect,
            xpEarned: a.xpEarned
        }))

        res.json({
            currentStreak: user.dailyChallengeStreak,
            history
        })
    } catch (error) {
        next(error)
    }
})

export default router
