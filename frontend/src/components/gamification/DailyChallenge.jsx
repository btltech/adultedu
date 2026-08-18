import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Award, CalendarClock, CheckCircle2, Flame, Lightbulb, Target, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import QuestionReportButton from '../QuestionReportButton'

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
            <div className={`progress-panel ${compact ? 'p-4' : 'p-6'}`}>
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
                className={`feature-panel block ${isCompleted ? 'opacity-80' : 'ring-2 ring-amber-500/20'}
                    }`}
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-amber-400"><Target className="h-4 w-4" /> Daily Check-In</span>
                    <span className="badge badge-accent">Today</span>
                </div>
                {isCompleted ? (
                    <div className="flex items-center gap-2 text-accent-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm">Completed today</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-dark-400 text-xs">
                        <CalendarClock className="h-4 w-4" />
                        <span>Resets in {formatTimeRemaining(timeRemaining)}</span>
                    </div>
                )}
            </Link>
        )
    }

    // Full challenge view
    return (
        <div className="progress-panel relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <span className="section-eyebrow">
                        <Target className="h-3.5 w-3.5" />
                        Daily check-in
                    </span>
                    <h2 className="mt-3 text-2xl font-bold text-dark-50">One short question to keep the routine going.</h2>
                    <p className="text-dark-400 text-sm mt-1">
                        {challenge.question.track} • {challenge.question.topic}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="badge badge-accent text-sm px-3 py-1">
                        Short session
                    </span>
                    {!isCompleted && (
                        <div className="flex items-center gap-1.5 text-dark-400 text-sm">
                            <CalendarClock className="h-4 w-4" />
                            <span>{formatTimeRemaining(timeRemaining)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <p className="text-lg text-dark-100 leading-relaxed">{challenge.question.prompt}</p>
            </div>

            {challenge.question.imageUrl && (
                <div className="mb-6 rounded-xl overflow-hidden bg-dark-900/50 border border-dark-700 flex justify-center p-4">
                    <img
                        src={challenge.question.imageUrl}
                        alt={`Illustration for: ${challenge.question.prompt}`}
                        className="max-h-48 object-contain rounded-lg"
                    />
                </div>
            )}

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
                        {submitting ? 'Checking...' : 'Check Answer'}
                    </button>
                </>
            ) : (
                <div className={`p-5 rounded-xl ${result?.isCorrect
                        ? 'bg-accent-500/10 border border-accent-500/30'
                        : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {result?.isCorrect ? (
                                <><CheckCircle2 className="h-5 w-5 text-accent-400" /><span className="text-accent-400 font-bold text-lg">Correct</span></>
                            ) : (
                                <><XCircle className="h-5 w-5 text-amber-400" /><span className="text-amber-400 font-bold text-lg">Needs another look</span></>
                            )}
                        </div>
                        {result?.xpEarned > 0 && (
                            <span className="text-primary-400 font-bold">
                                +{result.xpEarned} points
                            </span>
                        )}
                    </div>
                    {result?.explanation && (
                        <p className="text-dark-300 text-sm">{result.explanation}</p>
                    )}
                    {result?.dailyStreak > 1 && (
                        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-400">
                            <Flame className="h-4 w-4" />
                            {result.dailyStreak} day routine
                        </div>
                    )}
                    {result?.newAchievements?.length > 0 && (
                        <div className="mt-4 p-3 bg-primary-500/10 rounded-lg">
                            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary-300"><Award className="h-4 w-4" /> New milestone</p>
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

            {!isCompleted && (
                <div className="mt-6 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                        <p>If you miss a day, just return tomorrow. The point is routine, not perfection. Finish the check-in, then move back into your main pathway.</p>
                    </div>
                </div>
            )}

            <QuestionReportButton
                question={challenge.question}
                context={{ surface: 'daily-challenge', topicId: challenge.question.topic?.id, answered: !!result }}
            />
        </div>
    )
}
