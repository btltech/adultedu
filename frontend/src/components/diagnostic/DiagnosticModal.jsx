import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../../lib/api'

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const ArrowRightIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
)

export default function DiagnosticModal({ trackSlug, trackTitle, isOpen, onClose, onComplete }) {
    const [stage, setStage] = useState('intro') // intro, quiz, results
    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)
    const [selectedOption, setSelectedOption] = useState(null)
    const [error, setError] = useState('')
    const modalRef = useRef(null)
    const closeButtonRef = useRef(null)
    const previousFocusRef = useRef(null)

    // Fetch diagnostic questions when opening
    const fetchQuestions = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const data = await api(`/diagnostic/${trackSlug}/start`)
            setQuestions(data.questions)
        } catch (err) {
            console.error('Failed to load diagnostic:', err)
            setError('We could not load the assessment. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [trackSlug])

    useEffect(() => {
        if (isOpen && stage === 'quiz' && questions.length === 0) {
            fetchQuestions()
        }
    }, [isOpen, stage, questions.length, fetchQuestions])

    const handleStartQuiz = () => {
        setStage('quiz')
    }

    const handleSelectOption = (option) => {
        setSelectedOption(option)
    }

    const handleNext = () => {
        if (selectedOption === null) return

        const currentQuestion = questions[currentIndex]
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: selectedOption
        }))

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedOption(null)
        } else {
            // Submit all answers
            submitAnswers()
        }
    }

    const submitAnswers = async () => {
        setLoading(true)
        try {
            // Include current answer
            const currentQuestion = questions[currentIndex]
            const allAnswers = {
                ...answers,
                [currentQuestion.id]: selectedOption
            }

            const answersArray = Object.entries(allAnswers).map(([questionId, answer]) => ({
                questionId,
                answer
            }))

            const result = await api(`/diagnostic/${trackSlug}/submit`, {
                method: 'POST',
                body: { answers: answersArray }
            })

            setResults(result)
            setStage('results')
        } catch (err) {
            console.error('Failed to submit diagnostic:', err)
            setError('We could not submit the assessment. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = useCallback(() => {
        // Reset state
        setStage('intro')
        setQuestions([])
        setCurrentIndex(0)
        setAnswers({})
        setSelectedOption(null)
        setResults(null)
        setError('')
        onClose()
    }, [onClose])

    useEffect(() => {
        if (!isOpen) return undefined

        previousFocusRef.current = document.activeElement
        const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0)

        const handleModalKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                handleClose()
                return
            }

            if (event.key !== 'Tab' || !modalRef.current) return
            const focusable = [...modalRef.current.querySelectorAll(
                'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )]
            if (focusable.length === 0) return
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleModalKeyDown)
        return () => {
            window.clearTimeout(focusTimer)
            document.removeEventListener('keydown', handleModalKeyDown)
            previousFocusRef.current?.focus?.()
            previousFocusRef.current = null
        }
    }, [isOpen, handleClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-slide-up"
                role="dialog"
                aria-modal="true"
                aria-labelledby="diagnostic-modal-title"
            >
                {/* Close button */}
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors z-10"
                    aria-label="Close diagnostic assessment"
                >
                    <CloseIcon />
                </button>

                {/* Intro Stage */}
                {stage === 'intro' && (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-6">🎯</div>
                        <h2 id="diagnostic-modal-title" className="text-2xl font-bold text-white mb-4">
                            Diagnostic Assessment
                        </h2>
                        <p className="text-dark-300 mb-6 max-w-md mx-auto">
                            Take a quick assessment to find your starting level for
                            <span className="text-primary-400 font-medium"> {trackTitle}</span>.
                            This helps us personalize your learning path.
                        </p>

                        <div className="bg-dark-800 rounded-xl p-4 mb-6 text-left">
                            <h3 className="text-sm font-medium text-dark-200 mb-2">What to expect:</h3>
                            <ul className="text-sm text-dark-400 space-y-1">
                                <li>• 10-15 questions across different levels</li>
                                <li>• Takes about 5-10 minutes</li>
                                <li>• You'll get a personalized starting point</li>
                            </ul>
                        </div>

                        <button
                            type="button"
                            onClick={handleStartQuiz}
                            className="btn-primary px-8 py-3 text-lg"
                        >
                            Start Assessment <ArrowRightIcon />
                        </button>
                    </div>
                )}

                {/* Quiz Stage */}
                {stage === 'quiz' && (
                    <div className="p-8">
                        {error && (
                            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
                                {error}
                            </div>
                        )}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-dark-400" role="status" aria-live="polite">Loading questions...</p>
                            </div>
                        ) : questions.length > 0 ? (
                            <>
                                {/* Progress */}
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-sm text-dark-400">
                                        Question {currentIndex + 1} of {questions.length}
                                    </span>
                                    <span className="badge badge-primary">
                                        Level {questions[currentIndex].level}
                                    </span>
                                </div>

                                <div className="h-1 bg-dark-800 rounded-full mb-8 overflow-hidden">
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
                                <div className="space-y-3 mb-8">
                                    {questions[currentIndex].options.map((option, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectOption(option)}
                                            aria-pressed={selectedOption === option}
                                            className={`w-full p-4 rounded-xl text-left transition-all duration-200 border ${selectedOption === option
                                                    ? 'bg-primary-500/20 border-primary-500 text-white'
                                                    : 'bg-dark-800 border-dark-700 text-dark-200 hover:border-dark-500'
                                                }`}
                                        >
                                            <span className="font-medium mr-3 text-dark-400">
                                                {String.fromCharCode(65 + index)}.
                                            </span>
                                            {option}
                                        </button>
                                    ))}
                                </div>

                                {/* Next Button */}
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={selectedOption === null}
                                    className="btn-primary w-full justify-center disabled:opacity-50"
                                >
                                    {currentIndex === questions.length - 1 ? 'Submit Answers' : 'Next Question'}
                                    <ArrowRightIcon />
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-dark-400" role={error ? 'alert' : 'status'} aria-live="polite">
                                    {error || 'No questions available for this track.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Results Stage */}
                {stage === 'results' && results && (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Assessment Complete!
                        </h2>

                        {/* Overall Score */}
                        <div className="bg-primary-500/10 border border-primary-500/30 rounded-2xl p-6 mb-6">
                            <div className="text-5xl font-bold text-primary-400 mb-2">
                                {results.overallScore.percentage}%
                            </div>
                            <p className="text-dark-300">
                                {results.overallScore.correct} of {results.overallScore.total} correct
                            </p>
                        </div>

                        {/* Recommended Level */}
                        <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4 mb-6">
                            <p className="text-sm text-dark-400 mb-1">Recommended Starting Level</p>
                            <p className="text-2xl font-bold text-accent-400">
                                {results.levelTitle}
                            </p>
                        </div>

                        {/* Level Breakdown */}
                        <div className="bg-dark-800 rounded-xl p-4 mb-6 text-left">
                            <h3 className="text-sm font-medium text-dark-200 mb-3">Score by Level:</h3>
                            <div className="space-y-2">
                                {results.levelBreakdown.map(level => (
                                    <div key={level.level} className="flex items-center justify-between">
                                        <span className="text-dark-400">{level.level}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-dark-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${level.percentage >= 70 ? 'bg-accent-500' : 'bg-amber-500'
                                                        }`}
                                                    style={{ width: `${level.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-dark-300 w-12">
                                                {level.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-dark-400 mb-6">{results.message}</p>

                        <button
                            type="button"
                            onClick={() => {
                                handleClose()
                                onComplete?.(results)
                            }}
                            className="btn-primary px-8 py-3"
                        >
                            Start Learning <ArrowRightIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
