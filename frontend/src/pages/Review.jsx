import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const BrainIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18a3.374 3.374 0 00-2-.586l-.548-.547z" />
    </svg>
)

export default function Review() {
    const [stats, setStats] = useState(null)
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState(null)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchReviewData()
    }, [])

    const fetchReviewData = async () => {
        setLoading(true)
        try {
            const [statsData, dueData] = await Promise.all([
                api('/review/stats'),
                api('/review/due?limit=10')
            ])
            setStats(statsData)
            setQuestions(dueData.questions || [])
        } catch (err) {
            console.error('Failed to fetch review data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (selectedOption === null) return

        setSubmitting(true)
        const question = questions[currentIndex]

        try {
            // Determine quality based on how quickly/confidently they answered
            // For simplicity: correct = 4, incorrect = 1
            const response = await api('/review/submit', {
                method: 'POST',
                body: {
                    reviewItemId: question.reviewItemId,
                    answer: selectedOption,
                    quality: 4, // We'll use isCorrect to determine if this should be lower
                }
            })
            setResult(response)
        } catch (err) {
            console.error('Failed to submit review:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedOption(null)
            setResult(null)
        } else {
            // Finished review session
            fetchReviewData()
            setCurrentIndex(0)
            setSelectedOption(null)
            setResult(null)
        }
    }

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-3xl">
                    <div className="skeleton h-8 w-48 mb-4" />
                    <div className="skeleton h-64" />
                </div>
            </div>
        )
    }

    return (
        <div className="py-12">
            <div className="container-app max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-3">
                            <span className="text-primary-400"><BrainIcon /></span>
                            Review Session
                        </h1>
                        <p className="text-dark-400 mt-1">
                            Strengthen your memory with spaced repetition
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <div className="glass-card p-4 text-center">
                            <div className="text-2xl font-bold text-amber-400">{stats.dueNow}</div>
                            <div className="text-xs text-dark-400">Due Now</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-2xl font-bold text-primary-400">{stats.dueThisWeek}</div>
                            <div className="text-xs text-dark-400">This Week</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-2xl font-bold text-accent-400">{stats.reviewedToday}</div>
                            <div className="text-xs text-dark-400">Today</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-2xl font-bold text-dark-200">{stats.totalInQueue}</div>
                            <div className="text-xs text-dark-400">In Queue</div>
                        </div>
                    </div>
                )}

                {/* Review Content */}
                {questions.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="text-xl font-semibold text-dark-100 mb-3">
                            All caught up!
                        </h2>
                        <p className="text-dark-400 mb-6">
                            No questions due for review right now. Come back later!
                        </p>
                        <Link to="/tracks" className="btn-primary">
                            Continue Learning
                        </Link>
                    </div>
                ) : (
                    <div className="glass-card p-6">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-4 text-sm">
                            <span className="text-dark-400">
                                {currentIndex + 1} of {questions.length}
                            </span>
                            <span className="badge badge-primary">
                                {questions[currentIndex].topic.title}
                            </span>
                        </div>

                        <div className="h-1 bg-dark-800 rounded-full mb-6 overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        {/* Question */}
                        <p className="text-lg text-white mb-6 leading-relaxed">
                            {questions[currentIndex].prompt}
                        </p>

                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {questions[currentIndex].options.map((option, index) => {
                                const isSelected = selectedOption === option
                                const showResultStyles = result !== null
                                const isCorrectAnswer = showResultStyles && result.correctAnswer === option
                                const isWrongSelected = showResultStyles && isSelected && !result.isCorrect

                                return (
                                    <button
                                        key={index}
                                        onClick={() => !result && setSelectedOption(option)}
                                        disabled={result !== null}
                                        className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${isCorrectAnswer
                                                ? 'bg-accent-500/20 border-accent-500 text-white'
                                                : isWrongSelected
                                                    ? 'bg-red-500/20 border-red-500 text-white'
                                                    : isSelected
                                                        ? 'bg-primary-500/20 border-primary-500 text-white'
                                                        : 'bg-dark-800 border-dark-700 text-dark-200 hover:border-dark-500'
                                            } ${result ? 'cursor-default' : ''}`}
                                    >
                                        <span className="font-medium mr-3 text-dark-400">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        {option}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Result or Submit */}
                        {result ? (
                            <>
                                <div className={`p-4 rounded-xl mb-4 ${result.isCorrect
                                        ? 'bg-accent-500/10 border border-accent-500/30'
                                        : 'bg-amber-500/10 border border-amber-500/30'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {result.isCorrect ? (
                                            <span className="text-accent-400 font-medium">✓ Correct!</span>
                                        ) : (
                                            <span className="text-amber-400 font-medium">✗ Not quite</span>
                                        )}
                                        <span className="text-sm text-dark-500">
                                            Next review in {result.nextReviewIn} day{result.nextReviewIn !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <p className="text-dark-300 text-sm">{result.explanation}</p>
                                </div>

                                <button
                                    onClick={handleNext}
                                    className="btn-primary w-full justify-center"
                                >
                                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={selectedOption === null || submitting}
                                className="btn-primary w-full justify-center disabled:opacity-50"
                            >
                                {submitting ? 'Checking...' : 'Check Answer'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
