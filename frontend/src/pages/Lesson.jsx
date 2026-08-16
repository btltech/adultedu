import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenCheck, Clock3, GraduationCap, Lightbulb, ListChecks, NotebookPen, Target, TriangleAlert } from 'lucide-react'
import { api } from '../lib/api'
import LearningPathPanel from '../components/LearningPathPanel'

export default function Lesson() {
    const { id } = useParams()
    const [lesson, setLesson] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchLesson() {
            try {
                const data = await api(`/lessons/${id}`)
                setLesson(data)
            } catch (err) {
                console.error('Failed to load lesson:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchLesson()
    }, [id])

    if (loading) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl">
                    <div className="skeleton h-8 w-64 mb-4" />
                    <div className="skeleton h-96 w-full" />
                </div>
            </div>
        )
    }

    if (!lesson) {
        return (
            <div className="py-12">
                <div className="container-app max-w-4xl text-center">
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">Lesson not found</h1>
                    <Link to="/tracks" className="btn-primary">Browse pathways</Link>
                </div>
            </div>
        )
    }

    const contentBlocks = lesson.contentBlocks || []
    const readingSections = contentBlocks.filter((block) => block.type === 'heading' || block.type === 'subheading').length
    const lessonPathItems = (lesson.topic.lessons || []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        meta: `${entry.estMinutes || 0} min lesson`,
    }))

    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'heading':
                return <h2 key={index} className="lesson-block-heading">{block.content}</h2>
            case 'subheading':
                return <h3 key={index} className="lesson-block-subheading">{block.content}</h3>
            case 'paragraph':
                return <p key={index} className="mb-5 text-base leading-8 text-dark-300">{block.content}</p>
            case 'list':
                return (
                    <ul key={index} className="mb-6 ml-1 space-y-3 text-dark-300">
                        {(block.items || []).map((item, i) => (
                            <li key={i} className="flex gap-3 leading-7">
                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-300" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                )
            case 'code':
                return (
                    <pre key={index} className="mb-6 overflow-x-auto rounded-[1.5rem] border border-dark-800/80 bg-dark-950/95 p-5 text-sm shadow-lg">
                        <code className="text-sm text-dark-200">{block.content}</code>
                    </pre>
                )
            case 'callout':
                {
                    const calloutStyles = block.variant === 'tip'
                        ? {
                            className: 'lesson-callout border-accent-500/30 bg-accent-500/10',
                            icon: <Lightbulb className="h-4 w-4 text-accent-300" />,
                            label: 'Tip',
                        }
                        : block.variant === 'warning'
                            ? {
                                className: 'lesson-callout border-amber-500/30 bg-amber-500/10',
                                icon: <TriangleAlert className="h-4 w-4 text-amber-300" />,
                                label: 'Watch for this',
                            }
                            : {
                                className: 'lesson-callout border-primary-500/30 bg-primary-500/10',
                                icon: <NotebookPen className="h-4 w-4 text-primary-300" />,
                                label: 'Key idea',
                            }

                    return (
                        <div key={index} className={calloutStyles.className}>
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-dark-100">
                                {calloutStyles.icon}
                                {calloutStyles.label}
                            </div>
                            <p className="text-dark-200 leading-7">{block.content}</p>
                        </div>
                    )
                }
            default:
                return <p key={index} className="mb-5 text-base leading-8 text-dark-300">{block.content || JSON.stringify(block)}</p>
        }
    }

    return (
        <div className="section-padding animate-fade-slide-up">
            <div className="container-app max-w-6xl">
                <nav className="mb-6 text-sm">
                    <Link to={`/track/${lesson.track.slug}`} className="text-dark-400 hover:text-dark-200">
                        {lesson.track.title}
                    </Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to={`/topic/${lesson.topic.id}`} className="text-dark-400 hover:text-dark-200">
                        {lesson.topic.title}
                    </Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">{lesson.title}</span>
                </nav>

                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <GraduationCap className="h-3.5 w-3.5" />
                                Guided lesson
                            </span>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="badge badge-primary">{lesson.topic.ukLevel}</span>
                                <span className="badge badge-neutral">{lesson.topic.title}</span>
                            </div>

                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">
                                {lesson.title}
                            </h1>
                            {lesson.summary && (
                                <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">{lesson.summary}</p>
                            )}

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Reading time</p>
                                    <p className="learning-stat-value">{lesson.estMinutes || 0}m</p>
                                    <p className="mt-2 flex items-center gap-2 text-sm text-dark-400"><Clock3 className="h-4 w-4 text-accent-300" /> Estimated pace</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Content blocks</p>
                                    <p className="learning-stat-value">{contentBlocks.length}</p>
                                    <p className="mt-2 text-sm text-dark-400">Structured reading units</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Sections</p>
                                    <p className="learning-stat-value">{readingSections}</p>
                                    <p className="mt-2 text-sm text-dark-400">Headings and subheadings</p>
                                </div>
                                <div className="learning-stat">
                                    <p className="learning-stat-label">Next step</p>
                                    <p className="learning-stat-value">Practice</p>
                                    <p className="mt-2 text-sm text-dark-400">Apply the lesson immediately</p>
                                </div>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Study approach</p>
                            <h2 className="mt-3 text-2xl font-semibold text-dark-50">Read for understanding, then switch into retrieval.</h2>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <NotebookPen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Absorb the key idea</p>
                                            <p className="mt-1 text-dark-400">Use the headings, summaries, and callouts to focus on what matters.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <div className="flex items-start gap-3">
                                        <ListChecks className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                        <div>
                                            <p className="font-semibold text-dark-100">Convert it to recall</p>
                                            <p className="mt-1 text-dark-400">Practice straight away so the lesson turns into durable memory.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <Link to={`/practice/${lesson.topic.id}`} className="btn-primary w-full justify-center">
                                    Practice this topic
                                    <Target className="h-4 w-4" />
                                </Link>
                                <Link to={`/topic/${lesson.topic.id}`} className="btn-ghost w-full justify-center">
                                    Back to topic
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                    <section className="lesson-content-shell">
                        {contentBlocks.length > 0 ? (
                            contentBlocks.map(renderBlock)
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/12 text-primary-300">
                                    <BookOpenCheck className="h-7 w-7" />
                                </div>
                                <h2 className="mt-6 text-xl font-semibold text-dark-200 mb-4">Content Coming Soon</h2>
                                <p className="text-dark-400">This lesson is being developed. Check back soon!</p>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                        <LearningPathPanel
                            eyebrow="Topic map"
                            title="Keep your place in the sequence"
                            description="Move through the topic in order, or jump back to earlier lessons if you need a refresher."
                            items={lessonPathItems}
                            currentId={lesson.id}
                            getHref={(entry) => `/lesson/${entry.id}`}
                        />

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Lesson at a glance</p>
                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                    <div>
                                        <p className="font-semibold text-dark-100">{lesson.estMinutes || 0} minute read</p>
                                        <p className="mt-1 text-sm text-dark-400">Designed to fit a focused study session.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <NotebookPen className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                    <div>
                                        <p className="font-semibold text-dark-100">{contentBlocks.length} content blocks</p>
                                        <p className="mt-1 text-sm text-dark-400">Headings, notes, and examples arranged for faster scanning.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-300" />
                                    <div>
                                        <p className="font-semibold text-dark-100">Follow with practice</p>
                                        <p className="mt-1 text-sm text-dark-400">The best time to test recall is immediately after reading.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Navigation</p>
                            <div className="mt-4 flex flex-col gap-3">
                                {lesson.topic.previousLesson && (
                                    <Link to={`/lesson/${lesson.topic.previousLesson.id}`} className="btn-secondary w-full justify-center">
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous lesson
                                    </Link>
                                )}
                                {lesson.topic.nextLesson && (
                                    <Link to={`/lesson/${lesson.topic.nextLesson.id}`} className="btn-secondary w-full justify-center">
                                        Next lesson
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}
                                <Link to={`/topic/${lesson.topic.id}`} className="btn-secondary w-full justify-center">
                                    Topic overview
                                </Link>
                                <Link to={`/practice/${lesson.topic.id}`} className="btn-primary w-full justify-center">
                                    Practice questions
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link to={`/topic/${lesson.topic.id}`} className="btn-ghost">
                            <ArrowLeft className="h-4 w-4" />
                            Back to topic
                        </Link>
                        {lesson.topic.previousLesson && (
                            <Link to={`/lesson/${lesson.topic.previousLesson.id}`} className="btn-secondary">
                                <ArrowLeft className="h-4 w-4" />
                                Previous lesson
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {lesson.topic.nextLesson ? (
                            <Link to={`/lesson/${lesson.topic.nextLesson.id}`} className="btn-secondary">
                                Next lesson
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : null}
                        <Link to={`/practice/${lesson.topic.id}`} className="btn-primary">
                            Practice Questions
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
