import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Brain, CalendarClock, CheckCircle2, Clock3, Layers3, RotateCcw, Sparkles, XCircle } from 'lucide-react'
import { api } from '../lib/api'

function getReviewQuestionStatus(question, sessionResults) {
    const result = sessionResults[question.reviewItemId]
    if (!result) return 'pending'
    return result.isCorrect ? 'correct' : 'incorrect'
}

export default function Review() {
    const [stats, setStats] = useState(null)
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState(null)
    const [result, setResult] = useState(null)
    const [sessionResults, setSessionResults] = useState({})
    const [submittedAnswers, setSubmittedAnswers] = useState({})
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
            setCurrentIndex(0)
            setSelectedOption(null)
            setResult(null)
            setSessionResults({})
            setSubmittedAnswers({})
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
            setSessionResults((previous) => ({
                ...previous,
                [question.reviewItemId]: response,
            }))
            setSubmittedAnswers((previous) => ({
                ...previous,
                [question.reviewItemId]: selectedOption,
            }))
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

    useEffect(() => {
        const currentQuestion = questions[currentIndex]
        if (!currentQuestion) return

        setSelectedOption(submittedAnswers[currentQuestion.reviewItemId] ?? null)
        setResult(sessionResults[currentQuestion.reviewItemId] ?? null)
    }, [currentIndex, questions, sessionResults, submittedAnswers])

    useEffect(() => {
        if (loading || !questions.length) return

        const handleKeyDown = (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return

            if (!result && ['1', '2', '3', '4'].includes(event.key)) {
                const index = Number(event.key) - 1
                if (questions[currentIndex]?.options?.[index] !== undefined) {
                    setSelectedOption(questions[currentIndex].options[index])
                }
            }

            if (event.key === 'Enter' && !result && selectedOption !== null) {
                event.preventDefault()
                handleSubmit()
            }

            if (event.key === 'ArrowRight' && currentIndex < questions.length - 1) {
                event.preventDefault()
                setCurrentIndex((previous) => previous + 1)
            }

            if (event.key === 'ArrowLeft' && currentIndex > 0) {
                event.preventDefault()
                setCurrentIndex((previous) => previous - 1)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [loading, questions, currentIndex, selectedOption, result])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-6xl">
                    <div className="skeleton mb-8 h-40 w-full rounded-[2rem]" />
                    <div className="skeleton h-80 w-full rounded-[1.75rem]" />
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentIndex]
    const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
    const completedCount = Object.keys(sessionResults).length
    const correctCount = Object.values(sessionResults).filter((entry) => entry.isCorrect).length
    const remainingCount = Math.max(questions.length - completedCount, 0)
    const questionStatuses = questions.map((question, index) => ({
        reviewItemId: question.reviewItemId,
        number: index + 1,
        isCurrent: index === currentIndex,
        status: getReviewQuestionStatus(question, sessionResults),
    }))

    return (
        <div className="py-12">
            <div className="container-app max-w-6xl">
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
                        <div>
                            <span className="section-eyebrow">
                                <Brain className="h-3.5 w-3.5" />
                                Spaced review
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">Review little and often so key ideas stay available.</h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                Use this queue to bring older material back before it fades. Short review sessions are usually enough. The main thing is to answer honestly and read the explanation before moving on.
                            </p>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Review principle</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Short, regular review beats occasional cramming.</h2>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <RotateCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Recall first</p>
                                            <p className="mt-1 text-dark-400">Try the answer from memory before using the feedback.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <CalendarClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Let the schedule work</p>
                                            <p className="mt-1 text-dark-400">Correct answers move the card further out. Misses bring it back sooner.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {stats && (
                    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <div className="learning-stat">
                            <p className="learning-stat-label">Due now</p>
                            <p className="learning-stat-value text-amber-300">{stats.dueNow}</p>
                            <p className="mt-2 text-sm text-dark-400">Ready for immediate review</p>
                        </div>
                        <div className="learning-stat">
                            <p className="learning-stat-label">This week</p>
                            <p className="learning-stat-value">{stats.dueThisWeek}</p>
                            <p className="mt-2 text-sm text-dark-400">Upcoming scheduled reviews</p>
                        </div>
                        <div className="learning-stat">
                            <p className="learning-stat-label">Reviewed today</p>
                            <p className="learning-stat-value text-accent-300">{stats.reviewedToday}</p>
                            <p className="mt-2 text-sm text-dark-400">Items already completed</p>
                        </div>
                        <div className="learning-stat">
                            <p className="learning-stat-label">In queue</p>
                            <p className="learning-stat-value">{stats.totalInQueue}</p>
                            <p className="mt-2 text-sm text-dark-400">Total review backlog</p>
                        </div>
                    </div>
                )}

                {questions.length === 0 ? (
                    <div className="editorial-panel p-12 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-500/12 text-accent-300">
                            <Sparkles className="h-7 w-7" />
                        </div>
                        <h2 className="mt-6 mb-3 text-xl font-semibold text-dark-100">
                            All caught up!
                        </h2>
                        <p className="mb-6 text-dark-400">
                            No questions due for review right now. Come back later!
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link to="/tracks" className="btn-primary">
                                Continue Learning
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link to="/daily" className="btn-secondary">
                                Open Daily Challenge
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                        <div className="progress-panel">
                            <div className="mb-4 flex items-center justify-between text-sm">
                                <span className="text-dark-400">
                                    {currentIndex + 1} of {questions.length}
                                </span>
                                <span className="badge badge-primary">
                                    {currentQuestion.topic.title}
                                </span>
                            </div>

                            <div className="mb-6 h-2 overflow-hidden rounded-full bg-dark-800">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            <p className="mb-6 text-xl leading-relaxed text-white">
                                {currentQuestion.prompt}
                            </p>

                            <div className="mb-6 space-y-3">
                                {currentQuestion.options.map((option, index) => {
                                const isSelected = selectedOption === option
                                const showResultStyles = result !== null
                                const isCorrectAnswer = showResultStyles && result.correctAnswer === option
                                const isWrongSelected = showResultStyles && isSelected && !result.isCorrect

                                return (
                                    <button
                                        key={index}
                                        onClick={() => !result && setSelectedOption(option)}
                                        disabled={result !== null}
                                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${isCorrectAnswer
                                                ? 'bg-accent-500/20 border-accent-500 text-white'
                                                : isWrongSelected
                                                    ? 'bg-red-500/20 border-red-500 text-white'
                                                    : isSelected
                                                        ? 'bg-primary-500/20 border-primary-500 text-white'
                                                        : 'bg-dark-800 border-dark-700 text-dark-200 hover:border-dark-500'
                                            } ${result ? 'cursor-default' : ''}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="font-medium text-dark-400">
                                                {String.fromCharCode(65 + index)}.
                                            </span>
                                            <span className="flex-1">{option}</span>
                                            {!showResultStyles && isSelected && (
                                                <span className="rounded bg-primary-500/20 px-2 py-1 text-xs text-primary-200">
                                                    Selected
                                                </span>
                                            )}
                                            {isCorrectAnswer && (
                                                <span className="rounded bg-accent-500/20 px-2 py-1 text-xs text-accent-100">
                                                    Correct answer
                                                </span>
                                            )}
                                            {isWrongSelected && (
                                                <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-100">
                                                    Your answer
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                )
                            })}
                            </div>

                            {result ? (
                                <>
                                    <div className={`mb-4 rounded-2xl p-4 ${result.isCorrect
                                        ? 'bg-accent-500/10 border border-accent-500/30'
                                        : 'bg-amber-500/10 border border-amber-500/30'
                                    }`}>
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            {result.isCorrect ? (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5 text-accent-400" />
                                                    <span className="font-medium text-accent-400">Correct</span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-5 w-5 text-amber-400" />
                                                    <span className="font-medium text-amber-400">Not quite yet</span>
                                                </>
                                            )}
                                            <span className="text-sm text-dark-500">
                                                Next review in {result.nextReviewIn} day{result.nextReviewIn !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-dark-300">{result.explanation}</p>
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Link to={`/topic/${currentQuestion.topic.id}`} className="btn-secondary text-sm">
                                                Review this topic
                                            </Link>
                                            <Link to={`/track/${currentQuestion.track.slug}`} className="btn-ghost text-sm">
                                                Back to pathway
                                            </Link>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="btn-primary w-full justify-center"
                                    >
                                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
                                        <ArrowRight className="h-4 w-4" />
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

                        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Session progress</p>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="text-dark-400">Completed in this session</span>
                                            <span className="text-dark-200">{completedCount}/{questions.length}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                                            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${questions.length ? (completedCount / questions.length) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="text-dark-400">Correct in this session</span>
                                            <span className="text-dark-200">{correctCount}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                                            <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${questions.length ? (correctCount / questions.length) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-dark-400">{remainingCount} card{remainingCount === 1 ? '' : 's'} still waiting in this set.</p>
                                </div>
                            </div>

                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Queue map</p>
                                <div className="mt-4 grid grid-cols-5 gap-2">
                                    {questionStatuses.map((question) => {
                                        const tone = question.status === 'correct'
                                            ? 'border-accent-500/40 bg-accent-500/15 text-accent-100'
                                            : question.status === 'incorrect'
                                                ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                                                : 'border-dark-700 bg-dark-900/60 text-dark-300 hover:border-dark-500'

                                        return (
                                            <button
                                                key={question.reviewItemId}
                                                type="button"
                                                onClick={() => setCurrentIndex(question.number - 1)}
                                                className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${tone} ${question.isCurrent ? 'ring-2 ring-primary-400/40' : ''}`}
                                                aria-label={`Open review card ${question.number}`}
                                            >
                                                {question.number}
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="mt-4 space-y-2 text-xs text-dark-400">
                                    <p><span className="font-semibold text-accent-200">Green</span> means answered correctly.</p>
                                    <p><span className="font-semibold text-amber-200">Amber</span> means revisit this one.</p>
                                    <p><span className="font-semibold text-primary-200">Outlined</span> marks the current card.</p>
                                </div>
                            </div>

                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Current card</p>
                                <div className="mt-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Layers3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">{currentQuestion.topic.title}</p>
                                            <p className="mt-1 text-sm text-dark-400">From {currentQuestion.track.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">{currentQuestion.daysOverdue} day{currentQuestion.daysOverdue === 1 ? '' : 's'} overdue</p>
                                            <p className="mt-1 text-sm text-dark-400">Higher overdue counts usually mean this card needs attention.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <RotateCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">{currentQuestion.repetitions} successful reviews</p>
                                            <p className="mt-1 text-sm text-dark-400">Repetition count grows as the card becomes more stable.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Shortcuts if useful</p>
                                <div className="mt-4 space-y-3 text-sm text-dark-300">
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3">
                                        <span>Select an option</span>
                                        <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-200">1-4</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3">
                                        <span>Check answer</span>
                                        <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-200">Enter</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3">
                                        <span>Move between cards</span>
                                        <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-200">← →</span>
                                    </div>
                                </div>
                            </div>

                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Study reminder</p>
                                <div className="mt-4 flex items-start gap-3">
                                    <BookOpenCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                    <p className="text-sm leading-7 text-dark-300">Review is most useful when you still read the explanation after a correct answer. That keeps the next interval honest.</p>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    )
}
