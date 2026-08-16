import { Router } from 'express'
import prisma from '../lib/db.js'
import logger from '../lib/logger.js'
import { requireAuth } from '../middleware/auth.js'
import { awardXP, XP_CORRECT_ANSWER } from './gamification.js'

const router = Router()

/**
 * Achievement types and their unlock conditions
 */
const ACHIEVEMENT_TYPES = {
    first_correct: {
        name: 'First Steps',
        description: 'Answer your first question correctly',
        icon: '🎯'
    },
    first_perfect: {
        name: 'Perfect Score',
        description: 'Get 100% on a practice session',
        icon: '⭐'
    },
    streak_3: {
        name: 'Getting Warm',
        description: 'Maintain a 3-day streak',
        icon: '🔥'
    },
    streak_7: {
        name: 'On Fire',
        description: 'Maintain a 7-day streak',
        icon: '🔥🔥'
    },
    streak_30: {
        name: 'Unstoppable',
        description: 'Maintain a 30-day streak',
        icon: '🏆'
    },
    speed_demon: {
        name: 'Speed Demon',
        description: 'Answer 10 questions correctly in under 5 minutes',
        icon: '⚡'
    },
    night_owl: {
        name: 'Night Owl',
        description: 'Study after midnight',
        icon: '🦉'
    },
    early_bird: {
        name: 'Early Bird',
        description: 'Study before 7 AM',
        icon: '🐦'
    },
    topic_master: {
        name: 'Topic Master',
        description: 'Master a topic with 90%+ accuracy',
        icon: '🎓'
    },
    century: {
        name: 'Century',
        description: 'Answer 100 questions correctly',
        icon: '💯'
    },
    daily_warrior: {
        name: 'Daily Warrior',
        description: 'Complete 7 daily challenges in a row',
        icon: '⚔️'
    },
    xp_500: {
        name: 'Rising Star',
        description: 'Earn 500 XP',
        icon: '✨'
    },
    xp_1000: {
        name: 'Shining Star',
        description: 'Earn 1000 XP',
        icon: '🌟'
    },
    xp_5000: {
        name: 'Superstar',
        description: 'Earn 5000 XP',
        icon: '💫'
    },
}

/**
 * GET /api/gamification/achievements
 * Get user's earned achievements and all available achievements
 */
router.get('/gamification/achievements', requireAuth, async (req, res, next) => {
    try {
        const earned = await prisma.achievement.findMany({
            where: { userId: req.user.id },
            orderBy: { earnedAt: 'desc' }
        })

        const earnedTypes = new Set(earned.map(a => a.type))

        const all = Object.entries(ACHIEVEMENT_TYPES).map(([type, info]) => ({
            type,
            ...info,
            earned: earnedTypes.has(type),
            earnedAt: earned.find(a => a.type === type)?.earnedAt || null
        }))

        res.json({
            earned: earned.length,
            total: Object.keys(ACHIEVEMENT_TYPES).length,
            achievements: all
        })
    } catch (error) {
        next(error)
    }
})

/**
 * GET /api/gamification/leaderboard
 * Get weekly/monthly leaderboard
 */
router.get('/gamification/leaderboard', requireAuth, async (req, res, next) => {
    try {
        const period = req.query.period || 'weekly' // weekly or monthly

        // Calculate date range
        const now = new Date()
        let startDate = new Date()

        if (period === 'weekly') {
            startDate.setDate(now.getDate() - 7)
        } else {
            startDate.setDate(now.getDate() - 30)
        }

        // Get top users by XP and current user data in parallel
        const [topUsers, currentUser] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                    xpTotal: true,
                    currentStreak: true,
                },
                orderBy: { xpTotal: 'desc' },
                take: 10
            }),
            prisma.user.findUnique({
                where: { id: req.user.id },
                select: { xpTotal: true, currentStreak: true }
            })
        ])

        // Count users with more XP for an efficient rank lookup (no full table scan)
        const currentUserRank = await prisma.user.count({
            where: { xpTotal: { gt: currentUser?.xpTotal ?? 0 } }
        }) + 1

        // Calculate levels
        const leaderboard = topUsers.map((user, index) => ({
            rank: index + 1,
            displayName: user.displayName || user.email.split('@')[0],
            xp: user.xpTotal,
            level: Math.floor(user.xpTotal / 100) + 1,
            streak: user.currentStreak,
            isCurrentUser: user.id === req.user.id
        }))

        res.json({
            period,
            leaderboard,
            currentUser: {
                rank: currentUserRank,
                xp: currentUser.xpTotal,
                level: Math.floor(currentUser.xpTotal / 100) + 1,
                streak: currentUser.currentStreak
            }
        })
    } catch (error) {
        next(error)
    }
})

/**
 * Award achievement to user (internal function)
 */
export async function awardAchievement(userId, type, metadata = null) {
    try {
        // Check if user already has this achievement
        const existing = await prisma.achievement.findUnique({
            where: { userId_type: { userId, type } }
        })

        if (existing) return null // Already earned

        const achievement = await prisma.achievement.create({
            data: {
                userId,
                type,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        })

        return {
            ...ACHIEVEMENT_TYPES[type],
            type,
            earnedAt: achievement.earnedAt
        }
    } catch (error) {
        logger.error('Failed to award achievement', {
            userId,
            type,
            error: error.message,
            stack: error.stack,
        })
        return null
    }
}

/**
 * Check and award achievements based on user activity
 */
export async function checkAchievements(userId) {
    const awarded = []

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            xpTotal: true,
            currentStreak: true,
            dailyChallengeStreak: true,
            _count: {
                select: {
                    attempts: true
                }
            }
        }
    })

    // Count correct attempts
    const correctAttempts = await prisma.attempt.count({
        where: { userId, isCorrect: true }
    })

    // First correct answer
    if (correctAttempts >= 1) {
        const a = await awardAchievement(userId, 'first_correct')
        if (a) awarded.push(a)
    }

    // Century - 100 correct answers
    if (correctAttempts >= 100) {
        const a = await awardAchievement(userId, 'century')
        if (a) awarded.push(a)
    }

    // Streak achievements
    if (user.currentStreak >= 3) {
        const a = await awardAchievement(userId, 'streak_3')
        if (a) awarded.push(a)
    }
    if (user.currentStreak >= 7) {
        const a = await awardAchievement(userId, 'streak_7')
        if (a) awarded.push(a)
    }
    if (user.currentStreak >= 30) {
        const a = await awardAchievement(userId, 'streak_30')
        if (a) awarded.push(a)
    }

    // Daily challenge streak
    if (user.dailyChallengeStreak >= 7) {
        const a = await awardAchievement(userId, 'daily_warrior')
        if (a) awarded.push(a)
    }

    // XP milestones
    if (user.xpTotal >= 500) {
        const a = await awardAchievement(userId, 'xp_500')
        if (a) awarded.push(a)
    }
    if (user.xpTotal >= 1000) {
        const a = await awardAchievement(userId, 'xp_1000')
        if (a) awarded.push(a)
    }
    if (user.xpTotal >= 5000) {
        const a = await awardAchievement(userId, 'xp_5000')
        if (a) awarded.push(a)
    }

    // Time-based achievements
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 5) {
        const a = await awardAchievement(userId, 'night_owl')
        if (a) awarded.push(a)
    }
    if (hour >= 5 && hour < 7) {
        const a = await awardAchievement(userId, 'early_bird')
        if (a) awarded.push(a)
    }

    return awarded
}

export { ACHIEVEMENT_TYPES }
export default router
