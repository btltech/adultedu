import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BookOpenCheck,
    CheckCircle2,
    CircleX,
    ClipboardCheck,
    Info,
    ListChecks,
    RotateCcw,
    ShieldCheck,
    Target,
    Trophy,
} from 'lucide-react'
import { api, getUserMessage } from '../lib/api'
import QuestionReportButton from '../components/QuestionReportButton'

const TRACK_SLUG = 'life-in-the-uk-test'
const DEFAULT_LIMIT = 24

function MockTestQuestion({
    question,
    selectedIndex,
    onSelect,
    showResult,
    result,
}) {
    return (
        <div className="progress-panel">
            <div className="mb-6">
                <div className="mb-3 flex flex-wrap gap-2">
                    <span className="badge badge-primary">Life in the UK mock test</span>
                    <span className="badge badge-neutral">{question.topic?.title || 'Mixed topic'}</span>
                </div>
                <p className="text-xl leading-relaxed text-dark-100">{question.prompt}</p>
            </div>

            <div className="mb-5 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300">
                <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                    <div>
                        <p className="font-medium text-dark-100">Keyboard shortcuts are available while you answer.</p>
                        <p className="mt-1 text-dark-400">Press 1-4 to select an option, Enter to submit or move on, and the arrow keys to switch questions.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {(question.options || []).map((option, index) => {
                    const isSelected = selectedIndex === index
                    const isCorrectSelection = showResult && result?.isCorrect && isSelected
                    const isWrongSelection = showResult && !result?.isCorrect && isSelected
                    const isActualCorrect = showResult && result?.correctAnswer === option

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => !showResult && onSelect(index)}
                            disabled={showResult}
                            aria-pressed={isSelected}
                            className={`w-full rounded-2xl border p-4 text-left transition-all ${isCorrectSelection
                                ? 'border-accent-500 bg-accent-500/20 text-accent-200'
                                : isWrongSelection
                                    ? 'border-amber-500 bg-amber-500/20 text-amber-100'
                                    : isActualCorrect
                                        ? 'border-accent-500 bg-accent-500/20 text-accent-200'
                                        : isSelected
                                            ? 'border-primary-500 bg-primary-500/20 text-primary-200'
                                            : 'border-dark-600 bg-dark-800 text-dark-200 hover:border-dark-500'
                                }`}
                        >
                            <span className="flex items-start gap-3">
                                <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-medium ${isSelected || isActualCorrect ? 'bg-current/20' : 'bg-dark-700'}`}>
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="flex-1 leading-7">{option}</span>
                                <span className="flex flex-wrap items-center justify-end gap-2">
                                    {!showResult && isSelected && <span className="badge badge-primary">Selected</span>}
                                    {showResult && isWrongSelection && <span className="badge badge-warning">Your answer</span>}
                                    {showResult && isActualCorrect && <span className="badge badge-success">Correct answer</span>}
                                    {isCorrectSelection && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
                                    {isWrongSelection && <CircleX className="h-5 w-5 flex-shrink-0" />}
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>

            {showResult && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`mt-6 rounded-2xl p-4 ${result?.isCorrect
                        ? 'border border-accent-500/30 bg-accent-500/10'
                        : 'border border-amber-500/30 bg-amber-500/10'
                        }`}
                >
                    <div className="mb-2 flex items-center gap-2">
                        {result?.isCorrect ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-accent-400" />
                                <span className="font-medium text-accent-300">Correct answer confirmed</span>
                            </>
                        ) : (
                            <>
                                <CircleX className="h-5 w-5 text-amber-300" />
                                <span className="font-medium text-amber-200">Incorrect answer</span>
                            </>
                        )}
                    </div>
                    <p className="text-sm leading-7 text-dark-300">{result?.explanation}</p>

                    {question.topic?.id && (
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Link to={`/topic/${question.topic.id}`} className="btn-secondary px-4 py-2 text-sm">
                                Review this topic
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link to="/track/life-in-the-uk-test" className="btn-ghost px-4 py-2 text-sm">
                                Pathway overview
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>
            )}

            <QuestionReportButton
                question={question}
                context={{ surface: 'life-in-uk-mock-test', trackSlug: TRACK_SLUG, topicId: question.topic?.id, selectedAnswerIndex: selectedIndex, answered: showResult }}
            />
        </div>
    )
}

function QuestionIndexPanel({ questions, currentIndex, results, selectedAnswers, onJump }) {
    return (
        <div className="progress-panel">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Question index</p>
            <div className="mt-3 flex items-start gap-3 text-sm text-dark-300">
                <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                <p>Jump straight to any question to review or change what you have already answered.</p>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-4">
                {questions.map((question, index) => {
                    const result = results[question.id]
                    const isCurrent = index === currentIndex
                    const hasSelection = selectedAnswers[question.id] !== undefined
                    const statusLabel = result
                        ? result.isCorrect ? 'answered correctly' : 'answered incorrectly'
                        : hasSelection
                            ? 'selected but not submitted'
                            : 'not answered'

                    return (
                        <button
                            key={question.id}
                            type="button"
                            onClick={() => onJump(index)}
                            aria-current={isCurrent ? 'step' : undefined}
                            aria-label={`Jump to question ${index + 1}, ${statusLabel}`}
                            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${isCurrent
                                ? 'border-primary-500 bg-primary-500/20 text-primary-200'
                                : result?.isCorrect
                                    ? 'border-accent-500/40 bg-accent-500/10 text-accent-200'
                                    : result
                                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                                        : hasSelection
                                            ? 'border-dark-500 bg-dark-800 text-dark-100'
                                            : 'border-dark-800/80 bg-dark-900/60 text-dark-300 hover:border-dark-600'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1">
                                <span>{index + 1}</span>
                                {result?.isCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                                {result && !result.isCorrect && <CircleX className="h-3.5 w-3.5" />}
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-dark-400">
                <span className="badge badge-primary">Current</span>
                <span className="badge badge-success">Correct</span>
                <span className="badge badge-warning">Incorrect</span>
                <span className="badge badge-neutral">Selected</span>
            </div>
        </div>
    )
}

export default function LifeInUkTest() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [results, setResults] = useState({})
    const [selectedAnswers, setSelectedAnswers] = useState({})
    const [error, setError] = useState(null)
    const resultSummaryRef = useRef(null)

    const fetchMockTest = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await api(`/public/practice/tracks/${TRACK_SLUG}?limit=${DEFAULT_LIMIT}`)
            setData(response)
            setCurrentIndex(0)
            setResults({})
            setSelectedAnswers({})
        } catch (requestError) {
            const message = getUserMessage(
                requestError,
                "The mock test isn't available right now. Please try again shortly."
            )
            toast.error(message)
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMockTest()
    }, [])

    const currentQuestion = data?.questions?.[currentIndex] || null
    const currentResult = currentQuestion ? results[currentQuestion.id] : null
    const currentSelection = currentQuestion ? selectedAnswers[currentQuestion.id] ?? null : null
    const answeredCount = Object.keys(results).length
    const correctCount = Object.values(results).filter((entry) => entry.isCorrect).length
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const passMark = data?.passMark ?? Math.ceil(DEFAULT_LIMIT * 0.75)
    const isComplete = !!data && answeredCount === data.questions.length && data.questions.length > 0
    const hasPassed = correctCount >= passMark

    const topicBreakdown = useMemo(() => {
        if (!data?.questions?.length) return []

        const map = new Map()
        for (const question of data.questions) {
            const key = question.topic?.title || 'Mixed topic'
            const existing = map.get(key) || {
                id: question.topic?.id || null,
                title: key,
                total: 0,
                correct: 0,
            }
            existing.total += 1
            if (results[question.id]?.isCorrect) existing.correct += 1
            map.set(key, existing)
        }

        return [...map.values()].sort((left, right) => (left.correct / left.total) - (right.correct / right.total))
    }, [data, results])

    const handleSelectAnswer = (index) => {
        if (!currentQuestion || currentResult) return

        setSelectedAnswers((previous) => ({
            ...previous,
            [currentQuestion.id]: index,
        }))
    }

    const handlePrev = () => {
        if (!data?.questions?.length) return
        setCurrentIndex((previous) => Math.max(0, previous - 1))
    }

    const handleNext = () => {
        if (!data?.questions?.length) return
        setCurrentIndex((previous) => Math.min(data.questions.length - 1, previous + 1))
    }

    const handleAnswer = async (answer) => {
        if (!currentQuestion || currentResult) return

        try {
            const result = await api(`/public/practice/tracks/${TRACK_SLUG}/submit`, {
                method: 'POST',
                body: { questionId: currentQuestion.id, answer },
            })

            setResults((previous) => ({
                ...previous,
                [currentQuestion.id]: result,
            }))
        } catch {
            toast.error('Failed to submit answer. Please try again.')
        }
    }

    const handlePrimaryAction = () => {
        if (!currentQuestion) return

        if (!currentResult) {
            if (currentSelection !== null) {
                handleAnswer(String(currentSelection))
            }
            return
        }

        if (currentIndex < data.questions.length - 1) {
            handleNext()
            return
        }

        if (isComplete && resultSummaryRef.current) {
            resultSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!data?.questions?.length || !currentQuestion) return
            if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return

            if (['1', '2', '3', '4'].includes(event.key)) {
                const index = Number.parseInt(event.key, 10) - 1
                if (index >= 0 && index < (currentQuestion.options?.length || 0) && !currentResult) {
                    setSelectedAnswers((previous) => ({
                        ...previous,
                        [currentQuestion.id]: index,
                    }))
                }
                return
            }

            if (event.key === 'Enter') {
                if ((!currentResult && currentSelection !== null) || currentResult) {
                    event.preventDefault()
                    handlePrimaryAction()
                }
                return
            }

            if (event.key === 'ArrowRight' && currentIndex < data.questions.length - 1) {
                setCurrentIndex((previous) => previous + 1)
            }

            if (event.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex((previous) => previous - 1)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, currentQuestion, currentResult, currentSelection, data])

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

    if (error) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl">
                    <div className="editorial-panel p-12 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/12 text-red-400">
                            <AlertTriangle className="h-7 w-7" />
                        </div>
                        <h1 className="mb-4 mt-6 text-2xl font-bold text-dark-50">Unable to load the mock test</h1>
                        <p className="mb-6 text-dark-400">{error}</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <button onClick={fetchMockTest} className="btn-primary">
                                Try again
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <Link to="/track/life-in-the-uk-test" className="btn-secondary">
                                Back to pathway
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!data || data.questions.length === 0) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl">
                    <div className="editorial-panel p-12 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/12 text-primary-300">
                            <ClipboardCheck className="h-7 w-7" />
                        </div>
                        <h1 className="mb-4 mt-6 text-2xl font-bold text-dark-50">Mock test coming soon</h1>
                        <p className="mb-6 text-dark-400">The Life in the UK question set is still being prepared.</p>
                        <Link to="/track/life-in-the-uk-test" className="btn-secondary">
                            Back to pathway
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="py-12 pb-40">
            <div className="container-app max-w-6xl">
                <nav className="mb-4 text-sm" aria-label="Breadcrumb">
                    <Link to="/tracks" className="text-dark-400 hover:text-dark-200">Pathways</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to="/track/life-in-the-uk-test" className="text-dark-400 hover:text-dark-200">Life in the UK Test Preparation</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">Free mock test</span>
                </nav>

                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Free public practice test
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">
                                Take a Life in the UK mock test without creating an account.
                            </h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                This public session gives you {data.questions.length} practice questions across British values, history, society, geography, and government. It is designed for revision confidence and should be used alongside official Life in the UK guidance.
                            </p>

                            <div className="mt-5 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm leading-7 text-dark-300">
                                <div className="flex items-start gap-3">
                                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                    <p>AdultEdu is independent and not affiliated with GOV.UK or the official test provider. Treat your score as a practice signal, not an official result.</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Questions</p>
                                    <p className="learning-stat-value">{data.questions.length}</p>
                                    <p className="mt-2 text-sm text-dark-400">Balanced across the full handbook</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Pass mark</p>
                                    <p className="learning-stat-value">{passMark}</p>
                                    <p className="mt-2 text-sm text-dark-400">Practice target based on 75%</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Answered</p>
                                    <p className="learning-stat-value">{answeredCount}</p>
                                    <p className="mt-2 text-sm text-dark-400">Out of {data.questions.length} questions</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Accuracy</p>
                                    <p className="learning-stat-value">{accuracy}%</p>
                                    <p className="mt-2 text-sm text-dark-400">Updates as you move through the set</p>
                                </div>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">How to use it</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Treat it like a check on recall, not a speed race.</h2>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Mixed-topic test</p>
                                            <p className="mt-1 text-dark-400">Questions are drawn across all five Life in the UK topics instead of staying in one chapter.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpenCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Use the explanations and revision links</p>
                                            <p className="mt-1 text-dark-400">Every answer shows an explanation and can send you back to the relevant topic if you hit a weak area.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <button onClick={fetchMockTest} className="btn-primary w-full justify-center">
                                    Start a fresh mock test
                                    <RotateCcw className="h-4 w-4" />
                                </button>
                                <Link to="/track/life-in-the-uk-test" className="btn-ghost w-full justify-center">
                                    Back to pathway overview
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {isComplete && (
                    <section ref={resultSummaryRef} className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                        <div className="progress-panel">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${hasPassed ? 'bg-accent-500/15 text-accent-300' : 'bg-amber-500/15 text-amber-300'}`}>
                                    {hasPassed ? <Trophy className="h-7 w-7" /> : <ClipboardCheck className="h-7 w-7" />}
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Final result</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-dark-50">
                                        {hasPassed ? 'Pass standard reached.' : 'Below the current pass line.'}
                                    </h2>
                                    <p className="mt-2 text-sm leading-7 text-dark-300">
                                        You answered {correctCount} of {data.questions.length} correctly. {hasPassed
                                            ? 'That meets the usual 75% threshold used for the official test.'
                                            : `Aim for at least ${passMark} correct answers and focus your next revision on the weaker topics below.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Topic breakdown</p>
                            <div className="mt-4 space-y-3">
                                {topicBreakdown.map((topic) => (
                                    <div key={topic.title} className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="font-medium text-dark-100">{topic.title}</span>
                                            <span className="text-dark-400">{topic.correct}/{topic.total}</span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-dark-800">
                                            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${Math.round((topic.correct / topic.total) * 100)}%` }} />
                                        </div>
                                        {topic.id && (
                                            <Link to={`/topic/${topic.id}`} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-300">
                                                Review this topic
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                    <div className="space-y-6">
                        <MockTestQuestion
                            key={currentQuestion.id}
                            question={currentQuestion}
                            selectedIndex={currentSelection}
                            onSelect={handleSelectAnswer}
                            showResult={!!currentResult}
                            result={currentResult}
                        />

                        <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300 xl:hidden">
                            <div className="flex items-start gap-3">
                                <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                <p>Use the question index below to jump around the set instead of moving one question at a time.</p>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                        <QuestionIndexPanel
                            questions={data.questions}
                            currentIndex={currentIndex}
                            results={results}
                            selectedAnswers={selectedAnswers}
                            onJump={setCurrentIndex}
                        />

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Session progress</p>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-dark-400">Completion</span>
                                        <span className="text-dark-200">{answeredCount}/{data.questions.length}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                                        <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${(answeredCount / data.questions.length) * 100}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-dark-400">Score</span>
                                        <span className="text-dark-200">{correctCount}/{data.questions.length}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                                        <div className={`h-full rounded-full transition-all ${hasPassed ? 'bg-accent-500' : 'bg-amber-500'}`} style={{ width: `${(correctCount / data.questions.length) * 100}%` }} />
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3 text-sm text-dark-300">
                                    <span className="font-medium text-dark-100">Current question:</span> {currentIndex + 1} of {data.questions.length}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 px-4 md:bottom-4">
                <div className="container-app max-w-6xl">
                    <div className="pointer-events-auto rounded-[1.5rem] border border-dark-700/80 bg-dark-950/95 p-3 shadow-2xl backdrop-blur-md">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-dark-300">
                                <span className="font-medium text-dark-100">Question {currentIndex + 1} of {data.questions.length}</span>
                                <span className="mx-2 text-dark-600">•</span>
                                <span>{currentResult ? 'Answer checked' : currentSelection !== null ? 'Answer selected' : 'Choose an option to continue'}</span>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <button onClick={handlePrev} disabled={currentIndex === 0} className="btn-secondary w-full justify-center disabled:opacity-50 sm:w-auto">
                                    <ArrowLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <button
                                    onClick={handlePrimaryAction}
                                    disabled={!currentResult && currentSelection === null}
                                    className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[190px]"
                                >
                                    {!currentResult
                                        ? 'Check answer'
                                        : currentIndex < data.questions.length - 1
                                            ? 'Next question'
                                            : 'Review results'}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
