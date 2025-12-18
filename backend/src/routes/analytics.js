import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/analytics/overview
 * Get overall user stats (accuracy, questions answered, time spent)
 */
router.get('/analytics/overview', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id

        const totalQuestions = await prisma.attempt.count({ where: { userId } })
        const correctAnswers = await prisma.attempt.count({ where: { userId, isCorrect: true } })
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

        const timeAgg = await prisma.attempt.aggregate({
            where: { userId },
            _sum: { timeSpentSec: true },
        })
        const totalTimeSpent = timeAgg._sum.timeSpentSec || 0

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const questionsLast30Days = await prisma.attempt.count({
            where: { userId, createdAt: { gte: thirtyDaysAgo } },
        })
        const correctLast30Days = await prisma.attempt.count({
            where: { userId, createdAt: { gte: thirtyDaysAgo }, isCorrect: true },
        })
        const accuracyLast30Days = questionsLast30Days > 0
            ? Math.round((correctLast30Days / questionsLast30Days) * 100)
            : 0

        // Get user's XP and streak
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xpTotal: true, currentStreak: true, longestStreak: true }
        })

        // Get enrolled tracks count
        const enrollmentsCount = await prisma.enrollment.count({
            where: { userId }
        })

        res.json({
            totalQuestions,
            correctAnswers,
            accuracy,
            accuracyLast30Days,
            questionsLast30Days,
            totalTimeSpent, // in seconds
            totalTimeSpentFormatted: formatTime(totalTimeSpent),
            xp: user.xpTotal,
            level: Math.floor(user.xpTotal / 100) + 1,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            enrolledTracks: enrollmentsCount
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/analytics/topics
 * Get per-topic performance breakdown
 */
router.get('/analytics/topics', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id

        const rows = await prisma.$queryRaw`
            SELECT
                tp.id AS "id",
                tp.title AS "title",
                tr.title AS "trackTitle",
                COUNT(*)::int AS "total",
                SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS "correct",
                COALESCE(SUM(a.time_spent_sec), 0)::int AS "timeSpent"
            FROM attempts a
            JOIN questions q ON q.id = a.question_id
            JOIN topics tp ON tp.id = q.topic_id
            JOIN tracks tr ON tr.id = tp.track_id
            WHERE a.user_id = ${userId}
            GROUP BY tp.id, tp.title, tr.title;
        `

        const topics = (rows || []).map((t) => ({
            ...t,
            accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
            timeSpentFormatted: formatTime(t.timeSpent),
        }))

        // Sort by accuracy (lowest first for weakness identification)
        topics.sort((a, b) => a.accuracy - b.accuracy)

        res.json({ topics })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/analytics/calendar
 * Get daily activity for streak calendar (GitHub-style)
 */
router.get('/analytics/calendar', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id

        // Get attempts for last 365 days
        const yearAgo = new Date()
        yearAgo.setDate(yearAgo.getDate() - 365)

        const rows = await prisma.$queryRaw`
            SELECT
                DATE(a.created_at) AS "date",
                COUNT(*)::int AS "questions",
                SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS "correct"
            FROM attempts a
            WHERE a.user_id = ${userId} AND a.created_at >= ${yearAgo}
            GROUP BY DATE(a.created_at)
            ORDER BY DATE(a.created_at) ASC;
        `

        const calendar = (rows || []).map((row) => {
            const date = row.date instanceof Date
                ? row.date.toISOString().split('T')[0]
                : String(row.date)

            return {
                date,
                questions: row.questions,
                correct: row.correct,
                accuracy: row.questions > 0 ? Math.round((row.correct / row.questions) * 100) : 0,
            }
        })

        res.json({
            calendar,
            totalDays: calendar.length,
            totalQuestions: calendar.reduce((sum, d) => sum + d.questions, 0)
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/analytics/weaknesses
 * Identify weakest topics with recommendations
 */
router.get('/analytics/weaknesses', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id

        // Get all attempts grouped by topic
        const attempts = await prisma.attempt.findMany({
            where: { userId },
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

        // Group by topic
        const topicStats = {}

        for (const attempt of attempts) {
            const topicId = attempt.question.topic.id

            if (!topicStats[topicId]) {
                topicStats[topicId] = {
                    id: topicId,
                    title: attempt.question.topic.title,
                    trackSlug: attempt.question.topic.track.slug,
                    trackTitle: attempt.question.topic.track.title,
                    total: 0,
                    correct: 0,
                    recentAttempts: []
                }
            }

            topicStats[topicId].total++
            if (attempt.isCorrect) topicStats[topicId].correct++
            topicStats[topicId].recentAttempts.push({
                isCorrect: attempt.isCorrect,
                createdAt: attempt.createdAt
            })
        }

        // Calculate weakness score (lower accuracy = higher priority)
        const topics = Object.values(topicStats)
            .map(t => {
                const accuracy = t.total > 0 ? (t.correct / t.total) * 100 : 0

                // Calculate trend (are they improving?)
                const recent = t.recentAttempts
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                const recentAccuracy = recent.length > 0
                    ? (recent.filter(r => r.isCorrect).length / recent.length) * 100
                    : 0
                const trend = recentAccuracy - accuracy // positive = improving

                return {
                    id: t.id,
                    title: t.title,
                    trackSlug: t.trackSlug,
                    trackTitle: t.trackTitle,
                    total: t.total,
                    correct: t.correct,
                    accuracy: Math.round(accuracy),
                    recentAccuracy: Math.round(recentAccuracy),
                    trend: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
                    priority: accuracy < 50 ? 'high' : accuracy < 70 ? 'medium' : 'low',
                    recommendation: getRecommendation(accuracy, t.total)
                }
            })
            .filter(t => t.total >= 3) // Only include topics with enough data
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5) // Top 5 weaknesses

        res.json({ weaknesses: topics })
    } catch (error) {
        next(error)
    }
})

/**
 * Helper: Format seconds to readable time
 */
function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
}

/**
 * Helper: Get study recommendation based on performance
 */
function getRecommendation(accuracy, total) {
    if (total < 5) {
        return 'Practice more questions to get personalized recommendations.'
    }
    if (accuracy < 30) {
        return 'Start with the basics. Consider reviewing the lesson material first.'
    }
    if (accuracy < 50) {
        return 'Focus on understanding the core concepts. Try hints when stuck.'
    }
    if (accuracy < 70) {
        return 'Good progress! Practice regularly to reinforce your knowledge.'
    }
    return 'You\'re doing well here! Keep practicing to maintain your skills.'
}

export default router
