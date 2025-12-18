import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import DailyChallenge from '../components/gamification/DailyChallenge'
import AchievementBadges from '../components/gamification/AchievementBadges'
import Leaderboard from '../components/gamification/Leaderboard'

export default function Daily() {
    const [streak, setStreak] = useState(null)
    const [loadingStreak, setLoadingStreak] = useState(true)

    useEffect(() => {
        async function fetchStreak() {
            try {
                const data = await api('/daily/streak')
                setStreak(data)
            } catch (err) {
                console.error('Failed to load daily streak:', err)
            } finally {
                setLoadingStreak(false)
            }
        }

        fetchStreak()
    }, [])

    const completedDays = useMemo(() => {
        if (!streak?.history) return 0
        return streak.history.filter((h) => h.completed).length
    }, [streak])

    return (
        <div className="py-12">
            <div className="container-app max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-50">Daily Challenge</h1>
                    <p className="text-dark-400 mt-1">
                        Earn bonus XP and keep your streak going.
                    </p>
                </div>

                {!loadingStreak && streak && (
                    <div className="glass-card p-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="text-xs text-dark-500 uppercase tracking-widest">Current Streak</div>
                            <div className="text-xl font-semibold text-amber-300">
                                {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
                            </div>
                        </div>
                        <div className="text-xs text-dark-400">
                            Last 7 days: <span className="text-dark-200 font-medium">{completedDays}</span> completed
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <DailyChallenge />
                    </div>
                    <AchievementBadges />
                </div>

                <div className="mt-6">
                    <Leaderboard />
                </div>
            </div>
        </div>
    )
}

