import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTrack, getProgressDetail } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DiagnosticModal from '../components/diagnostic/DiagnosticModal'

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)


const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)

const PlayIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
)

function TopicCard({ topic, index, trackSlug, progress }) {
    const lessonsCount = topic.lessons?.length || 0
    const hasContent = lessonsCount > 0 || topic.questionCount > 0

    // Use Link for topics with content, div for empty topics
    const CardWrapper = hasContent ? Link : 'div'
    const cardProps = hasContent ? { to: `/topic/${topic.id}` } : {}

    return (
        <CardWrapper
            {...cardProps}
            className={`glass-card-hover p-6 flex gap-4 ${!hasContent ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {/* Number/Status */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-semibold ${hasContent ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-700 text-dark-500'
                }`}>
                {index + 1}
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-dark-50 group-hover:text-primary-400">
                        {topic.title}
                    </h3>
                    <span className="badge badge-neutral flex-shrink-0">
                        {topic.ukLevel?.code || topic.ukLevel || 'N/A'}
                    </span>
                </div>

                <p className="text-dark-400 text-sm mb-3 line-clamp-2">
                    {topic.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-dark-500">
                    <span>{lessonsCount} lessons</span>
                    <span>{topic.questionCount || 0} questions</span>
                </div>

                {/* Progress Bar */}
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

            {/* Action icon */}
            <div className="flex-shrink-0 self-center">
                {hasContent ? (
                    <PlayIcon />
                ) : (
                    <LockIcon />
                )}
            </div>
        </CardWrapper>
    )
}

export default function TrackDetail() {
    const { slug } = useParams()
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const [track, setTrack] = useState(null)
    const [progressData, setProgressData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
    const progressPercent = progressData?.overall?.percentage ?? null
    const trackMastered = !!progressData?.overall?.isMastered
    const topicsMastered = progressData?.topicsMastered ?? 0
    const topicsTotal = progressData?.topics?.length ?? 0
    const certificate = progressData?.certificate

    return (
        <div className="py-12">
            {/* Diagnostic Modal */}
            <DiagnosticModal
                trackSlug={slug}
                trackTitle={track.title}
                isOpen={showDiagnostic}
                onClose={() => setShowDiagnostic(false)}
                onComplete={handleDiagnosticComplete}
            />

            <div className="container-app">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm">
                    <Link to="/tracks" className="text-dark-400 hover:text-dark-200">Courses</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">{track.title}</span>
                </nav>

                {/* Hero */}
                <div className="glass-card p-8 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-grow">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {track.frameworks.map(f => (
                                    <span key={f.slug} className="badge badge-primary">{f.title}</span>
                                ))}
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-dark-50 mb-4">
                                {track.title}
                            </h1>
                            <p className="text-dark-300 text-lg max-w-2xl mb-6">
                                {track.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-6 text-dark-400">
                                <span className="flex items-center gap-2">
                                    <ClockIcon />
                                    {track.topics.length * 3}+ hours
                                </span>
                                <span>{track.topics.length} topics</span>
                                <span>{totalLessons} lessons</span>
                                <span>{totalQuestions} practice questions</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 lg:w-64">
                            <button
                                onClick={handleStartDiagnostic}
                                className="btn-primary justify-center"
                            >
                                Start Diagnostic
                            </button>
                            <p className="text-dark-500 text-xs text-center">
                                Take a quick assessment to find your level
                            </p>
                            {progressPercent !== null && (
                                <div className="p-3 rounded-lg border border-dark-800 bg-dark-900/60 space-y-2">
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
                                        <div className="mt-2 p-2 rounded-md bg-emerald-500/10 text-emerald-200 text-xs border border-emerald-500/30">
                                            Certificate ready: {certificate.title}{' '}
                                            {certificate.downloadPath && (
                                                <a className="underline" href={certificate.downloadPath}>Download</a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Topics list */}
                <div>
                    <h2 className="text-2xl font-bold text-dark-50 mb-6">Topics</h2>
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
