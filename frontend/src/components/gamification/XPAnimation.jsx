import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

/**
 * XP Animation component that shows XP earned and triggers confetti
 */
export default function XPAnimation({ xpData, show, onComplete }) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (show && xpData) {
            setVisible(true)

            // Trigger confetti for correct answers
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#8b5cf6', '#a855f7', '#14b8a6', '#10b981']
            })

            // Hide after animation
            const timer = setTimeout(() => {
                setVisible(false)
                onComplete?.()
            }, 2500)

            return () => clearTimeout(timer)
        }
    }, [show, xpData, onComplete])

    if (!visible || !xpData) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="animate-bounce-in text-center">
                {/* Main XP */}
                <div className="text-5xl font-bold text-primary-400 animate-pulse mb-2">
                    +{xpData.xpAwarded} XP
                </div>

                {/* Breakdown */}
                <div className="flex items-center justify-center gap-3 text-sm">
                    {xpData.breakdown.base > 0 && (
                        <span className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-300">
                            Base: +{xpData.breakdown.base}
                        </span>
                    )}
                    {xpData.breakdown.streakBonus > 0 && (
                        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
                            🔥 Streak: +{xpData.breakdown.streakBonus}
                        </span>
                    )}
                    {xpData.breakdown.firstTryBonus > 0 && (
                        <span className="px-2 py-1 rounded-full bg-accent-500/20 text-accent-300">
                            ⭐ First Try: +{xpData.breakdown.firstTryBonus}
                        </span>
                    )}
                </div>

                {/* Current Streak */}
                {xpData.currentStreak > 1 && (
                    <div className="mt-3 text-amber-400 font-medium">
                        🔥 {xpData.currentStreak} day streak!
                    </div>
                )}
            </div>
        </div>
    )
}

// Add CSS animation in index.css if needed
// @keyframes bounce-in: scale from 0 to 1.1 to 1
