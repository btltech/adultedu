import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Clock3, GraduationCap, Layers3, Lock, PlayCircle, Target } from 'lucide-react'
import { api, getUserMessage } from '../lib/api'
import LearningPathPanel from '../components/LearningPathPanel'
import NotFound from './NotFound'
import { usePageSeo } from '../components/SEO'
import { topicSeoTags } from '../lib/seo/meta'

export default function Topic() {
    const { id } = useParams()
    const [topic, setTopic] = useState(null)
    const [loading, setLoading] = useState(true)
    const [missing, setMissing] = useState(false)
    const [loadError, setLoadError] = useState(null)

    usePageSeo(topicSeoTags(topic))

    useEffect(() => {
        async function fetchTopic() {
            setLoading(true)
            setMissing(false)
            setLoadError(null)

            try {
                const data = await api(`/topics/${id}`)
                setTopic(data)
            } catch (err) {
                console.error('Failed to load topic:', err)
                // See Lesson.jsx: only a 404 means the topic is really gone.
                if (err.status === 404) setMissing(true)
                else setLoadError(getUserMessage(err, "We couldn't load this topic."))
            } finally {
                setLoading(false)
            }
        }
        fetchTopic()
    }, [id])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl">
                    <div className="skeleton h-8 w-64 mb-4" />
                    <div className="skeleton h-64 w-full" />
                </div>
            </div>
        )
    }

    if (missing) return <NotFound />

    if (!topic) {
        return (
            <div className="py-12">
                <div className="container-app text-center">
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">We couldn't load this topic</h1>
                    <p className="mx-auto mb-6 max-w-md text-sm leading-7 text-dark-300">
                        {loadError || 'Something went wrong. Please try again.'}
                    </p>
                    <Link to="/tracks" className="btn-primary">Browse pathways</Link>
                </div>
            </div>
        )
    }

    const hasContent = topic.lessons?.length > 0 || topic.questionCount > 0
    const lessons = topic.lessons || []
    const totalMinutes = lessons.reduce((sum, lesson) => sum + (lesson.estMinutes || 0), 0)
    const firstLesson = lessons[0]
    const lessonPathItems = lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        meta: `${lesson.estMinutes || 0} min lesson`,
        description: lesson.summary,
    }))

    return (
        <div className="py-12">
            <div className="container-app max-w-6xl">
                <nav className="mb-6 text-sm">
                    <Link to="/tracks" className="text-dark-400 hover:text-dark-200">Pathways</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to={`/track/${topic.trackSlug}`} className="text-dark-400 hover:text-dark-200">{topic.trackTitle}</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">{topic.title}</span>
                </nav>

                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <Layers3 className="h-3.5 w-3.5" />
                                Topic pathway
                            </span>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="badge badge-primary">{topic.ukLevel}</span>
                                <span className="badge badge-neutral">Inside {topic.trackTitle}</span>
                            </div>

                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">
                                {topic.title}
                            </h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                {topic.description}
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Lessons</p>
                                    <p className="learning-stat-value">{lessons.length}</p>
                                    <p className="mt-2 text-sm text-dark-400">Published lesson sequence</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Reading time</p>
                                    <p className="learning-stat-value">{totalMinutes || 0}m</p>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-dark-400"><Clock3 className="h-4 w-4 text-accent-300" /> Guided lesson time</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Practice</p>
                                    <p className="learning-stat-value">{topic.questionCount}</p>
                                    <p className="mt-2 text-sm text-dark-400">Question-led reinforcement</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Level</p>
                                    <p className="learning-stat-value">{topic.ukLevel}</p>
                                    <p className="mt-2 text-sm text-dark-400">Recommended difficulty band</p>
                                </div>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">How to use this topic</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Move through lessons first, then lock understanding with practice.</h2>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpenCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Study the sequence</p>
                                            <p className="mt-1 text-dark-400">Work through lessons in order so the ideas build naturally.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Check retention</p>
                                            <p className="mt-1 text-dark-400">Use the practice set to turn reading into measurable mastery.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                {topic.trackSlug === 'life-in-the-uk-test' && (
                                    <Link to="/life-in-the-uk-test" className="btn-secondary w-full justify-center">
                                        Take full free mock test
                                        <PlayCircle className="h-4 w-4" />
                                    </Link>
                                )}

                                {firstLesson ? (
                                    <Link to={`/lesson/${firstLesson.id}`} className="btn-primary w-full justify-center">
                                        Start first lesson
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <div className="btn-secondary w-full justify-center opacity-60">
                                        <Lock className="h-4 w-4" />
                                        Lessons coming soon
                                    </div>
                                )}

                                {topic.questionCount > 0 ? (
                                    <Link to={`/practice/${id}`} className="btn-ghost w-full justify-center">
                                        Open practice set
                                        <PlayCircle className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300">
                                        Practice questions will appear here once this topic’s revision bank is ready.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {hasContent ? (
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                        <section>
                            <div className="mb-6 flex items-end justify-between gap-4">
                                <div>
                                    <span className="section-eyebrow">
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        Learning sequence
                                    </span>
                                    <h2 className="mt-3 text-2xl font-bold text-dark-50">Lessons in this topic</h2>
                                </div>
                                <p className="max-w-md text-left text-sm text-dark-400 lg:text-right">
                                    Read in order, then move into practice while the material is still fresh.
                                </p>
                            </div>

                            {lessons.length > 0 ? (
                                <div className="space-y-4">
                                    {lessons.map((lesson, index) => (
                                        <Link
                                            key={lesson.id}
                                            to={`/lesson/${lesson.id}`}
                                            className="topic-panel group flex gap-4"
                                        >
                                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500/18 font-semibold text-primary-300">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Lesson {index + 1}</p>
                                                        <h3 className="mt-1 text-lg font-semibold text-dark-50 group-hover:text-primary-300">{lesson.title}</h3>
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-dark-700/80 bg-dark-900/70 px-3 py-1 text-xs text-dark-300">
                                                        <Clock3 className="h-3.5 w-3.5 text-accent-300" />
                                                        {lesson.estMinutes || 0} min
                                                    </div>
                                                </div>

                                                <p className="mt-3 text-sm leading-7 text-dark-300">
                                                    {lesson.summary || 'Structured lesson content for this part of the topic.'}
                                                </p>

                                                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-300">
                                                    Open lesson
                                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="editorial-panel p-8 text-center text-dark-300">
                                    Lesson content is still being assembled for this topic.
                                </div>
                            )}
                        </section>

                        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                            <LearningPathPanel
                                eyebrow="Topic map"
                                title="See the lesson sequence before you start"
                                description="Use the sequence to understand what comes next and jump straight into the right lesson."
                                items={lessonPathItems}
                                getHref={(lesson) => `/lesson/${lesson.id}`}
                                emptyState="Published lessons for this topic will appear here once the sequence is ready."
                            />

                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Practice set</p>
                                <h2 className="mt-3 text-xl font-semibold text-dark-50">Reinforce the topic with a focused question set.</h2>
                                <p className="mt-3 text-sm leading-7 text-dark-300">
                                    {topic.questionCount > 0
                                        ? `${topic.questionCount} questions are ready for this topic. Use them after reading to spot weak areas quickly.`
                                        : 'The practice bank is still being expanded for this topic.'}
                                </p>
                                {topic.questionCount > 0 ? (
                                    <Link to={`/practice/${id}`} className="btn-primary mt-5 w-full justify-center">
                                        Start practice
                                        <PlayCircle className="h-4 w-4" />
                                    </Link>
                                ) : (
                                    <div className="mt-5 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300">
                                        Practice will appear automatically once the question bank reaches this topic.
                                    </div>
                                )}
                            </div>

                            <div className="progress-panel">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Topic summary</p>
                                <div className="mt-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <BookOpenCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">{lessons.length} lessons available</p>
                                            <p className="mt-1 text-sm text-dark-400">A guided sequence instead of loose reading material.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">{topic.questionCount} practice questions</p>
                                            <p className="mt-1 text-sm text-dark-400">Revision support tied directly to this topic.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                ) : (
                    <div className="editorial-panel p-12 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/12 text-primary-300">
                            <Lock className="h-7 w-7" />
                        </div>
                        <h2 className="mt-6 text-2xl font-semibold text-dark-100 mb-4">Content Coming Soon</h2>
                        <p className="text-dark-400 mb-6 max-w-md mx-auto">
                            Lessons and practice questions for this topic are being developed.
                            Check back soon to start learning!
                        </p>
                        <Link to={`/track/${topic.trackSlug}`} className="btn-secondary">
                            Back to track
                        </Link>
                    </div>
                )}

                {hasContent && (
                    <div className="mt-8 flex justify-start">
                        <Link to={`/track/${topic.trackSlug}`} className="btn-ghost text-sm">
                            Back to {topic.trackTitle}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
