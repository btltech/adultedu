import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// XP values
const XP_CORRECT_ANSWER = 10
const XP_STREAK_BONUS = 5 // Per day in streak
const XP_FIRST_TRY_BONUS = 5

/**
 * GET /api/gamification/stats
 * Get current user's gamification stats
 */
router.get('/gamification/stats', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                xpTotal: true,
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            }
        })

        // Calculate level from XP (every 100 XP = 1 level)
        const level = Math.floor(user.xpTotal / 100) + 1
        const xpInCurrentLevel = user.xpTotal % 100
        const xpForNextLevel = 100

        res.json({
            xp: user.xpTotal,
            level,
            xpInCurrentLevel,
            xpForNextLevel,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            lastActiveDate: user.lastActiveDate,
        })
    } catch (error) {
        next(error)
    }
})

/**
 * Award XP to user and update streak
 * Called internally after correct answer
 */
export async function awardXP(userId, baseXP, isFirstTry = false) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            xpTotal: true,
            currentStreak: true,
            longestStreak: true,
            lastActiveDate: true,
        }
    })

    let newStreak = user.currentStreak
    let newLongestStreak = user.longestStreak
    let streakBonus = 0

    if (user.lastActiveDate) {
        const lastActive = new Date(user.lastActiveDate)
        lastActive.setHours(0, 0, 0, 0)

        const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            // Same day, streak continues
            streakBonus = newStreak * XP_STREAK_BONUS
        } else if (diffDays === 1) {
            // Next day, increment streak
            newStreak += 1
            streakBonus = newStreak * XP_STREAK_BONUS
            if (newStreak > newLongestStreak) {
                newLongestStreak = newStreak
            }
        } else {
            // Streak broken
            newStreak = 1
        }
    } else {
        // First activity
        newStreak = 1
    }

    const firstTryBonus = isFirstTry ? XP_FIRST_TRY_BONUS : 0
    const totalXP = baseXP + streakBonus + firstTryBonus

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            xpTotal: { increment: totalXP },
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastActiveDate: today,
        },
        select: {
            xpTotal: true,
            currentStreak: true,
        }
    })

    return {
        xpAwarded: totalXP,
        breakdown: {
            base: baseXP,
            streakBonus,
            firstTryBonus,
        },
        newTotal: updatedUser.xpTotal,
        currentStreak: updatedUser.currentStreak,
    }
}

export { XP_CORRECT_ANSWER }
export default router
