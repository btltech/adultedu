import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'

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
                    <Link to="/tracks" className="btn-primary">Browse courses</Link>
                </div>
            </div>
        )
    }

    // Render content blocks
    const renderBlock = (block, index) => {
        switch (block.type) {
            case 'heading':
                return <h2 key={index} className="text-2xl font-bold text-dark-50 mb-4 mt-8">{block.content}</h2>
            case 'subheading':
                return <h3 key={index} className="text-xl font-semibold text-dark-100 mb-3 mt-6">{block.content}</h3>
            case 'paragraph':
                return <p key={index} className="text-dark-300 leading-relaxed mb-4">{block.content}</p>
            case 'list':
                return (
                    <ul key={index} className="list-disc list-inside text-dark-300 mb-4 ml-4 space-y-2">
                        {(block.items || []).map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                )
            case 'code':
                return (
                    <pre key={index} className="bg-dark-900 border border-dark-700 rounded-xl p-4 mb-4 overflow-x-auto">
                        <code className="text-sm text-dark-200">{block.content}</code>
                    </pre>
                )
            case 'callout':
                return (
                    <div key={index} className={`p-4 rounded-xl mb-4 ${block.variant === 'tip'
                        ? 'bg-accent-500/10 border border-accent-500/30'
                        : block.variant === 'warning'
                            ? 'bg-amber-500/10 border border-amber-500/30'
                            : 'bg-primary-500/10 border border-primary-500/30'
                        }`}>
                        <p className="text-dark-200">{block.content}</p>
                    </div>
                )
            default:
                return <p key={index} className="text-dark-300 mb-4">{block.content || JSON.stringify(block)}</p>
        }
    }

    return (
        <div className="section-padding animate-fade-slide-up">
            <div className="container-app max-w-4xl">
                {/* Breadcrumb */}
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

                {/* Header */}
                <div className="mb-8">
                    <span className="badge badge-primary mb-3">{lesson.topic.ukLevel}</span>
                    <h1 className="text-3xl font-bold text-dark-50 mb-4">{lesson.title}</h1>
                    {lesson.summary && (
                        <p className="text-dark-300 text-lg">{lesson.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-dark-500 text-sm">
                        <span>⏱ {lesson.estMinutes} min read</span>
                    </div>
                </div>

                {/* Content */}
                <div className="glass-card p-8">
                    {lesson.contentBlocks.length > 0 ? (
                        lesson.contentBlocks.map(renderBlock)
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-6">📖</div>
                            <h2 className="text-xl font-semibold text-dark-200 mb-4">Content Coming Soon</h2>
                            <p className="text-dark-400">This lesson is being developed. Check back soon!</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                    <Link to={`/topic/${lesson.topic.id}`} className="btn-secondary">
                        ← Back to topic
                    </Link>
                    <Link to={`/practice/${lesson.topic.id}`} className="btn-primary">
                        Practice Questions →
                    </Link>
                </div>
            </div>
        </div>
    )
}
