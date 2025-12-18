import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, getProgressDetail } from '../lib/api'

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

    return (
        <div className="py-12">
            <div className="container-app">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-dark-50 mb-4">My Progress</h1>
                    <p className="text-dark-300">
                        Track your learning journey across all enrolled courses.
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="skeleton h-24 w-full" />
                        <div className="skeleton h-24 w-full" />
                    </div>
                ) : enrollments.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-6">🎯</div>
                        <h2 className="text-2xl font-semibold text-dark-100 mb-4">Start Your Journey</h2>
                        <p className="text-dark-400 mb-6 max-w-md mx-auto">
                            You haven't enrolled in any courses yet. Browse our catalog and
                            take a diagnostic assessment to get started.
                        </p>
                        <Link to="/tracks" className="btn-primary">
                            Explore Courses
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {enrollments.map(enrollment => (
                            <div key={enrollment.id} className="glass-card p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-dark-50">{enrollment.trackTitle}</h3>
                                        <p className="text-dark-400 text-sm">Current level: {enrollment.currentLevel}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleDetails(enrollment.trackSlug)}
                                            className="btn-ghost text-sm"
                                        >
                                            {expandedSlug === enrollment.trackSlug ? 'Hide details' : 'View details'}
                                        </button>
                                        <Link to={`/track/${enrollment.trackSlug}`} className="btn-secondary text-sm">
                                            Continue
                                        </Link>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-400">Topics completed</span>
                                        <span className="text-dark-200">{enrollment.completedTopics} / {enrollment.totalTopics}</span>
                                    </div>
                                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                                            style={{
                                                width: `${enrollment.totalTopics > 0
                                                    ? Math.min(100, (enrollment.completedTopics / enrollment.totalTopics) * 100)
                                                    : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Expanded per-topic progress */}
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
                                                            {detail.overall.isMastered ? 'Track mastered' : 'In progress'}
                                                        </span>
                                                        <span className="text-sm text-dark-300">
                                                            {detail.topicsMastered || 0} / {detail.topics.length} topics mastered
                                                        </span>
                                                        {detail.certificate?.downloadPath && (
                                                            <a
                                                                className="text-sm text-primary-300 underline"
                                                                href={detail.certificate.downloadPath}
                                                            >
                                                                Download certificate
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {detail.topics.map(topic => (
                                                            <div key={topic.id} className="p-3 rounded-lg bg-dark-900/50 border border-dark-800">
                                                                <div className="flex items-center justify-between mb-2 gap-2">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-dark-100">{topic.title}</p>
                                                                        <p className="text-xs text-dark-500">{topic.totalQuestions} questions</p>
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
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
