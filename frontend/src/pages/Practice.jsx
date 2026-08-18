import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, CircleX, ClipboardCheck, Lightbulb, PlayCircle, Target } from 'lucide-react'
import { api } from '../lib/api'
import OrderingQuestion from '../components/question-types/OrderingQuestion'
import SliderQuestion from '../components/question-types/SliderQuestion'
import MultiStepQuestion from '../components/question-types/MultiStepQuestion'
import ImageLabelQuestion from '../components/question-types/ImageLabelQuestion'
import XPAnimation from '../components/gamification/XPAnimation'
import HintButton from '../components/hints/HintButton'
import QuestionReportButton from '../components/QuestionReportButton'

function QuestionCard({ question, onAnswer, showResult, result, submittedAnswer }) {
    const [selected, setSelected] = useState(null)
    const [textAnswer, setTextAnswer] = useState('')

    const options = question.options || []
    const isMultiChoice =
        question.type === 'mcq' ||
        question.type === 'true_false' ||
        (question.type === 'scenario' && options.length > 0) ||
        (question.type === 'multi_step' && options.length > 0)

    const handleSubmit = () => {
        if (isMultiChoice && selected !== null) {
            onAnswer(String(selected))
        } else if (!isMultiChoice && textAnswer.trim()) {
            onAnswer(textAnswer.trim())
        }
    }

    useEffect(() => {
        if (submittedAnswer === undefined || submittedAnswer === null) {
            setSelected(null)
            setTextAnswer('')
            return
        }

        if (isMultiChoice) {
            const parsedIndex = Number(submittedAnswer)
            if (Number.isInteger(parsedIndex) && parsedIndex >= 0 && parsedIndex < options.length) {
                setSelected(parsedIndex)
                return
            }

            const matchedIndex = options.findIndex(
                (option) => String(option).trim().toLowerCase() === String(submittedAnswer).trim().toLowerCase()
            )
            setSelected(matchedIndex >= 0 ? matchedIndex : null)
            return
        }

        setTextAnswer(String(submittedAnswer))
    }, [submittedAnswer, isMultiChoice, options, question.id])

    useEffect(() => {
        if (showResult) return

        const handleKeyDown = (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return

            if (isMultiChoice && ['1', '2', '3', '4'].includes(event.key)) {
                const index = parseInt(event.key, 10) - 1
                if (index < options.length) {
                    setSelected(index)
                }
            }

            if (event.key === 'Enter') {
                event.preventDefault()
                if (isMultiChoice && selected !== null) {
                    onAnswer(String(selected))
                } else if (!isMultiChoice && textAnswer.trim()) {
                    onAnswer(textAnswer.trim())
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showResult, isMultiChoice, options, selected, textAnswer, onAnswer])

    return (
        <div className="progress-panel">
            <div className="mb-6">
                <span className="badge badge-neutral mb-3">
                    {question.type.replace('_', ' ').toUpperCase()} • Level {question.ukLevel}
                </span>
                <p className="text-xl leading-relaxed text-dark-100">{question.prompt}</p>
            </div>

            {question.imageUrl && (
                <div className="mb-6 flex justify-center overflow-hidden rounded-xl border border-dark-700 bg-dark-900/50 p-4">
                    <img
                        src={question.imageUrl}
                        alt="Question Diagram"
                        className="max-h-64 rounded-lg object-contain shadow-lg"
                    />
                </div>
            )}

            {isMultiChoice ? (
                <div className="mb-6 space-y-3">
                    {options.map((option, index) => {
                        const isSelected = selected === index
                        const isCorrect = showResult && result?.isCorrect && isSelected
                        const isWrong = showResult && !result?.isCorrect && isSelected
                        const isActualCorrect = showResult && (
                            result?.correctAnswer === option ||
                            result?.correctAnswer === index
                        )

                        return (
                            <button
                                key={index}
                                onClick={() => !showResult && setSelected(index)}
                                disabled={showResult}
                                className={`w-full rounded-2xl border p-4 text-left transition-all ${isCorrect
                                    ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                                    : isWrong
                                        ? 'border-red-500 bg-red-500/20 text-red-300'
                                        : isActualCorrect
                                            ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                                            : isSelected
                                                ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                                                : 'border-dark-600 bg-dark-800 text-dark-200 hover:border-dark-500'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${isSelected || isActualCorrect ? 'bg-current/20' : 'bg-dark-700'}`}>
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="flex-1">{option}</span>
                                    {!showResult && (
                                        <span className="hidden rounded bg-dark-700 px-2 py-1 text-xs text-dark-500 sm:inline">
                                            {index + 1}
                                        </span>
                                    )}
                                    {!showResult && isSelected && (
                                        <span className="rounded bg-primary-500/20 px-2 py-1 text-xs text-primary-200">
                                            Selected
                                        </span>
                                    )}
                                    {isActualCorrect && !isCorrect && (
                                        <span className="rounded bg-accent-500/20 px-2 py-1 text-xs text-accent-100">
                                            Correct answer
                                        </span>
                                    )}
                                    {isWrong && (
                                        <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-100">
                                            Your answer
                                        </span>
                                    )}
                                    {isCorrect && (
                                        <span className="rounded bg-accent-500/20 px-2 py-1 text-xs text-accent-100">
                                            Correct
                                        </span>
                                    )}
                                    {isCorrect && <CheckCircle2 className="h-5 w-5" />}
                                    {isWrong && <CircleX className="h-5 w-5" />}
                                </span>
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div className="mb-6">
                    <input
                        type="text"
                        value={textAnswer}
                        onChange={(event) => setTextAnswer(event.target.value)}
                        disabled={showResult}
                        className="input"
                        placeholder="Type your answer..."
                    />
                </div>
            )}

            {showResult ? (
                <div className={`rounded-2xl p-4 ${result?.isCorrect
                    ? 'border border-accent-500/30 bg-accent-500/10'
                    : 'border border-amber-500/30 bg-amber-500/10'
                    }`}>
                    <div className="mb-2 flex items-center gap-2">
                        {result?.isCorrect ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-accent-400" />
                                <span className="font-medium text-accent-400">Correct</span>
                            </>
                        ) : (
                            <>
                                <CircleX className="h-5 w-5 text-amber-400" />
                                <span className="font-medium text-amber-400">Not quite yet</span>
                            </>
                        )}
                    </div>
                    <p className="text-sm text-dark-300">{result?.explanation}</p>
                </div>
            ) : (
                <>
                    <button
                        onClick={handleSubmit}
                        disabled={isMultiChoice ? selected === null : !textAnswer.trim()}
                        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Check Answer
                        <span className="ml-2 hidden text-xs opacity-70 sm:inline">↵</span>
                    </button>

                    <div className="mt-4 hidden items-center justify-center gap-4 text-xs text-dark-500 sm:flex">
                        <span>Press <kbd className="rounded bg-dark-700 px-1.5 py-0.5">1-4</kbd> to select</span>
                        <span>Press <kbd className="rounded bg-dark-700 px-1.5 py-0.5">Enter</kbd> to submit</span>
                        <span><kbd className="rounded bg-dark-700 px-1.5 py-0.5">←</kbd> <kbd className="rounded bg-dark-700 px-1.5 py-0.5">→</kbd> to navigate</span>
                    </div>

                    <HintButton
                        hints={question.hints || []}
                        onHintUsed={(count) => console.log(`Hint ${count} revealed`)}
                    />
                </>
            )}
        </div>
    )
}

function QuestionRenderer({ question, onAnswer, showResult, result, submittedAnswer }) {
    let renderer
    switch (question.type) {
        case 'ordering':
            renderer = <OrderingQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
            break
        case 'slider':
            renderer = <SliderQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
            break
        case 'multi_step':
            try {
                if (question.assets) {
                    const assets = typeof question.assets === 'string' ? JSON.parse(question.assets) : question.assets
                    if (Array.isArray(assets?.steps) && assets.steps.length > 0) {
                        renderer = <MultiStepQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
                    }
                }
            } catch {
                // Fall back to the standard card for malformed assets.
            }
            if (!renderer) renderer = <QuestionCard question={question} onAnswer={onAnswer} showResult={showResult} result={result} submittedAnswer={submittedAnswer} />
            break
        case 'image_label':
            renderer = <ImageLabelQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
            break
        case 'mcq':
        case 'true_false':
        default:
            renderer = <QuestionCard question={question} onAnswer={onAnswer} showResult={showResult} result={result} submittedAnswer={submittedAnswer} />
            break
    }

    return <>
        {renderer}
        <QuestionReportButton
            question={question}
            context={{ surface: 'practice', topicId: question.topic?.id, answered: showResult }}
        />
    </>
}

function getPracticeQuestionStatus(questionId, results) {
    const result = results[questionId]
    if (!result) return 'pending'
    return result.isCorrect ? 'correct' : 'incorrect'
}

export default function Practice() {
    const { topicId } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [results, setResults] = useState({})
    const [submittedAnswers, setSubmittedAnswers] = useState({})
    const [error, setError] = useState(null)
    const [showXPAnimation, setShowXPAnimation] = useState(false)
    const [lastXPResult, setLastXPResult] = useState(null)

    useEffect(() => {
        async function fetchPractice() {
            try {
                setCurrentIndex(0)
                setResults({})
                setSubmittedAnswers({})
                setError(null)
                const response = await api(`/practice/${topicId}?limit=10`)
                setData(response)
            } catch (err) {
                toast.error(err.message || 'Failed to load questions')
                setError(err.message || 'Failed to load questions')
            } finally {
                setLoading(false)
            }
        }
        fetchPractice()
    }, [topicId])

    const handleAnswer = async (answer) => {
        if (!data?.questions[currentIndex]) return

        const question = data.questions[currentIndex]

        try {
            const result = await api('/practice/submit', {
                method: 'POST',
                body: { questionId: question.id, answer },
            })

            setResults((previous) => ({
                ...previous,
                [question.id]: result,
            }))
            setSubmittedAnswers((previous) => ({
                ...previous,
                [question.id]: answer,
            }))

            if (result.isCorrect && result.xp) {
                setLastXPResult(result.xp)
                setShowXPAnimation(true)
            }
        } catch {
            toast.error('Failed to submit answer. Please try again.')
        }
    }

    const handleNext = () => {
        if (currentIndex < data.questions.length - 1) {
            setCurrentIndex((previous) => previous + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((previous) => previous - 1)
        }
    }

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return

            if (event.key === 'ArrowRight' && data && currentIndex < data.questions.length - 1) {
                handleNext()
            } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
                handlePrev()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [data, currentIndex])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl">
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
                        <h1 className="mt-6 mb-4 text-2xl font-bold text-dark-50">Error Loading Questions</h1>
                        <p className="mb-6 text-dark-400">{error}</p>
                        <button onClick={() => navigate(-1)} className="btn-secondary">
                            <ArrowLeft className="h-4 w-4" />
                            Go back
                        </button>
                    </div>
                    {import.meta.env.DEV && (
                        <div className="mt-4 rounded border border-red-900 bg-red-900/10 p-4 font-mono text-xs text-red-400">
                            DEBUG: Topic={topicId}
                        </div>
                    )}
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
                        <h1 className="mt-6 mb-4 text-2xl font-bold text-dark-50">No Questions Yet</h1>
                        <p className="mb-6 text-dark-400">Practice questions for this topic are being developed. Check back soon.</p>
                        <button onClick={() => navigate(-1)} className="btn-secondary">
                            <ArrowLeft className="h-4 w-4" />
                            Go back
                        </button>
                    </div>
                    {import.meta.env.DEV && (
                        <div className="mt-4 rounded border border-red-900 bg-red-900/10 p-4 text-xs text-red-400">
                            DEBUG: Data is {data ? 'Empty Array' : 'NULL'}. Topic: {topicId}.
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const currentQuestion = data.questions[currentIndex]
    const currentResult = results[currentQuestion.id]
    const answeredCount = Object.keys(results).length
    const correctCount = Object.values(results).filter((entry) => entry.isCorrect).length
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    const incorrectCount = answeredCount - correctCount
    const remainingCount = data.questions.length - answeredCount
    const sessionGuidance = answeredCount === 0
        ? 'Start with the current question and use the explanation as your main revision tool.'
        : accuracy < 60
            ? 'Slow down on missed questions and reopen the topic notes if the explanation still feels unclear.'
            : accuracy < 85
                ? 'Good progress. Finish the set, then revisit the questions marked for another look.'
                : 'Strong session so far. Finish the set and move on only after reading the feedback.'
    const questionStatuses = data.questions.map((question, index) => ({
        id: question.id,
        number: index + 1,
        isCurrent: index === currentIndex,
        status: getPracticeQuestionStatus(question.id, results),
    }))

    return (
        <div className="py-12">
            <XPAnimation
                xpData={lastXPResult}
                show={showXPAnimation}
                onComplete={() => setShowXPAnimation(false)}
            />

            <div className="container-app max-w-6xl">
                <nav className="mb-4 text-sm">
                    <Link to="/tracks" className="text-dark-400 hover:text-dark-200">Pathways</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to={`/track/${data.track.slug}`} className="text-dark-400 hover:text-dark-200">{data.track.title}</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to={`/topic/${topicId}`} className="text-dark-400 hover:text-dark-200">{data.topic.title}</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">Practice</span>
                </nav>

                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <Target className="h-3.5 w-3.5" />
                                Practice session
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">Use practice to see what needs another look.</h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                This session covers {data.topic.title} in {data.track.title}. Take it one question at a time. The goal is not speed. The goal is to spot what to revisit before you move on.
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Answered</p>
                                    <p className="learning-stat-value">{answeredCount}</p>
                                    <p className="mt-2 text-sm text-dark-400">Out of {data.questions.length} questions</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Correct</p>
                                    <p className="learning-stat-value">{correctCount}</p>
                                    <p className="mt-2 text-sm text-dark-400">Questions you have secured</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">To revisit</p>
                                    <p className="learning-stat-value">{incorrectCount}</p>
                                    <p className="mt-2 text-sm text-dark-400">Questions that need another look</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Remaining</p>
                                    <p className="learning-stat-value">{remainingCount}</p>
                                    <p className="mt-2 text-sm text-dark-400">Still to complete in this set</p>
                                </div>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Current question</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Question {currentIndex + 1} of {data.questions.length}</h2>
                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-dark-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                                    style={{ width: `${((currentIndex + 1) / data.questions.length) * 100}%` }}
                                />
                            </div>

                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpenCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Read the explanation every time</p>
                                            <p className="mt-1 text-dark-400">That is where this stops being a quiz and becomes useful revision.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Use hints before guessing</p>
                                            <p className="mt-1 text-dark-400">That keeps the session honest and helps you learn the gap instead of hiding it.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-500">Session guide</p>
                                    <p className="mt-3 text-sm leading-7 text-dark-300">{sessionGuidance}</p>
                                </div>
                                <Link to={`/topic/${topicId}`} className="btn-ghost w-full justify-center">
                                    Review topic notes
                                    <BookOpenCheck className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                    <div>
                        <QuestionRenderer
                            key={currentQuestion.id}
                            question={currentQuestion}
                            onAnswer={handleAnswer}
                            showResult={!!currentResult}
                            result={currentResult}
                            submittedAnswer={submittedAnswers[currentQuestion.id]}
                        />

                        <div className="mt-6 flex items-center justify-between gap-3">
                            <button onClick={handlePrev} disabled={currentIndex === 0} className="btn-secondary disabled:opacity-50">
                                <ArrowLeft className="h-4 w-4" />
                                Previous
                            </button>

                            <span className="text-center text-sm text-dark-400">Question {currentIndex + 1} of {data.questions.length}</span>

                            {currentIndex < data.questions.length - 1 ? (
                                <button onClick={handleNext} className="btn-primary">
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <Link to={`/track/${data.track.slug}`} className="btn-primary">
                                    Finish
                                    <PlayCircle className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Session stats</p>
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
                                        <span className="text-dark-400">Accuracy</span>
                                        <span className="text-dark-200">{accuracy}%</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-dark-800">
                                        <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${accuracy}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Question map</p>
                            <div className="mt-4 grid grid-cols-5 gap-2">
                                {questionStatuses.map((question) => {
                                    const tone = question.status === 'correct'
                                        ? 'border-accent-500/40 bg-accent-500/15 text-accent-100'
                                        : question.status === 'incorrect'
                                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                                            : 'border-dark-700 bg-dark-900/60 text-dark-300 hover:border-dark-500'

                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => setCurrentIndex(question.number - 1)}
                                            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${tone} ${question.isCurrent ? 'ring-2 ring-primary-400/40' : ''}`}
                                            aria-label={`Open question ${question.number}`}
                                        >
                                            {question.number}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="mt-4 space-y-2 text-xs text-dark-400">
                                <p><span className="font-semibold text-accent-200">Green</span> means correct.</p>
                                <p><span className="font-semibold text-amber-200">Amber</span> means revisit.</p>
                                <p><span className="font-semibold text-primary-200">Outlined</span> means your current question.</p>
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Shortcuts if useful</p>
                            <div className="mt-4 space-y-3 text-sm text-dark-300">
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3">
                                    <span>Select an option</span>
                                    <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-200">1-4</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3">
                                    <span>Submit answer</span>
                                    <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-200">Enter</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3">
                                    <span>Move between questions</span>
                                    <span className="rounded bg-dark-700 px-2 py-1 text-xs text-dark-200">← →</span>
                                </div>
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Next best step</p>
                            <div className="mt-4 flex flex-col gap-3">
                                <Link to={`/topic/${topicId}`} className="btn-secondary w-full justify-center">
                                    Review this topic
                                </Link>
                                <Link to={`/track/${data.track.slug}#topic-outline`} className="btn-ghost w-full justify-center">
                                    Open course map
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
