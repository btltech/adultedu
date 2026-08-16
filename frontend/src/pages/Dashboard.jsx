import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowRight,
    BarChart3,
    BookOpenCheck,
    CalendarDays,
    Flame,
    Gauge,
    LineChart,
    RefreshCw,
    Sparkles,
    Star,
    Target,
} from 'lucide-react'
import { api } from '../lib/api'
import StreakCalendar from '../components/analytics/StreakCalendar'
import PerformanceChart from '../components/analytics/PerformanceChart'

function StatCard({ icon: Icon, label, value, detail, tone = 'primary' }) {
    const tones = {
        primary: 'border-primary-500/25 bg-primary-500/10 text-primary-300',
        accent: 'border-accent-500/25 bg-accent-500/10 text-accent-300',
        amber: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
        neutral: 'border-dark-700 bg-dark-900/70 text-dark-300',
    }

    return (
        <div className="learning-stat">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="learning-stat-label">{label}</p>
                    <p className="learning-stat-value mt-2">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {detail && <p className="mt-3 text-sm leading-6 text-dark-400">{detail}</p>}
        </div>
    )
}

function WeaknessCard({ weakness }) {
    const priorityTone = weakness.priority === 'high'
        ? 'border-red-500/35 bg-red-500/10 text-red-300'
        : weakness.priority === 'medium'
            ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
            : 'border-accent-500/35 bg-accent-500/10 text-accent-300'

    return (
        <div className="progress-panel">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Focus area</p>
                    <h3 className="mt-2 text-lg font-semibold text-dark-50">{weakness.title}</h3>
                    <p className="mt-1 text-sm text-dark-500">{weakness.trackTitle}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${priorityTone}`}>
                    {weakness.priority}
                </span>
            </div>

            <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-dark-400">Accuracy</span>
                    <span className="font-medium text-dark-100">{weakness.accuracy}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                    <div
                        className={`h-full rounded-full ${weakness.accuracy < 50 ? 'bg-red-500' : weakness.accuracy < 70 ? 'bg-amber-500' : 'bg-accent-500'}`}
                        style={{ width: `${weakness.accuracy}%` }}
                    />
                </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-dark-300">{weakness.recommendation}</p>

            <Link to={`/practice/${weakness.id}`} className="btn-secondary mt-5 w-full justify-center">
                Practice this topic
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    )
}

export default function Dashboard() {
    const [overview, setOverview] = useState(null)
    const [weaknesses, setWeaknesses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                const [overviewData, weaknessData] = await Promise.all([
                    api('/analytics/overview'),
                    api('/analytics/weaknesses'),
                ])
                setOverview(overviewData)
                setWeaknesses(weaknessData.weaknesses || [])
            } catch (err) {
                console.error('Failed to fetch analytics:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-6xl">
                    <div className="skeleton mb-8 h-44 w-full rounded-[2rem]" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-32 rounded-[1.5rem]" />)}
                    </div>
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div className="skeleton h-80 rounded-[1.75rem]" />
                        <div className="skeleton h-80 rounded-[1.75rem]" />
                    </div>
                </div>
            </div>
        )
    }

    const accuracy = overview?.accuracy || 0
    const totalQuestions = overview?.totalQuestions || 0
    const currentStreak = overview?.currentStreak || 0
    const level = overview?.level || 1
    const hasActivity = totalQuestions > 0 || weaknesses.length > 0

    return (
        <div className="py-12">
            <div className="container-app max-w-6xl">
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
                        <div>
                            <span className="section-eyebrow">
                                <Gauge className="h-3.5 w-3.5" />
                                Learner dashboard
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">
                                Keep your next learning move visible.
                            </h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                Use this page as a calm check-in: see your accuracy, routine, recent activity, and the topics that would benefit from another pass.
                            </p>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Best next step</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">
                                {weaknesses.length > 0 ? 'Start with the weakest topic, then return to your pathway.' : 'Build momentum with one focused session.'}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-dark-300">
                                {weaknesses.length > 0
                                    ? 'The dashboard highlights where practice will make the biggest difference right now.'
                                    : 'A short review or practice session is enough to make progress visible again.'}
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <Link to={weaknesses[0] ? `/practice/${weaknesses[0].id}` : '/tracks'} className="btn-primary w-full justify-center">
                                    {weaknesses[0] ? 'Practice priority topic' : 'Choose a pathway'}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link to="/review" className="btn-ghost w-full justify-center">
                                    Open spaced review
                                    <RefreshCw className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={BarChart3} label="Accuracy" value={`${accuracy}%`} detail={`${overview?.correctAnswers || 0} correct answers secured`} tone="primary" />
                    <StatCard icon={BookOpenCheck} label="Questions" value={totalQuestions} detail={`${overview?.questionsLast30Days || 0} answered this month`} tone="accent" />
                    <StatCard icon={Flame} label="Routine" value={`${currentStreak} day${currentStreak === 1 ? '' : 's'}`} detail={`Best streak: ${overview?.longestStreak || 0} days`} tone="amber" />
                    <StatCard icon={Star} label="Level" value={level} detail={`${overview?.xp || 0} XP earned`} tone="neutral" />
                </div>

                {!hasActivity && (
                    <div className="editorial-panel mb-8 p-10 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/12 text-primary-300">
                            <Sparkles className="h-7 w-7" />
                        </div>
                        <h2 className="mt-6 text-2xl font-semibold text-dark-50">Your dashboard will fill in as you learn.</h2>
                        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-dark-300">
                            Start a pathway or answer a practice set and this page will turn into your personal learning record.
                        </p>
                        <Link to="/tracks" className="btn-primary mt-6">
                            Browse pathways
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}

                <div className="mb-8 grid gap-6 lg:grid-cols-2">
                    <section className="progress-panel">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Performance</p>
                                <h2 className="mt-2 text-xl font-semibold text-dark-50">Accuracy by topic</h2>
                            </div>
                            <LineChart className="h-5 w-5 text-primary-300" />
                        </div>
                        <PerformanceChart />
                    </section>

                    <section className="progress-panel">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Routine</p>
                                <h2 className="mt-2 text-xl font-semibold text-dark-50">Activity calendar</h2>
                            </div>
                            <CalendarDays className="h-5 w-5 text-accent-300" />
                        </div>
                        <StreakCalendar />
                    </section>
                </div>

                {weaknesses.length > 0 && (
                    <section className="mb-8">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <span className="section-eyebrow">
                                    <Target className="h-3.5 w-3.5" />
                                    Focus areas
                                </span>
                                <h2 className="mt-3 text-2xl font-semibold text-dark-50">Topics that need another pass</h2>
                            </div>
                            <p className="max-w-md text-sm leading-6 text-dark-400 sm:text-right">
                                These are ranked by recent performance so practice feels purposeful.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {weaknesses.map((weakness) => <WeaknessCard key={weakness.id} weakness={weakness} />)}
                        </div>
                    </section>
                )}

                <section className="progress-panel">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Quick actions</p>
                            <h2 className="mt-2 text-xl font-semibold text-dark-50">Pick up the thread without searching around.</h2>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link to="/review" className="btn-primary justify-center">Review due cards</Link>
                            <Link to="/tracks" className="btn-secondary justify-center">Continue learning</Link>
                            <Link to="/progress" className="btn-ghost justify-center">View full progress</Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
