import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const FireIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 23c-4.97 0-9-3.582-9-8 0-2.547 1.398-4.91 2.75-6.625.638-.81 1.316-1.543 1.916-2.187.286-.307.552-.586.784-.844.114-.127.219-.248.313-.364.079-.098.148-.187.203-.265.039-.055.068-.1.087-.134a.75.75 0 011.305.081c.054.085.22.345.22.587 0 .354-.065.759-.149 1.165-.084.402-.186.813-.284 1.18a24.558 24.558 0 01-.234.82c-.082.275-.154.512-.21.704-.027.092-.049.171-.066.235a1.27 1.27 0 01-.02.067c.08-.076.199-.188.354-.33.313-.286.725-.673 1.175-1.11.893-.87 1.918-1.898 2.724-2.918.406-.513.774-1.027 1.05-1.514C14.148 3.055 14.25 2.61 14.25 2.25a.75.75 0 011.348-.45c.062.083.174.232.32.427.294.392.7.94 1.143 1.567a38.96 38.96 0 011.677 2.574c.532.88 1.055 1.843 1.44 2.774C20.565 10.067 21 11.209 21 12.25c0 4.695-4.03 10.75-9 10.75z" />
    </svg>
)

const StarIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
)

/**
 * Leaderboard - Display weekly/monthly top learners
 */
export default function Leaderboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('weekly')

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true)
            try {
                const result = await api(`/gamification/leaderboard?period=${period}`)
                setData(result)
            } catch (err) {
                console.log('Could not fetch leaderboard:', err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [period])

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="skeleton h-6 w-32 mb-4" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="glass-card p-6">
            {/* Header with period toggle */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-50">
                    🏅 Leaderboard
                </h3>
                <div className="flex bg-dark-800 rounded-lg p-1">
                    <button
                        onClick={() => setPeriod('weekly')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === 'weekly'
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setPeriod('monthly')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === 'monthly'
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {/* Leaderboard list */}
            <div className="space-y-2">
                {data.leaderboard.map((user, index) => (
                    <LeaderboardRow
                        key={index}
                        user={user}
                        rank={user.rank}
                    />
                ))}
            </div>

            {/* Current user position if not in top 10 */}
            {data.currentUser.rank > 10 && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                    <p className="text-dark-400 text-xs mb-2">Your Position</p>
                    <LeaderboardRow
                        user={{
                            ...data.currentUser,
                            displayName: 'You',
                            isCurrentUser: true
                        }}
                        rank={data.currentUser.rank}
                    />
                </div>
            )}
        </div>
    )
}

function LeaderboardRow({ user, rank }) {
    const getRankBadge = () => {
        switch (rank) {
            case 1: return '🥇'
            case 2: return '🥈'
            case 3: return '🥉'
            default: return rank
        }
    }

    return (
        <div className={`
            flex items-center gap-4 p-3 rounded-xl transition-colors
            ${user.isCurrentUser
                ? 'bg-primary-500/10 border border-primary-500/30'
                : 'bg-dark-800/50 hover:bg-dark-800'
            }
        `}>
            {/* Rank */}
            <div className="w-8 text-center">
                {typeof getRankBadge() === 'string' && getRankBadge().length === 2 ? (
                    <span className="text-xl">{getRankBadge()}</span>
                ) : (
                    <span className="text-dark-400 font-medium">{getRankBadge()}</span>
                )}
            </div>

            {/* User info */}
            <div className="flex-grow">
                <p className={`font-medium ${user.isCurrentUser ? 'text-primary-300' : 'text-dark-100'}`}>
                    {user.displayName}
                </p>
                <div className="flex items-center gap-3 text-xs text-dark-400">
                    <span className="flex items-center gap-1">
                        <StarIcon />
                        Lvl {user.level}
                    </span>
                    {user.streak > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                            <FireIcon />
                            {user.streak}
                        </span>
                    )}
                </div>
            </div>

            {/* XP */}
            <div className="text-right">
                <span className="text-primary-400 font-bold">{user.xp.toLocaleString()}</span>
                <span className="text-dark-500 text-xs ml-1">XP</span>
            </div>
        </div>
    )
}
