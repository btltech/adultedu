import { useCallback, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Award, BarChart3, BookOpenCheck, Bookmark, ChevronDown, ChevronUp, Download, LineChart, ShieldCheck, Sparkles, Upload } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, getProgressDetail } from '../lib/api'
import { localLearnerProgressStore } from '../lib/learnerProgress'

function GuestProgress({ snapshot, loading, onRefresh }) {
    const [importMessage, setImportMessage] = useState('')
    const pathways = snapshot?.data?.pathwayProgress || []
    const lessons = snapshot?.data?.lessonProgress || []
    const attempts = snapshot?.data?.quizAttempts || []
    const bookmarks = snapshot?.data?.bookmarks || []
    const activity = snapshot?.data?.activity || []
    const completedLessons = lessons.filter((lesson) => lesson.completed).length

    const exportProgress = async () => {
        const payload = await localLearnerProgressStore.exportData()
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `adultedu-learning-data-${new Date().toISOString().slice(0, 10)}.json`
        anchor.click()
        URL.revokeObjectURL(url)
        await localLearnerProgressStore.markBackupSucceeded()
        await onRefresh()
    }

    const importProgress = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            if (file.size > 2 * 1024 * 1024) throw new Error('Learning-data files must be smaller than 2 MB.')
            const payload = JSON.parse(await file.text())
            await localLearnerProgressStore.importData(payload)
            await onRefresh()
            setImportMessage('Learning data imported and merged successfully.')
        } catch (error) {
            setImportMessage(error.message || 'That learning-data file could not be imported.')
        } finally {
            event.target.value = ''
        }
    }

    return (
        <div className="py-12">
            <div className="container-app">
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
                        <div>
                            <span className="section-eyebrow"><LineChart className="h-3.5 w-3.5" />Your learning</span>
                            <h1 className="mt-4 text-4xl font-bold text-dark-50 sm:text-5xl">Continue from where you stopped.</h1>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-dark-300">This progress belongs to this browser. You can learn, practise, bookmark and return without creating an account.</p>
                        </div>
                        <div className="editorial-panel grid gap-3 p-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                            <div><p className="learning-stat-label">Pathways</p><p className="mt-2 text-xl font-semibold text-dark-50">{pathways.length}</p></div>
                            <div><p className="learning-stat-label">Lessons completed</p><p className="mt-2 text-xl font-semibold text-dark-50">{completedLessons}</p></div>
                            <div><p className="learning-stat-label">Questions answered</p><p className="mt-2 text-xl font-semibold text-dark-50">{attempts.length}</p></div>
                        </div>
                    </div>
                </section>

                <section className="progress-panel mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-300" />
                        <div>
                            <p className="font-semibold text-dark-50">Protect this browser’s progress.</p>
                            <p className="mt-1 text-sm leading-6 text-dark-300">Create a free account to protect it from browser-data loss and continue on other devices.</p>
                        </div>
                    </div>
                    <Link to="/signup" state={{ from: { pathname: '/progress' } }} className="btn-primary shrink-0">Save across devices</Link>
                </section>

                {loading ? (
                    <div className="space-y-4"><div className="skeleton h-28 w-full" /><div className="skeleton h-28 w-full" /></div>
                ) : pathways.length === 0 ? (
                    <div className="editorial-panel p-12 text-center">
                        <Sparkles className="mx-auto h-8 w-8 text-primary-300" />
                        <h2 className="mt-5 text-2xl font-semibold text-dark-100">Start with a pathway</h2>
                        <p className="mx-auto mt-3 max-w-md text-dark-400">Choose any public pathway and start a lesson or practice set. Your place will appear here automatically.</p>
                        <Link to="/tracks#pathway-finder" className="btn-primary mt-6">Explore pathways</Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {pathways.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).map((pathway) => {
                            const completed = pathway.completedLessonIds?.length || 0
                            const total = pathway.totalLessons || 0
                            const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0
                            return (
                                <article key={pathway.trackId} className="progress-panel">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Pathway progress</p>
                                            <h2 className="mt-2 text-xl font-semibold text-dark-50">{pathway.trackTitle || 'Learning pathway'}</h2>
                                            <p className="mt-1 text-sm text-dark-400">{pathway.currentLessonTitle ? `Continue: ${pathway.currentLessonTitle}` : pathway.topicTitle}</p>
                                        </div>
                                        <Link to={pathway.lastRoute || `/track/${pathway.trackSlug}`} className="btn-secondary">Continue</Link>
                                    </div>
                                    <div className="mt-5 flex items-center justify-between text-sm"><span className="text-dark-300">{completed} of {total || '—'} lessons complete</span><span className="font-semibold text-dark-100">{percentage}%</span></div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-800" role="progressbar" aria-label={`${pathway.trackTitle || 'Pathway'} completion`} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
                                        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${percentage}%` }} />
                                    </div>
                                    <p className="mt-3 text-sm text-dark-400">{pathway.quizAttemptCount || 0} practice answers saved</p>
                                </article>
                            )
                        })}
                    </div>
                )}

                {bookmarks.length > 0 && (
                    <section className="mt-8">
                        <h2 className="flex items-center gap-2 text-xl font-semibold text-dark-50"><Bookmark className="h-5 w-5 text-primary-300" />Bookmarks</h2>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {bookmarks.map((bookmark) => <Link key={bookmark.itemId} to={bookmark.route} className="editorial-panel p-5"><p className="font-semibold text-dark-100">{bookmark.title}</p><p className="mt-1 text-sm text-dark-400">{bookmark.subtitle}</p></Link>)}
                        </div>
                    </section>
                )}

                {activity.length > 0 && (
                    <section className="mt-8">
                        <h2 className="text-xl font-semibold text-dark-50">Recent activity</h2>
                        <ul className="mt-4 divide-y divide-dark-800 overflow-hidden rounded-2xl border border-dark-800 bg-dark-900/50">
                            {[...activity].sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt))).slice(0, 5).map((entry) => (
                                <li key={entry.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-sm text-dark-200">{{ lesson_started: 'Opened a lesson', lesson_completed: 'Completed a lesson', practice_answered: 'Answered a practice question', bookmark_added: 'Bookmarked a lesson', bookmark_removed: 'Removed a bookmark' }[entry.type] || 'Learning activity'}</span>
                                    <time className="text-xs text-dark-500" dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString()}</time>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="mt-8 border-t border-dark-800 pt-6">
                    <h2 className="text-lg font-semibold text-dark-50">Back up this device</h2>
                    <p className="mt-2 text-sm text-dark-400">Export a versioned JSON backup or import one you previously created. Imported data is validated and merged.</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={exportProgress} className="btn-secondary"><Download className="h-4 w-4" />Export my learning data</button>
                        <label className="btn-ghost cursor-pointer"><Upload className="h-4 w-4" />Import learning data<input type="file" accept="application/json,.json" onChange={importProgress} className="sr-only" /></label>
                    </div>
                    {importMessage && <p className="mt-4 text-sm text-dark-200" role="status" aria-live="polite">{importMessage}</p>}
                </section>
            </div>
        </div>
    )
}

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
    const auth = useAuth()
    const user = auth.user
    const isAuthenticated = auth.isAuthenticated ?? !!user
    const [enrollments, setEnrollments] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedSlug, setExpandedSlug] = useState(null)
    const [details, setDetails] = useState({})
    const [localSnapshot, setLocalSnapshot] = useState(null)

    const refreshLocalProgress = useCallback(async () => {
        const snapshot = await localLearnerProgressStore.exportData()
        setLocalSnapshot(snapshot)
    }, [])

    useEffect(() => {
        refreshLocalProgress().catch((error) => console.error('Failed to load device progress:', error))
    }, [refreshLocalProgress])

    useEffect(() => {
        if (auth.progressSync?.status === 'synced') refreshLocalProgress().catch(() => {})
    }, [auth.progressSync?.status, refreshLocalProgress])

    useEffect(() => {
        async function fetchProgress() {
            if (!isAuthenticated) {
                setLoading(false)
                return
            }
            setLoading(true)
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
    }, [isAuthenticated])

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

    if (auth.loading) {
        return <div className="py-12"><div className="container-app space-y-4"><div className="skeleton h-48 w-full" /><div className="skeleton h-28 w-full" /></div></div>
    }

    if (!isAuthenticated) {
        return <GuestProgress snapshot={localSnapshot} loading={loading || !localSnapshot} onRefresh={refreshLocalProgress} />
    }

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

                {auth.progressSync?.status === 'failed' && (
                    <div className="progress-panel mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="alert">
                        <p className="text-sm text-dark-200">Your device progress is safe, but cross-device sync did not finish.</p>
                        <button type="button" onClick={auth.syncProgress} className="btn-secondary">Try sync again</button>
                    </div>
                )}

                {(localSnapshot?.data?.pathwayProgress || []).length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-dark-50">Lesson and resume activity</h2>
                        <p className="mt-2 text-sm text-dark-400">This includes lesson completion synced through the local-first learning record.</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            {localSnapshot.data.pathwayProgress.map((pathway) => (
                                <div key={pathway.trackId} className="editorial-panel p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div><p className="font-semibold text-dark-100">{pathway.trackTitle}</p><p className="mt-1 text-sm text-dark-400">{pathway.completedLessonIds?.length || 0} of {pathway.totalLessons || '—'} lessons completed</p></div>
                                        <Link to={pathway.lastRoute || `/track/${pathway.trackSlug}`} className="btn-ghost text-sm">Continue</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

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
                        <Link to="/tracks#pathway-finder" className="btn-primary">
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
                                        <Link to={`/track/${enrollment.trackSlug}#topic-outline`} className="btn-secondary text-sm">
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
