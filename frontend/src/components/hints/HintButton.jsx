import { useState } from 'react'

const LightbulbIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.469c-1.006 0-1.938.44-2.584 1.171l-.548-.547z" />
    </svg>
)

/**
 * Progressive Hint Button and Display
 * Reveals hints one by one, reducing potential XP each time
 */
export default function HintButton({ hints = [], onHintUsed }) {
    const [revealedCount, setRevealedCount] = useState(0)
    const [isExpanded, setIsExpanded] = useState(false)

    if (!hints || hints.length === 0) return null

    const handleRevealHint = () => {
        if (revealedCount < hints.length) {
            const newCount = revealedCount + 1
            setRevealedCount(newCount)
            setIsExpanded(true)
            onHintUsed?.(newCount)
        }
    }

    const XP_PENALTY_PER_HINT = 3 // XP reduced per hint

    return (
        <div className="mt-6">
            {/* Hint Toggle Button */}
            <button
                onClick={() => {
                    if (revealedCount === 0) {
                        handleRevealHint()
                    } else {
                        setIsExpanded(!isExpanded)
                    }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${revealedCount > 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-dark-800 text-dark-300 hover:text-amber-400 hover:bg-amber-500/10 border border-dark-700'
                    }`}
            >
                <LightbulbIcon />
                <span className="text-sm font-medium">
                    {revealedCount === 0
                        ? 'Need a hint?'
                        : `Hints (${revealedCount}/${hints.length})`}
                </span>
                {revealedCount === 0 && (
                    <span className="text-xs text-dark-500">-{XP_PENALTY_PER_HINT} XP</span>
                )}
            </button>

            {/* Hints Container */}
            {isExpanded && revealedCount > 0 && (
                <div className="mt-4 space-y-3 animate-fade-slide-up">
                    {hints.slice(0, revealedCount).map((hint, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                                {index + 1}
                            </div>
                            <p className="text-dark-200 text-sm leading-relaxed">{hint}</p>
                        </div>
                    ))}

                    {/* Reveal Next Hint Button */}
                    {revealedCount < hints.length && (
                        <button
                            onClick={handleRevealHint}
                            className="text-sm text-amber-400/70 hover:text-amber-400 transition-colors pl-9"
                        >
                            Show another hint (-{XP_PENALTY_PER_HINT} XP) →
                        </button>
                    )}

                    {revealedCount === hints.length && (
                        <p className="text-xs text-dark-500 pl-9">No more hints available</p>
                    )}
                </div>
            )}
        </div>
    )
}
