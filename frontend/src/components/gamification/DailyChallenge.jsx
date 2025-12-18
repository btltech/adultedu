import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

function formatTimeRemaining(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
}

export default function DailyChallenge({ compact = false }) {
    const [challenge, setChallenge] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [timeRemaining, setTimeRemaining] = useState(0)

    useEffect(() => {
        async function fetchChallenge() {
            try {
                const data = await api('/daily/challenge')
                setChallenge(data)
                setTimeRemaining(data.timeUntilNext)
                if (data.completed) {
                    setResult({
                        isCorrect: data.isCorrect,
                        xpEarned: data.xpEarned
                    })
                }
            } catch (err) {
                console.log('Could not fetch daily challenge:', err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchChallenge()
    }, [])

    // Countdown timer
    useEffect(() => {
        if (timeRemaining <= 0) return
        const interval = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 60000))
        }, 60000)
        return () => clearInterval(interval)
    }, [timeRemaining])

    const handleSubmit = async () => {
        if (selectedAnswer === null || !challenge) return

        setSubmitting(true)
        try {
            const answer = challenge.question.options[selectedAnswer]
            const data = await api('/daily/submit', {
                method: 'POST',
                body: { answer }
            })
            setResult(data)
        } catch (err) {
            console.error('Failed to submit daily challenge:', err)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className={`glass-card ${compact ? 'p-4' : 'p-6'}`}>
                <div className="skeleton h-6 w-32 mb-3" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-10 w-full" />
            </div>
        )
    }

    if (!challenge) return null

    const isCompleted = challenge.completed || result

    // Compact mode for sidebar/header
    if (compact) {
        return (
            <Link
                to="/daily"
                className={`glass-card p-4 block transition-all hover:scale-[1.02] ${isCompleted ? 'opacity-75' : 'ring-2 ring-amber-500/30'
                    }`}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-amber-400 font-semibold text-sm">⚡ Daily Challenge</span>
                    <span className="badge badge-accent">{challenge.xpMultiplier}x XP</span>
                </div>
                {isCompleted ? (
                    <div className="flex items-center gap-2 text-accent-400">
                        <CheckIcon />
                        <span className="text-sm">Completed! +{result?.xpEarned || challenge.xpEarned} XP</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-dark-400 text-xs">
                        <ClockIcon />
                        <span>Resets in {formatTimeRemaining(timeRemaining)}</span>
                    </div>
                )}
            </Link>
        )
    }

    // Full challenge view
    return (
        <div className="glass-card p-6 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-dark-50 flex items-center gap-2">
                        ⚡ Daily Challenge
                    </h2>
                    <p className="text-dark-400 text-sm mt-1">
                        {challenge.question.track} • {challenge.question.topic}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="badge badge-accent text-sm px-3 py-1">
                        {challenge.xpMultiplier}x XP Bonus
                    </span>
                    {!isCompleted && (
                        <div className="flex items-center gap-1.5 text-dark-400 text-sm">
                            <ClockIcon />
                            <span>{formatTimeRemaining(timeRemaining)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Question */}
            <div className="mb-6">
                <p className="text-lg text-dark-100 leading-relaxed">{challenge.question.prompt}</p>
            </div>

            {/* Image if available */}
            {challenge.question.imageUrl && (
                <div className="mb-6 rounded-xl overflow-hidden bg-dark-900/50 border border-dark-700 flex justify-center p-4">
                    <img
                        src={challenge.question.imageUrl}
                        alt="Question"
                        className="max-h-48 object-contain rounded-lg"
                    />
                </div>
            )}

            {/* Answer options */}
            {!isCompleted ? (
                <>
                    <div className="space-y-3 mb-6">
                        {challenge.question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedAnswer(index)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAnswer === index
                                        ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                                        : 'bg-dark-800 border-dark-600 text-dark-200 hover:border-dark-500'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${selectedAnswer === index ? 'bg-primary-500/30' : 'bg-dark-700'
                                        }`}>
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span>{option}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={selectedAnswer === null || submitting}
                        className="btn-primary w-full justify-center py-3 disabled:opacity-50"
                    >
                        {submitting ? 'Checking...' : 'Submit Answer'}
                    </button>
                </>
            ) : (
                /* Result display */
                <div className={`p-5 rounded-xl ${result?.isCorrect
                        ? 'bg-accent-500/10 border border-accent-500/30'
                        : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {result?.isCorrect ? (
                                <span className="text-accent-400 font-bold text-lg">🎉 Correct!</span>
                            ) : (
                                <span className="text-amber-400 font-bold text-lg">Not quite</span>
                            )}
                        </div>
                        {result?.xpEarned > 0 && (
                            <span className="text-primary-400 font-bold">
                                +{result.xpEarned} XP
                            </span>
                        )}
                    </div>
                    {result?.explanation && (
                        <p className="text-dark-300 text-sm">{result.explanation}</p>
                    )}
                    {result?.dailyStreak > 1 && (
                        <div className="mt-3 text-amber-400 font-medium text-sm">
                            🔥 {result.dailyStreak} day challenge streak!
                        </div>
                    )}
                    {result?.newAchievements?.length > 0 && (
                        <div className="mt-4 p-3 bg-primary-500/10 rounded-lg">
                            <p className="text-primary-300 font-medium text-sm mb-2">🏆 New Achievement!</p>
                            {result.newAchievements.map((a, i) => (
                                <div key={i} className="flex items-center gap-2 text-dark-200">
                                    <span>{a.icon}</span>
                                    <span>{a.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
