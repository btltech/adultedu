import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

/**
 * AchievementBadges - Display user's earned achievements
 */
export default function AchievementBadges({ showAll = false }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchAchievements() {
            try {
                const result = await api('/gamification/achievements')
                setData(result)
            } catch (err) {
                console.log('Could not fetch achievements:', err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchAchievements()
    }, [])

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="skeleton h-6 w-32 mb-4" />
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton h-16 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (!data) return null

    const achievements = showAll
        ? data.achievements
        : data.achievements.filter(a => a.earned).slice(0, 8)

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-50">
                    🏆 Achievements
                </h3>
                <span className="text-dark-400 text-sm">
                    {data.earned} / {data.total}
                </span>
            </div>

            {achievements.length === 0 ? (
                <p className="text-dark-400 text-center py-4">
                    Complete challenges to earn your first achievement!
                </p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {achievements.map(achievement => (
                        <AchievementBadge
                            key={achievement.type}
                            achievement={achievement}
                        />
                    ))}
                </div>
            )}

            {!showAll && data.earned < data.total && (
                <button className="btn-secondary w-full mt-4 text-sm">
                    View All Achievements
                </button>
            )}
        </div>
    )
}

function AchievementBadge({ achievement }) {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className={`
                p-4 rounded-xl border text-center transition-all
                ${achievement.earned
                    ? 'bg-dark-800 border-primary-500/30 hover:border-primary-500/50'
                    : 'bg-dark-900/50 border-dark-700 opacity-40 grayscale'
                }
            `}>
                <div className="text-2xl mb-1">{achievement.icon}</div>
                <p className="text-xs font-medium text-dark-200 truncate">
                    {achievement.name}
                </p>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                    <div className="bg-dark-900 border border-dark-700 rounded-lg p-3 shadow-xl min-w-48">
                        <p className="font-semibold text-dark-100 text-sm mb-1">
                            {achievement.icon} {achievement.name}
                        </p>
                        <p className="text-dark-400 text-xs">
                            {achievement.description}
                        </p>
                        {achievement.earned && achievement.earnedAt && (
                            <p className="text-primary-400 text-xs mt-2">
                                Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                            </p>
                        )}
                        {!achievement.earned && (
                            <p className="text-dark-500 text-xs mt-2 italic">
                                Not yet earned
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * NewAchievementPopup - Animated popup for newly earned achievements
 */
export function NewAchievementPopup({ achievement, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    if (!achievement) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="animate-bounce-in bg-dark-800 border-2 border-primary-500 rounded-2xl p-8 shadow-2xl text-center max-w-sm pointer-events-auto">
                <div className="text-6xl mb-4 animate-pulse">{achievement.icon}</div>
                <h2 className="text-2xl font-bold text-dark-50 mb-2">
                    Achievement Unlocked!
                </h2>
                <p className="text-xl text-primary-400 font-semibold mb-2">
                    {achievement.name}
                </p>
                <p className="text-dark-400 text-sm">
                    {achievement.description}
                </p>
                <button
                    onClick={onClose}
                    className="btn-primary mt-6"
                >
                    Awesome!
                </button>
            </div>
        </div>
    )
}
