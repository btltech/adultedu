import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Award, BarChart3, BookOpenCheck, ChevronDown, ChevronUp, LayoutGrid, LineChart, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getProgressDetail } from '../lib/api'

function getTrackStage(completedTopics, totalTopics) {
    const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

    if (percentage >= 100) {
        return {
            label: 'Completed',
            note: 'This pathway is complete. Review or move into your next step when ready.',
        }
    }

    if (percentage >= 75) {
        return {
            label: 'Nearly there',
            note: 'A few more topics will finish this pathway.',
        }
    }

    if (percentage >= 35) {
        return {
            label: 'Building confidence',
            note: 'You have made a solid start. Keep moving topic by topic.',
        }
    }

    return {
        label: 'Getting started',
        note: 'A steady start matters more than speed.',
    }
}

export default function Progress() {
    const { user } = useAuth()
    const [enrollments, setEnrollments] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedSlug, setExpandedSlug] = useState(null)
    const [details, setDetails] = useState({})

    useEffect(() => {
        async function fetchProgress() {
            try {
                const data = await api('/progress')
                setEnrollments(data.enrollments || [])
            } catch (err) {
                console.error('Failed to load progress:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProgress()
    }, [])

    const toggleDetails = async (slug) => {
        setExpandedSlug(prev => prev === slug ? null : slug)

        // Fetch detail only once per slug
        if (!details[slug]) {
            setDetails(prev => ({ ...prev, [slug]: { loading: true, data: null } }))
            try {
                const data = await getProgressDetail(slug)
                setDetails(prev => ({ ...prev, [slug]: { loading: false, data } }))
            } catch (err) {
                console.error('Failed to load track progress:', err)
                setDetails(prev => ({ ...prev, [slug]: { loading: false, error: err.message } }))
            }
        }
    }

    const masteredTracks = enrollments.filter((enrollment) => enrollment.completedTopics > 0 && enrollment.completedTopics === enrollment.totalTopics).length
    const totalTopics = enrollments.reduce((sum, enrollment) => sum + enrollment.totalTopics, 0)
    const completedTopics = enrollments.reduce((sum, enrollment) => sum + enrollment.completedTopics, 0)

    return (
        <div className="py-12">
            <div className="container-app">
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
                        <div>
                            <span className="section-eyebrow">
                                <LineChart className="h-3.5 w-3.5" />
                                Learning record
                            </span>
                            <h1 className="mt-4 text-4xl font-bold text-dark-50 sm:text-5xl">See what you have finished, what is moving forward, and what to continue next.</h1>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-dark-300">
                                This is your learning record. It shows the pathways you have started, how far you have moved through them, and the places where a return visit would keep progress steady.
                            </p>
                        </div>

                        <div className="editorial-panel grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            <div>
                                <p className="learning-stat-label">Pathways started</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{enrollments.length}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Topics mastered</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{completedTopics}/{totalTopics}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Pathways completed</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{masteredTracks}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="space-y-4">
                        <div className="skeleton h-24 w-full" />
                        <div className="skeleton h-24 w-full" />
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="editorial-panel p-12 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/12 text-primary-300">
                            <Sparkles className="h-7 w-7" />
                        </div>
                        <h2 className="text-2xl font-semibold text-dark-100 mb-4">Start with a pathway</h2>
                        <p className="text-dark-400 mb-6 max-w-md mx-auto">
                            You have not started a pathway yet. Browse the course list, pick the area that fits you best, and begin with one manageable step.
                        </p>
                        <Link to="/tracks" className="btn-primary">
                            Explore Pathways
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {enrollments.map(enrollment => {
                            const stage = getTrackStage(enrollment.completedTopics, enrollment.totalTopics)
                            const completionPercent = enrollment.totalTopics > 0
                                ? Math.round((enrollment.completedTopics / enrollment.totalTopics) * 100)
                                : 0

                            return (
                            <div key={enrollment.id} className="progress-panel">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Pathway progress</p>
                                        <h3 className="text-xl font-semibold text-dark-50">{enrollment.trackTitle}</h3>
                                        <p className="text-dark-400 text-sm">Suggested level: {enrollment.currentLevel}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-neutral">{stage.label}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleDetails(enrollment.trackSlug)}
                                            className="btn-ghost text-sm"
                                        >
                                            {expandedSlug === enrollment.trackSlug ? 'Hide details' : 'View details'}
                                            {expandedSlug === enrollment.trackSlug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                        <Link to={`/track/${enrollment.trackSlug}`} className="btn-secondary text-sm">
                                            Continue
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                        <p className="learning-stat-label">Topics completed</p>
                                        <p className="mt-2 text-xl font-semibold text-dark-50">{enrollment.completedTopics} / {enrollment.totalTopics}</p>
                                    </div>
                                    <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                        <p className="learning-stat-label">Completion</p>
                                        <p className="mt-2 text-xl font-semibold text-dark-50">{completionPercent}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                        <p className="learning-stat-label">Current stage</p>
                                        <p className="mt-2 text-xl font-semibold text-dark-50">{stage.label}</p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-400 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent-300" /> Track completion</span>
                                        <span className="text-dark-200">{enrollment.completedTopics} / {enrollment.totalTopics}</span>
                                    </div>
                                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                                            style={{
                                                width: `${completionPercent}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm text-dark-400">{stage.note}</p>
                                </div>

                                {expandedSlug === enrollment.trackSlug && (
                                    <div className="mt-5 border-t border-dark-800 pt-4 space-y-3">
                                        {details[enrollment.trackSlug]?.loading && (
                                            <div className="space-y-2">
                                                <div className="skeleton h-4 w-32" />
                                                <div className="skeleton h-3 w-full" />
                                                <div className="skeleton h-3 w-3/4" />
                                            </div>
                                        )}

                                        {details[enrollment.trackSlug]?.error && (
                                            <p className="text-sm text-red-400">Failed to load details: {details[enrollment.trackSlug].error}</p>
                                        )}

                                        {details[enrollment.trackSlug]?.data && (() => {
                                            const detail = details[enrollment.trackSlug].data
                                            return (
                                                <div className="space-y-4">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className={`badge ${detail.overall.isMastered ? 'badge-primary' : 'badge-neutral'}`}>
                                                            {detail.overall.isMastered ? 'Pathway complete' : 'In progress'}
                                                        </span>
                                                        <span className="text-sm text-dark-300">
                                                            {detail.topicsMastered || 0} / {detail.topics.length} topics mastered
                                                        </span>
                                                        <span className="text-sm text-dark-300">
                                                            {detail.overall.percentage}% overall question accuracy
                                                        </span>
                                                        {detail.certificate?.downloadPath && (
                                                            <a className="inline-flex items-center gap-2 text-sm text-primary-300 underline" href={detail.certificate.downloadPath}>
                                                                <Award className="h-4 w-4" />
                                                                Download certificate
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {detail.topics.map(topic => (
                                                            <div key={topic.id} className="rounded-2xl border border-dark-800 bg-dark-900/50 p-4">
                                                                <div className="flex items-center justify-between mb-2 gap-2">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-dark-100 flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-accent-300" />{topic.title}</p>
                                                                        <p className="text-xs text-dark-500">{topic.correctCount} correct from {topic.totalQuestions} questions</p>
                                                                    </div>
                                                                    <span className={`badge ${topic.isMastered ? 'badge-primary' : 'badge-neutral'}`}>
                                                                        {topic.isMastered ? 'Mastered' : `${topic.percentage}%`}
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${topic.isMastered ? 'bg-primary-500' : 'bg-accent-500/80'} rounded-full transition-all`}
                                                                        style={{ width: `${Math.min(100, topic.percentage)}%` }}
                                                                    />
                                                                </div>
                                                                <div className="mt-3 flex flex-wrap gap-3">
                                                                    <Link to={`/topic/${topic.id}`} className="btn-secondary text-sm">
                                                                        Open topic
                                                                    </Link>
                                                                    {!topic.isMastered && (
                                                                        <Link to={`/practice/${topic.id}`} className="btn-ghost text-sm">
                                                                            Practice topic
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                )}
            </div>
        </div>
    )
}
