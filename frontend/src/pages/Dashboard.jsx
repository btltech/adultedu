import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import StreakCalendar from '../components/analytics/StreakCalendar'
import PerformanceChart from '../components/analytics/PerformanceChart'

const FireIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 23c-4.97 0-9-3.582-9-8 0-2.547 1.398-4.91 2.75-6.625.638-.81 1.316-1.543 1.916-2.187.286-.307.552-.586.784-.844.114-.127.219-.248.313-.364.079-.098.148-.187.203-.265.039-.055.068-.1.087-.134a.75.75 0 011.305.081c.054.085.22.345.22.587 0 .354-.065.759-.149 1.165-.084.402-.186.813-.284 1.18a24.558 24.558 0 01-.234.82c-.082.275-.154.512-.21.704-.027.092-.049.171-.066.235a1.27 1.27 0 01-.02.067c.08-.076.199-.188.354-.33.313-.286.725-.673 1.175-1.11.893-.87 1.918-1.898 2.724-2.918.406-.513.774-1.027 1.05-1.514C14.148 3.055 14.25 2.61 14.25 2.25a.75.75 0 011.348-.45c.062.083.174.232.32.427.294.392.7.94 1.143 1.567a38.96 38.96 0 011.677 2.574c.532.88 1.055 1.843 1.44 2.774C20.565 10.067 21 11.209 21 12.25c0 4.695-4.03 10.75-9 10.75z" />
    </svg>
)

const StarIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
)

const TrendUpIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
)

const TrendDownIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
)

function StatCard({ icon, label, value, subValue, color = 'primary' }) {
    const colorClasses = {
        primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/30',
        accent: 'from-accent-500/20 to-accent-500/5 border-accent-500/30',
        amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    }

    return (
        <div className={`glass-card p-5 bg-gradient-to-br ${colorClasses[color]} border`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`text-${color}-400`}>{icon}</div>
                <span className="text-dark-400 text-sm">{label}</span>
            </div>
            <div className="text-3xl font-bold text-dark-50">{value}</div>
            {subValue && <div className="text-sm text-dark-400 mt-1">{subValue}</div>}
        </div>
    )
}

function WeaknessCard({ weakness }) {
    const priorityColors = {
        high: 'bg-red-500/10 border-red-500/30 text-red-400',
        medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        low: 'bg-accent-500/10 border-accent-500/30 text-accent-400',
    }

    const TrendIcon = weakness.trend === 'improving' ? TrendUpIcon :
        weakness.trend === 'declining' ? TrendDownIcon : null

    return (
        <div className="glass-card p-4 hover:border-dark-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-medium text-dark-100">{weakness.title}</h4>
                    <p className="text-xs text-dark-500">{weakness.trackTitle}</p>
                </div>
                <span className={`badge ${priorityColors[weakness.priority]}`}>
                    {weakness.priority}
                </span>
            </div>

            <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-dark-400">Accuracy</span>
                        <span className="text-dark-200">{weakness.accuracy}%</span>
                    </div>
                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${weakness.accuracy < 50 ? 'bg-red-500' :
                                weakness.accuracy < 70 ? 'bg-amber-500' : 'bg-accent-500'
                                }`}
                            style={{ width: `${weakness.accuracy}%` }}
                        />
                    </div>
                </div>
                {TrendIcon && (
                    <div className={`flex items-center gap-1 text-xs ${weakness.trend === 'improving' ? 'text-accent-400' : 'text-red-400'
                        }`}>
                        <TrendIcon />
                        <span>{weakness.trend}</span>
                    </div>
                )}
            </div>

            <p className="text-xs text-dark-400 mb-3">{weakness.recommendation}</p>

            <Link
                to={`/practice/${weakness.id}`}
                className="btn-secondary w-full text-sm justify-center"
            >
                Practice This Topic
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
                    api('/analytics/weaknesses')
                ])
                setOverview(overviewData)
                setWeaknesses(weaknessData.weaknesses)
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
                <div className="container-app">
                    <div className="skeleton h-8 w-48 mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton h-32 rounded-xl" />
                        ))}
                    </div>
                    <div className="skeleton h-64 rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="py-12">
            <div className="container-app">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-dark-50 mb-4">Dashboard</h1>
                    <p className="text-dark-300">
                        Track your learning progress and identify areas for improvement.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard
                        icon={<span className="text-2xl">📊</span>}
                        label="Accuracy"
                        value={`${overview?.accuracy || 0}%`}
                        subValue={`${overview?.correctAnswers || 0} correct`}
                        color="primary"
                    />
                    <StatCard
                        icon={<span className="text-2xl">❓</span>}
                        label="Questions"
                        value={overview?.totalQuestions || 0}
                        subValue={`${overview?.questionsLast30Days || 0} this month`}
                        color="accent"
                    />
                    <StatCard
                        icon={<FireIcon />}
                        label="Streak"
                        value={`${overview?.currentStreak || 0} days`}
                        subValue={`Best: ${overview?.longestStreak || 0} days`}
                        color="amber"
                    />
                    <StatCard
                        icon={<StarIcon />}
                        label="Level"
                        value={overview?.level || 1}
                        subValue={`${overview?.xp || 0} XP`}
                        color="primary"
                    />
                </div>

                {/* Charts and Calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-dark-50 mb-4">
                            📈 Performance by Topic
                        </h3>
                        <PerformanceChart />
                    </div>
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-dark-50 mb-4">
                            🗓️ Activity Calendar
                        </h3>
                        <StreakCalendar />
                    </div>
                </div>

                {/* Weaknesses */}
                {weaknesses.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-xl font-semibold text-dark-50 mb-4">
                            🎯 Areas to Improve
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {weaknesses.map(w => (
                                <WeaknessCard key={w.id} weakness={w} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-dark-50 mb-4">
                        Quick Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/review" className="btn-primary">
                            📚 Review Due Cards
                        </Link>
                        <Link to="/tracks" className="btn-secondary">
                            📖 Continue Learning
                        </Link>
                        <Link to="/progress" className="btn-secondary">
                            📊 View Full Progress
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
