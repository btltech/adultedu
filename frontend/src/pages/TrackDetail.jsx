import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Award, BookOpenCheck, CheckCircle2, Clock3, Layers3, Lock, PlayCircle, ShieldCheck, Target } from 'lucide-react'
import { getTrack, getProgressDetail, recordOnboardingOutcome } from '../lib/api'
import { formatLessonTime } from '../lib/studyTime'
import { useAuth } from '../context/AuthContext'
import DiagnosticModal from '../components/diagnostic/DiagnosticModal'
import { getPathwayGuidance } from '../lib/pathwayGuidance'
import { usePageSeo } from '../components/SEO'
import { formatPageDescription, formatPageTitle } from '../lib/seo/meta'

function getNextStepValue(nextStep) {
    if (nextStep.slug) return nextStep.slug
    if (nextStep.href) {
        return nextStep.href
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'next-step'
    }

    return nextStep.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'next-step'
}

function getNextStepHref(nextStep) {
    if (nextStep.href) return nextStep.href
    if (nextStep.slug) return `/track/${nextStep.slug}`
    return null
}

function TopicCard({ topic, index, trackSlug, progress }) {
    const lessonsCount = topic.lessons?.length || 0
    const hasContent = lessonsCount > 0 || topic.questionCount > 0
    const outcomes = Array.isArray(topic.outcomes) ? topic.outcomes.slice(0, 2) : []

    const CardWrapper = hasContent ? Link : 'div'
    const cardProps = hasContent ? { to: `/topic/${topic.id}` } : {}

    return (
        <CardWrapper
            {...cardProps}
            className={`topic-panel group flex gap-4 ${!hasContent ? 'opacity-55 cursor-not-allowed' : ''}`}
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${hasContent ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-700 text-dark-500'
                }`}>
                {index + 1}
            </div>

            <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">
                            Topic {index + 1}
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-dark-50 group-hover:text-primary-300">
                            {topic.title}
                        </h3>
                    </div>
                    <span className="badge badge-neutral flex-shrink-0">
                        {topic.ukLevel?.code || topic.ukLevel || 'N/A'}
                    </span>
                </div>

                <p className="text-dark-300 text-sm mb-4 line-clamp-2">
                    {topic.description}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-dark-800/70 bg-dark-900/70 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-dark-500">Learning load</p>
                        <p className="mt-2 text-sm text-dark-200">{lessonsCount} lessons and {topic.questionCount || 0} questions</p>
                    </div>
                    <div className="rounded-2xl border border-dark-800/70 bg-dark-900/70 p-3">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-dark-500">Outcomes</p>
                        {outcomes.length > 0 ? (
                            <ul className="mt-2 space-y-2 text-sm text-dark-300">
                                {outcomes.map((outcome) => (
                                    <li key={outcome.code} className="flex gap-2">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                        <span className="line-clamp-2">{outcome.description}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-dark-400">Structured practice and mastery tracking included.</p>
                        )}
                    </div>
                </div>

                {progress && (
                    <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className={progress.percentage >= 80 ? "text-emerald-500 font-medium" : "text-dark-400"}>
                                {progress.percentage >= 80 ? 'Mastered' : `${progress.percentage}% Mastery`}
                            </span>
                            <span className="text-dark-500">{progress.correctCount}/{progress.totalQuestions} correct</span>
                        </div>
                        <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${progress.percentage >= 80 ? 'bg-emerald-500' : 'bg-primary-500'
                                    }`}
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 self-center">
                {hasContent ? (
                    <PlayCircle className="h-5 w-5 text-primary-300" />
                ) : (
                    <Lock className="h-5 w-5 text-dark-500" />
                )}
            </div>
        </CardWrapper>
    )
}

