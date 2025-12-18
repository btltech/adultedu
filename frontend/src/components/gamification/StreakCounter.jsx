import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

// Fire emoji for streaks
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

export default function StreakCounter() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await api('/gamification/stats')
                setStats(data)
            } catch (err) {
                // User might not be logged in
                console.log('Could not fetch gamification stats')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading || !stats) return null

    return (
        <div className="flex items-center gap-3">
            {/* XP Display */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <StarIcon />
                <span className="text-xs font-medium text-primary-300">
                    {stats.xp} XP
                </span>
            </div>

            {/* Streak Display */}
            {stats.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-400">
                        <FireIcon />
                    </span>
                    <span className="text-xs font-medium text-amber-300">
                        {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Level Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-500/10 border border-accent-500/20">
                <span className="text-xs font-medium text-accent-300">
                    Level {stats.level}
                </span>
            </div>
        </div>
    )
}
