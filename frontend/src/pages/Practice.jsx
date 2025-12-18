import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import OrderingQuestion from '../components/question-types/OrderingQuestion'
import SliderQuestion from '../components/question-types/SliderQuestion'
import MultiStepQuestion from '../components/question-types/MultiStepQuestion'
import ImageLabelQuestion from '../components/question-types/ImageLabelQuestion'
import XPAnimation from '../components/gamification/XPAnimation'
import HintButton from '../components/hints/HintButton'

const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const XIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

function QuestionCard({ question, onAnswer, showResult, result }) {
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
            onAnswer(options[selected])
        } else if (!isMultiChoice && textAnswer.trim()) {
            onAnswer(textAnswer.trim())
        }
    }

    // Keyboard shortcuts for option selection and submission
    useEffect(() => {
        if (showResult) return // Don't handle keys after answer shown

        const handleKeyDown = (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            // Number keys 1-4 to select options
            if (isMultiChoice && ['1', '2', '3', '4'].includes(e.key)) {
                const index = parseInt(e.key) - 1
                if (index < options.length) {
                    setSelected(index)
                }
            }

            // Enter to submit
            if (e.key === 'Enter') {
                e.preventDefault()
                if (isMultiChoice && selected !== null) {
                    onAnswer(options[selected])
                } else if (!isMultiChoice && textAnswer.trim()) {
                    onAnswer(textAnswer.trim())
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showResult, isMultiChoice, options, selected, textAnswer, onAnswer])

    return (
        <div className="glass-card p-6">
            {/* Question prompt */}
            <div className="mb-6">
                <span className="badge badge-neutral mb-3">
                    {question.type.replace('_', ' ').toUpperCase()} • Level {question.ukLevel}
                </span>
                <p className="text-lg text-dark-100 leading-relaxed">{question.prompt}</p>
            </div>

            {/* Question Image (Brilliant-style visual) */}
            {question.imageUrl && (
                <div className="mb-6 rounded-xl overflow-hidden bg-dark-900/50 border border-dark-700 flex justify-center p-4">
                    <img
                        src={question.imageUrl}
                        alt="Question Diagram"
                        className="max-h-64 object-contain rounded-lg shadow-lg"
                    />
                </div>
            )}

            {/* Answer options */}
            {isMultiChoice ? (
                <div className="space-y-3 mb-6">
                    {options.map((option, index) => {
                        const isSelected = selected === index
                        const isCorrect = showResult && result?.isCorrect && isSelected
                        const isWrong = showResult && !result?.isCorrect && isSelected
                        // Check if this option matches the returned correct answer string
                        const isActualCorrect = showResult && (
                            result?.correctAnswer === option ||
                            result?.correctAnswer === index // Fallback if backend returns index
                        )

                        return (
                            <button
                                key={index}
                                onClick={() => !showResult && setSelected(index)}
                                disabled={showResult}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${isCorrect
                                    ? 'bg-accent-500/20 border-accent-500 text-accent-300'
                                    : isWrong
                                        ? 'bg-red-500/20 border-red-500 text-red-300'
                                        : isActualCorrect
                                            ? 'bg-accent-500/20 border-accent-500 text-accent-300'
                                            : isSelected
                                                ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                                                : 'bg-dark-800 border-dark-600 text-dark-200 hover:border-dark-500'
                                    }`}
                            >
                                <span className="flex items-center gap-3">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${isSelected || isActualCorrect
                                        ? 'bg-current/20'
                                        : 'bg-dark-700'
                                        }`}>
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span className="flex-1">{option}</span>
                                    {!showResult && (
                                        <span className="hidden sm:inline text-xs text-dark-500 bg-dark-700 px-2 py-1 rounded">
                                            {index + 1}
                                        </span>
                                    )}
                                    {isCorrect && <CheckIcon />}
                                    {isWrong && <XIcon />}
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
                        onChange={(e) => setTextAnswer(e.target.value)}
                        disabled={showResult}
                        className="input"
                        placeholder="Type your answer..."
                    />
                </div>
            )}

            {/* Submit or explanation */}
            {showResult ? (
                <div className={`p-4 rounded-xl ${result?.isCorrect
                    ? 'bg-accent-500/10 border border-accent-500/30'
                    : 'bg-amber-500/10 border border-amber-500/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        {result?.isCorrect ? (
                            <span className="text-accent-400 font-medium">✓ Correct!</span>
                        ) : (
                            <span className="text-amber-400 font-medium">✗ Not quite</span>
                        )}
                    </div>
                    <p className="text-dark-300 text-sm">{result?.explanation}</p>
                </div>
            ) : (
                <>
                    <button
                        onClick={handleSubmit}
                        disabled={isMultiChoice ? selected === null : !textAnswer.trim()}
                        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Check Answer
                        <span className="hidden sm:inline text-xs ml-2 opacity-70">↵</span>
                    </button>

                    {/* Keyboard hints */}
                    <div className="hidden sm:flex items-center justify-center gap-4 mt-4 text-xs text-dark-500">
                        <span>Press <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">1-4</kbd> to select</span>
                        <span>Press <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">Enter</kbd> to submit</span>
                        <span><kbd className="px-1.5 py-0.5 bg-dark-700 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-dark-700 rounded">→</kbd> to navigate</span>
                    </div>

                    {/* Progressive Hints */}
                    <HintButton
                        hints={question.hints || []}
                        onHintUsed={(count) => console.log(`Hint ${count} revealed`)}
                    />
                </>
            )}
        </div>
    )
}

function QuestionRenderer({ question, onAnswer, showResult, result }) {
    switch (question.type) {
        case 'ordering':
            return <OrderingQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
        case 'slider':
            return <SliderQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
        case 'multi_step':
            // Multi-step has two variants in this app:
            // - Scaffolded: assets.steps JSON is present (render MultiStepQuestion)
            // - MCQ-like legacy: no assets.steps (render as standard MCQ card)
            try {
                if (question.assets) {
                    const assets = typeof question.assets === 'string' ? JSON.parse(question.assets) : question.assets
                    if (Array.isArray(assets?.steps) && assets.steps.length > 0) {
                        return <MultiStepQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
                    }
                }
            } catch { }
            return <QuestionCard question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
        case 'image_label':
            return <ImageLabelQuestion question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
        case 'mcq':
        case 'true_false':
        default:
            return <QuestionCard question={question} onAnswer={onAnswer} showResult={showResult} result={result} />
    }
}

export default function Practice() {
    const { topicId } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [results, setResults] = useState({}) // questionId -> result
    const [answering, setAnswering] = useState(false)
    const [error, setError] = useState(null)
    const [showXPAnimation, setShowXPAnimation] = useState(false)
    const [lastXPResult, setLastXPResult] = useState(null)

    useEffect(() => {
        async function fetchPractice() {
            try {
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

        setAnswering(true)
        const question = data.questions[currentIndex]

        try {
            const result = await api('/practice/submit', {
                method: 'POST',
                body: { questionId: question.id, answer },
            })

            setResults(prev => ({
                ...prev,
                [question.id]: result,
            }))

            // Trigger XP animation for correct answers
            if (result.isCorrect && result.xp) {
                setLastXPResult(result.xp)
                setShowXPAnimation(true)
            }
        } catch (err) {
            toast.error('Failed to submit answer. Please try again.')
        } finally {
            setAnswering(false)
        }
    }

    const handleNext = () => {
        if (currentIndex < data.questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            // Arrow keys for navigation
            if (e.key === 'ArrowRight' && data && currentIndex < data.questions.length - 1) {
                handleNext()
            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                handlePrev()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [data, currentIndex])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-3xl">
                    <div className="skeleton h-8 w-64 mb-4" />
                    <div className="skeleton h-64 w-full" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-12">
                <div className="container-app max-w-3xl text-center">
                    <div className="text-6xl mb-6 text-red-500">⚠️</div>
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">Error Loading Questions</h1>
                    <p className="text-dark-400 mb-6">{error}</p>
                    {import.meta.env.DEV && (
                        <div className="text-xs text-red-400 mt-4 p-4 border border-red-900 bg-red-900/10 rounded font-mono">
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
                <div className="container-app max-w-3xl text-center">
                    <div className="text-6xl mb-6">📝</div>
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">No Questions Yet</h1>
                    <p className="text-dark-400 mb-6">
                        Practice questions for this topic are being developed. Check back soon!
                    </p>
                    {import.meta.env.DEV && (
                        <div className="text-xs text-red-400 mt-4 p-4 border border-red-900 bg-red-900/10 rounded">
                            DEBUG: Data is {data ? 'Empty Array' : 'NULL'}.
                            Topic: {topicId}.
                        </div>
                    )}
                    <button onClick={() => navigate(-1)} className="btn-secondary">
                        ← Go back
                    </button>
                </div>
            </div>
        )
    }

    const currentQuestion = data.questions[currentIndex]
    const currentResult = results[currentQuestion.id]
    const answeredCount = Object.keys(results).length
    const correctCount = Object.values(results).filter(r => r.isCorrect).length

    return (
        <div className="py-12">
            {/* XP Animation Overlay */}
            <XPAnimation
                xpData={lastXPResult}
                show={showXPAnimation}
                onComplete={() => setShowXPAnimation(false)}
            />

            <div className="container-app max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <nav className="text-sm mb-4">
                        <Link to={`/track/${data.track.slug}`} className="text-dark-400 hover:text-dark-200">
                            {data.track.title}
                        </Link>
                        <span className="mx-2 text-dark-600">/</span>
                        <Link to={`/topic/${topicId}`} className="text-dark-400 hover:text-dark-200">
                            {data.topic.title}
                        </Link>
                    </nav>

                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-dark-50">Practice</h1>
                        <span className="text-dark-400">
                            {answeredCount} / {data.questions.length} answered • {correctCount} correct
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-dark-800 rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                        style={{ width: `${((currentIndex + 1) / data.questions.length) * 100}%` }}
                    />
                </div>

                {/* Main Question Display */}
                <QuestionRenderer
                    key={currentQuestion.id}
                    question={currentQuestion}
                    onAnswer={handleAnswer}
                    showResult={!!currentResult}
                    result={currentResult}
                />

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className="btn-secondary disabled:opacity-50"
                    >
                        ← Previous
                    </button>

                    <span className="text-dark-400">
                        Question {currentIndex + 1} of {data.questions.length}
                    </span>

                    {currentIndex < data.questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            className="btn-primary"
                        >
                            Next →
                        </button>
                    ) : (
                        <Link to={`/track/${data.track.slug}`} className="btn-primary">
                            Finish
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
