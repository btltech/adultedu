import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

const ClockIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const PlayIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const BookIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
)

export default function Topic() {
    const { id } = useParams()
    const [topic, setTopic] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTopic() {
            try {
                const data = await api(`/topics/${id}`)
                setTopic(data)
            } catch (err) {
                console.error('Failed to load topic:', err)
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

    if (!topic) {
        return (
            <div className="py-12">
                <div className="container-app text-center">
                    <h1 className="text-2xl font-bold text-dark-50 mb-4">Topic not found</h1>
                    <Link to="/tracks" className="btn-primary">Browse courses</Link>
                </div>
            </div>
        )
    }

    const hasContent = topic.lessons?.length > 0 || topic.questionCount > 0

    return (
        <div className="py-12">
            <div className="container-app max-w-4xl">
                {/* Breadcrumb */}
                <nav className="mb-6 text-sm">
                    <Link to="/tracks" className="text-dark-400 hover:text-dark-200">Courses</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <Link to={`/track/${topic.trackSlug}`} className="text-dark-400 hover:text-dark-200">{topic.trackTitle}</Link>
                    <span className="mx-2 text-dark-600">/</span>
                    <span className="text-dark-200">{topic.title}</span>
                </nav>

                {/* Header */}
                <div className="mb-8">
                    <span className="badge badge-primary mb-3">{topic.ukLevel}</span>
                    <h1 className="text-3xl font-bold text-dark-50 mb-4">{topic.title}</h1>
                    <p className="text-dark-300 text-lg">{topic.description}</p>
                </div>

                {hasContent ? (
                    <>
                        {/* Lessons */}
                        {topic.lessons?.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-dark-100 mb-4 flex items-center gap-2">
                                    <BookIcon />
                                    Lessons
                                </h2>
                                <div className="space-y-3">
                                    {topic.lessons.map((lesson, index) => (
                                        <Link
                                            key={lesson.id}
                                            to={`/lesson/${lesson.id}`}
                                            className="glass-card-hover p-4 flex items-center gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center font-medium">
                                                {index + 1}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="font-medium text-dark-100">{lesson.title}</h3>
                                                {lesson.summary && (
                                                    <p className="text-dark-400 text-sm line-clamp-1">{lesson.summary}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-dark-500 text-sm">
                                                <ClockIcon />
                                                {lesson.estMinutes} min
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Practice */}
                        {topic.questionCount > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-dark-100 mb-4 flex items-center gap-2">
                                    <PlayIcon />
                                    Practice
                                </h2>
                                <Link
                                    to={`/practice/${id}`}
                                    className="glass-card-hover p-6 flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="font-semibold text-dark-100 mb-1">Practice Questions</h3>
                                        <p className="text-dark-400 text-sm">
                                            {topic.questionCount} questions available • Test your understanding
                                        </p>
                                    </div>
                                    <div className="btn-primary">
                                        Start Practice
                                    </div>
                                </Link>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="glass-card p-12 text-center">
                        <div className="text-6xl mb-6">📚</div>
                        <h2 className="text-2xl font-semibold text-dark-100 mb-4">Content Coming Soon</h2>
                        <p className="text-dark-400 mb-6 max-w-md mx-auto">
                            Lessons and practice questions for this topic are being developed.
                            Check back soon to start learning!
                        </p>
                        <Link to={`/track/${topic.trackSlug}`} className="btn-secondary">
                            ← Back to track
                        </Link>
                    </div>
                )}

                {/* Back link */}
                {hasContent && (
                    <div className="mt-8">
                        <Link to={`/track/${topic.trackSlug}`} className="text-dark-400 hover:text-dark-200 text-sm">
                            ← Back to {topic.trackTitle}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