export default function TrackDetail() {
    const { slug } = useParams()
    const { isAuthenticated, user, checkAuth } = useAuth()
    const navigate = useNavigate()

    const [track, setTrack] = useState(null)
    const [progressData, setProgressData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [confidenceAfter, setConfidenceAfter] = useState(4)
    const [nextStepChoice, setNextStepChoice] = useState('')
    const [savingOutcome, setSavingOutcome] = useState(false)
    const [outcomeError, setOutcomeError] = useState('')
    const [outcomeSaved, setOutcomeSaved] = useState(false)

    usePageSeo({
        title: track ? formatPageTitle(`${track.title} Pathway`) : undefined,
        description: track
            ? formatPageDescription(
                track.description,
                `Follow the ${track.title} pathway on AdultEdu with structured topics, lessons, and practice for UK adult learners.`
            )
            : undefined,
    })

    useEffect(() => {
        async function fetchTrack() {
            try {
                const data = await getTrack(slug)
                setTrack(data)

                // Fetch progress if logged in
                if (isAuthenticated) {
                    try {
                        const prog = await getProgressDetail(slug)
                        setProgressData(prog)
                    } catch (e) {
                        // Ignore 403 (not enrolled) or 404
                        console.log('Progress fetch skipped/failed', e)
                    }
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchTrack()
    }, [slug, isAuthenticated])

    const [showDiagnostic, setShowDiagnostic] = useState(false)

    useEffect(() => {
        if (!track) return

        const savedOutcome = user?.onboarding?.completedTrack?.slug === slug ? user.onboarding : null
        if (savedOutcome?.confidenceAfter) {
            setConfidenceAfter(savedOutcome.confidenceAfter)
        }

        if (savedOutcome?.nextStepChoice) {
            setNextStepChoice(savedOutcome.nextStepChoice)
            return
        }

        const defaultNextStep = getPathwayGuidance(track).nextSteps[0]
        if (defaultNextStep) {
            setNextStepChoice((currentValue) => currentValue || getNextStepValue(defaultNextStep))
        }
    }, [track, user, slug])

    const handleStartDiagnostic = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/track/${slug}` } } })
            return
        }
        setShowDiagnostic(true)
    }

    const handleDiagnosticComplete = (results) => {
        console.log('Diagnostic complete:', results)
        // Refresh the page to show updated recommended level
        window.location.reload()
    }

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app">
                    <div className="skeleton h-8 w-64 mb-4" />
                    <div className="skeleton h-4 w-96 mb-8" />
                    <div className="skeleton h-32 w-full mb-4" />
                    <div className="skeleton h-32 w-full" />
                </div>
            </div>
        )
    }

    if (error || !track) {
        return (
            <div className="py-12">
                <div className="container-app text-center">
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">Track not found</h1>
                    <p className="text-dark-400 mb-6">{error || 'This track does not exist.'}</p>
                    <Link to="/tracks" className="btn-primary">
                        View all tracks
                    </Link>
                </div>
            </div>
        )
    }

    const totalLessons = track.topics.reduce((sum, t) => sum + t.lessons.length, 0)
    const totalQuestions = track.topics.reduce((sum, t) => sum + t.questionCount, 0)
    const lessonTime = formatLessonTime(track.estimatedMinutes)
    const expectedStudyTime = formatLessonTime(track.expectedStudyMinutes)
    const progressPercent = progressData?.overall?.percentage ?? null
    const trackMastered = !!progressData?.overall?.isMastered
    const topicsMastered = progressData?.topicsMastered ?? 0
    const topicsTotal = progressData?.topics?.length ?? 0
    const certificate = progressData?.certificate
    const pathwayGuidance = getPathwayGuidance(track)
    const savedOutcome = user?.onboarding?.completedTrack?.slug === slug ? user.onboarding : null
    const isSavedStartingPathway = user?.onboarding?.selectedTrack?.slug === slug
    const baselineConfidence = Number(user?.onboarding?.confidenceBefore || 0) || null
    const recommendedTopic = track.topics.find((topic) => {
        const topicProgress = progressData?.topics?.find((entry) => entry.id === topic.id)
        const hasContent = topic.lessons.length > 0 || topic.questionCount > 0
        return hasContent && (!topicProgress || !topicProgress.isMastered)
    }) || track.topics.find((topic) => topic.lessons.length > 0 || topic.questionCount > 0) || null

    const handleSaveOutcome = async (event) => {
        event.preventDefault()
        setSavingOutcome(true)
        setOutcomeError('')

        try {
            await recordOnboardingOutcome({
                trackSlug: slug,
                confidenceAfter,
                nextStepChoice,
            })
            setOutcomeSaved(true)
            await checkAuth()
        } catch (err) {
            setOutcomeError(err.message || 'Unable to save pathway outcome right now.')
        } finally {
            setSavingOutcome(false)
        }
    }

    return (
        <div className="py-12">
            <DiagnosticModal
                trackSlug={slug}
                trackTitle={track.title}
                isOpen={showDiagnostic}
                onClose={() => setShowDiagnostic(false)}
                onComplete={handleDiagnosticComplete}
            />

            <div className="container-app">
                <nav className="mb-6 text-sm">
                    <Link to="/tracks" className="text-dark-400 hover:text-dark-200">Pathways</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">{track.title}</span>
                </nav>

                <div className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
                        <div className="flex-grow">
                            <span className="section-eyebrow">
                                <Layers3 className="h-3.5 w-3.5" />
                                Learning pathway
                            </span>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {track.frameworks.map(f => (
                                    <span key={f.slug} className="badge badge-primary">{f.title}</span>
                                ))}
                            </div>

                            <h1 className="mt-4 text-3xl lg:text-5xl font-bold text-dark-50 mb-4">
                                {track.title}
                            </h1>
                            <p className="text-dark-300 text-lg max-w-2xl mb-6 leading-8">
                                {track.description}
                            </p>

                            <div className="mb-6 rounded-2xl border border-accent-500/25 bg-accent-500/10 p-4 text-sm leading-7 text-dark-200">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                    <p>
                                        AdultEdu is an independent practice platform. This pathway can support revision and confidence, but it is not a formal qualification or an official exam-board product.
                                    </p>
                                </div>
                            </div>

                            {isSavedStartingPathway && (
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-2 text-sm font-medium text-primary-200">
                                    <Target className="h-4 w-4" />
                                    This is the pathway saved in your starting-point plan.
                                </div>
                            )}

                            <div className="mb-6 grid gap-4 xl:grid-cols-3">
                                <div className="rounded-3xl border border-dark-800/80 bg-dark-950/45 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Who this is for</p>
                                    <p className="mt-3 text-sm leading-7 text-dark-300">{pathwayGuidance.audience}</p>
                                </div>
                                <div className="rounded-3xl border border-dark-800/80 bg-dark-950/45 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">What this helps with</p>
                                    <ul className="mt-3 space-y-2 text-sm text-dark-300">
                                        {pathwayGuidance.outcomes.slice(0, 3).map((outcome) => (
                                            <li key={outcome} className="flex gap-2">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                                <span>{outcome}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="rounded-3xl border border-dark-800/80 bg-dark-950/45 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">What this leads to next</p>
                                    <ul className="mt-3 space-y-3 text-sm text-dark-300">
                                        {pathwayGuidance.nextSteps.slice(0, 3).map((nextStep) => {
                                            const href = getNextStepHref(nextStep)
                                            const body = (
                                                <>
                                                    <span className="font-medium text-dark-100">{nextStep.title}</span>
                                                    {nextStep.description && <span className="mt-1 block text-dark-400">{nextStep.description}</span>}
                                                </>
                                            )

                                            return (
                                                <li key={nextStep.title} className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-3">
                                                    {href ? (
                                                        <Link to={href} className="block transition-colors hover:text-primary-200">
                                                            {body}
                                                        </Link>
                                                    ) : body}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Lesson time</p>
                                    <p className="learning-stat-value">{lessonTime}</p>
                                    <p className="mt-2 text-sm text-dark-400 flex items-center gap-2"><Clock3 className="h-4 w-4 text-accent-300" /> Based on published lessons</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Full study</p>
                                    <p className="learning-stat-value">{expectedStudyTime}</p>
                                    <p className="mt-2 text-sm text-dark-400">Lessons plus current practice bank</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Topics</p>
                                    <p className="learning-stat-value">{track.topics.length}</p>
                                    <p className="mt-2 text-sm text-dark-400">Structured topic sequence</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Lessons</p>
                                    <p className="learning-stat-value">{totalLessons}</p>
                                    <p className="mt-2 text-sm text-dark-400">Published lesson content</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Practice</p>
                                    <p className="learning-stat-value">{totalQuestions}</p>
                                    <p className="mt-2 text-sm text-dark-400">Question-led revision</p>
                                </div>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Recommended next step</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Find your starting level and keep the route legible.</h2>
                            <p className="mt-3 text-sm leading-7 text-dark-300">
                                The diagnostic helps place learners quickly, and this page keeps the route clear: who it is for, what it supports, and what a sensible next step could be.
                            </p>

                            {recommendedTopic && (
                                <div className="mt-6 rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4 text-sm text-dark-200">
                                    <p className="font-semibold text-primary-300">Suggested next topic</p>
                                    <p className="mt-2 leading-7 text-dark-300">{recommendedTopic.title} is the clearest next step based on the current course order and your visible progress.</p>
                                    <Link to={`/topic/${recommendedTopic.id}`} className="btn-secondary mt-4 w-full justify-center">
                                        Open suggested topic
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}

                            {slug === 'life-in-the-uk-test' && (
                                <div className="mt-6 rounded-2xl border border-accent-500/25 bg-accent-500/10 p-4 text-sm text-dark-200">
                                    <p className="font-semibold text-accent-300">Free public mock test</p>
                                    <p className="mt-2 leading-7 text-dark-300">Anyone can take a mixed Life in the UK practice test without signing in.</p>
                                    <Link to="/life-in-the-uk-test" className="btn-primary mt-4 w-full justify-center">
                                        Take free practice test
                                        <PlayCircle className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}

                            <button
                                onClick={handleStartDiagnostic}
                                className="btn-primary mt-6 w-full justify-center"
                            >
                                Start Diagnostic
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            {progressPercent !== null && (
                                <div className="progress-panel mt-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-dark-100">Your progress</span>
                                        {trackMastered && (
                                            <span className="badge badge-primary text-xs">Mastered</span>
                                        )}
                                    </div>
                                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${trackMastered ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-dark-400">
                                        <span>{topicsMastered} / {topicsTotal} topics mastered</span>
                                        <span>{progressPercent}%</span>
                                    </div>

                                    {certificate?.awarded && (
                                        <div className="mt-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                                            <div className="flex items-center gap-2 font-semibold text-emerald-100">
                                                <Award className="h-4 w-4" />
                                                Certificate ready
                                            </div>
                                            <p className="mt-2">{certificate.title}</p>
                                            {certificate.downloadPath && (
                                                <a className="mt-2 inline-flex items-center gap-1 underline" href={certificate.downloadPath}>Download</a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {trackMastered && isAuthenticated && (
                                <form onSubmit={handleSaveOutcome} className="progress-panel mt-6 space-y-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Progression record</p>
                                        <h3 className="mt-2 text-lg font-semibold text-dark-50">Record what this pathway led to next.</h3>
                                        <p className="mt-2 text-sm leading-7 text-dark-300">This keeps the learner record useful for you and creates lightweight evidence for provider or partner conversations.</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-dark-100">Confidence after this pathway</p>
                                        <div className="mt-3 grid grid-cols-5 gap-2">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setConfidenceAfter(value)}
                                                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${confidenceAfter === value
                                                        ? 'border-primary-500 bg-primary-500/15 text-primary-100'
                                                        : 'border-dark-700 bg-dark-900/70 text-dark-300 hover:border-dark-600 hover:text-dark-100'
                                                        }`}
                                                >
                                                    {value}
                                                </button>
                                            ))}
                                        </div>
                                        {baselineConfidence ? (
                                            <p className="mt-2 text-xs text-dark-500">Baseline confidence at onboarding: {baselineConfidence}/5</p>
                                        ) : null}
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-dark-100">What does this lead to next?</p>
                                        <div className="mt-3 space-y-3">
                                            {pathwayGuidance.nextSteps.map((nextStep) => {
                                                const value = getNextStepValue(nextStep)
                                                return (
                                                    <button
                                                        key={nextStep.title}
                                                        type="button"
                                                        onClick={() => setNextStepChoice(value)}
                                                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${nextStepChoice === value
                                                            ? 'border-primary-500 bg-primary-500/12'
                                                            : 'border-dark-700 bg-dark-900/60 hover:border-dark-600'
                                                            }`}
                                                    >
                                                        <p className="font-medium text-dark-100">{nextStep.title}</p>
                                                        {nextStep.description && (
                                                            <p className="mt-2 text-sm leading-7 text-dark-400">{nextStep.description}</p>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {(savedOutcome || outcomeSaved) && (
                                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                                            <p className="font-semibold">Outcome recorded</p>
                                            <p className="mt-2 leading-7 text-emerald-100/90">
                                                {savedOutcome?.confidenceChange !== null && savedOutcome?.confidenceChange !== undefined
                                                    ? `Confidence change saved: ${savedOutcome.confidenceChange > 0 ? '+' : ''}${savedOutcome.confidenceChange}.`
                                                    : 'This pathway now has a saved confidence-after and next-step choice.'}
                                            </p>
                                        </div>
                                    )}

                                    {outcomeError && (
                                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                            {outcomeError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={savingOutcome || !nextStepChoice}
                                        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingOutcome ? 'Saving progression record...' : 'Save progression outcome'}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </form>
                            )}

                            {progressPercent === null && (
                                <div className="mt-6 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm leading-7 text-dark-300">
                                    Start with the diagnostic if you want a guided placement, or open the suggested topic and move through the pathway one step at a time.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div id="topic-outline">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <span className="section-eyebrow">
                                <BookOpenCheck className="h-3.5 w-3.5" />
                                Pathway outline
                            </span>
                            <h2 className="mt-3 text-2xl font-bold text-dark-50">Topics and outcomes</h2>
                        </div>
                        <p className="max-w-xl text-sm text-dark-400 text-right">
                            Each topic includes lessons, question coverage, and mastery tracking so the learning path feels deliberate.
                        </p>
                    </div>
                    <div className="space-y-4">
                        {track.topics.map((topic, index) => (
                            <TopicCard
                                key={topic.id}
                                topic={topic}
                                index={index}
                                trackSlug={slug}
                                progress={progressData?.topics?.find(t => t.id === topic.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
