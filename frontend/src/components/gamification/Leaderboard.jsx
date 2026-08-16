import { useState, useEffect } from 'react'
import { Award, Flame } from 'lucide-react'
import { api } from '../../lib/api'

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
            <div className="progress-panel">
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
        <div className="progress-panel">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-dark-50">
                        <Award className="h-5 w-5 text-primary-300" />
                        Community board
                    </h3>
                    <p className="mt-1 text-sm text-dark-400">An optional snapshot of recent learning points across the community.</p>
                </div>
                <div className="flex bg-dark-800 rounded-lg p-1">
                    <button
                        onClick={() => setPeriod('weekly')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === 'weekly'
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        This week
                    </button>
                    <button
                        onClick={() => setPeriod('monthly')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${period === 'monthly'
                                ? 'bg-primary-500 text-white'
                                : 'text-dark-400 hover:text-dark-200'
                            }`}
                    >
                        This month
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {data.leaderboard.map((user, index) => (
                    <LeaderboardRow
                        key={index}
                        user={user}
                        rank={user.rank}
                    />
                ))}
            </div>

            {data.currentUser.rank > 10 && (
                <div className="mt-4 pt-4 border-t border-dark-700">
                    <p className="text-dark-400 text-xs mb-2">Your place this period</p>
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
    const rankTone = () => {
        switch (rank) {
            case 1:
                return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            case 2:
                return 'bg-slate-400/15 text-slate-200 border-slate-400/30'
            case 3:
                return 'bg-orange-500/15 text-orange-300 border-orange-500/30'
            default:
                return 'bg-dark-700/80 text-dark-300 border-dark-600/50'
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
            <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${rankTone()}`}>
                {rank}
            </div>

            <div className="flex-grow">
                <p className={`font-medium ${user.isCurrentUser ? 'text-primary-300' : 'text-dark-100'}`}>
                    {user.displayName}
                </p>
                <div className="flex items-center gap-3 text-xs text-dark-400">
                    <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Lvl {user.level}
                    </span>
                    {user.streak > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                            <Flame className="h-4 w-4" />
                            {user.streak}
                        </span>
                    )}
                </div>
            </div>

            <div className="text-right">
                <span className="text-primary-400 font-bold">{user.xp.toLocaleString()}</span>
                <span className="text-dark-500 text-xs ml-1">pts</span>
            </div>
        </div>
    )
}
