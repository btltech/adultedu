import { useEffect, useMemo, useState } from 'react'
import { Award, CalendarClock, Flame, Sparkles, Trophy } from 'lucide-react'
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
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
                        <div>
                            <span className="section-eyebrow">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Daily check-in
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">Use one short check-in to keep learning moving.</h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                The daily question is meant to stay light. Use it to restart your routine, keep key ideas active, and then return to your main pathway.
                            </p>
                        </div>

                        <div className="editorial-panel grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            <div>
                                <p className="learning-stat-label">Current routine</p>
                                <p className="mt-2 text-xl font-semibold text-amber-300">{streak?.currentStreak || 0}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Last 7 days</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{completedDays}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Format</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">Short check-in</p>
                            </div>
                        </div>
                    </div>
                </section>

                {!loadingStreak && streak && (
                    <div className="progress-panel mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-widest text-dark-500">Current routine</div>
                            <div className="mt-1 flex items-center gap-2 text-xl font-semibold text-amber-300">
                                <Flame className="h-5 w-5" />
                                {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
                            </div>
                        </div>
                        <div className="text-xs text-dark-400">
                            Last 7 days: <span className="font-medium text-dark-200">{completedDays}</span> check-in{completedDays === 1 ? '' : 's'} completed
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                    <div>
                        <DailyChallenge />
                    </div>
                    <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                        <AchievementBadges />
                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Why it matters</p>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                    <p className="text-sm leading-7 text-dark-300">A short daily return visit is often enough to stop learning from drifting.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                    <p className="text-sm leading-7 text-dark-300">Milestones and points make regular effort visible, but the real goal is a repeatable routine.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="mb-4">
                        <span className="section-eyebrow">
                            <Trophy className="h-3.5 w-3.5" />
                            Community snapshot
                        </span>
                        <h2 className="mt-3 text-2xl font-semibold text-dark-50">See how steady study looks across the wider learning community.</h2>
                    </div>
                    <Leaderboard />
                </div>
            </div>
        </div>
    )
}

