import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTracks } from '../lib/api'
import { TrackSkeleton } from '../components/Skeleton'

// Icons
const ComputerIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

const BookIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
)

const CodeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
)

const ClockIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

const categoryConfig = {
    workplace: { icon: ComputerIcon, label: 'Workplace Skills' },
    qual_prep: { icon: BookIcon, label: 'Qualification Prep' },
    tech: { icon: CodeIcon, label: 'Tech Pathways' },
    he: { icon: BookIcon, label: 'Higher Education' },
}

function TrackCard({ track }) {
    const config = categoryConfig[track.category] || categoryConfig.workplace
    const Icon = config.icon
    const topicCount = typeof track.topics === 'number' ? track.topics : (track.topics?.length || 0)

    const CardWrapper = track.isLive ? Link : 'div'
    const cardProps = track.isLive ? { to: `/track/${track.slug}` } : {}

    return (
        <CardWrapper
            {...cardProps}
            className={`track-card group ${!track.isLive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                    <Icon />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <span className={`badge ${track.isLive ? 'badge-primary' : 'badge-neutral'}`}>
                        {track.framework}
                    </span>
                    {!track.isLive && (
                        <span className="badge badge-neutral">Coming Soon</span>
                    )}
                </div>
            </div>

            <div className="flex-grow space-y-1.5">
                <h3 className="text-base font-semibold text-dark-50 group-hover:text-primary-400 transition-colors">
                    {track.title}
                </h3>
                <p className="text-dark-400 text-sm leading-relaxed line-clamp-2">
                    {track.description}
                </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-dark-500 pt-2 border-t border-dark-700/50">
                <span className="flex items-center gap-1">
                    <ClockIcon />
                    {track.estimatedHours}h
                </span>
                <span>{topicCount} topics</span>
            </div>
        </CardWrapper>
    )
}

export default function Tracks() {
    const [tracks, setTracks] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        async function fetchTracks() {
            try {
                const data = await getTracks()
                setTracks(data || [])
            } catch (err) {
                console.error('Failed to load tracks:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTracks()
    }, [])

    const categories = [
        { key: 'all', label: 'All Courses' },
        { key: 'workplace', label: 'Workplace' },
        { key: 'qual_prep', label: 'Qualifications' },
        { key: 'tech', label: 'Tech' },
    ]

    const filteredTracks = filter === 'all'
        ? tracks
        : tracks.filter(t => t.category === filter)

    const liveTracks = filteredTracks.filter(t => t.isLive)
    const comingSoonTracks = filteredTracks.filter(t => !t.isLive)

    return (
        <div className="section-padding animate-fade-slide-up">
            <div className="container-app">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-dark-50 mb-2">All Courses</h1>
                    <p className="text-dark-400 max-w-xl text-sm sm:text-base">
                        Explore our range of courses aligned to UK qualification frameworks.
                    </p>
                </div>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setFilter(cat.key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === cat.key
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'bg-dark-800 text-dark-300 hover:bg-dark-700 border border-dark-700'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <TrackSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Live tracks */}
                        {liveTracks.length > 0 && (
                            <div className="mb-10">
                                <h2 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-accent-400" />
                                    Available Now
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
                                    {liveTracks.map(track => (
                                        <TrackCard key={track.id} track={track} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coming soon tracks */}
                        {comingSoonTracks.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-dark-400 mb-4">Coming Soon</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {comingSoonTracks.map(track => (
                                        <TrackCard key={track.id} track={track} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {tracks.length === 0 && (
                            <div className="text-center py-12 text-dark-400">
                                <p>No courses available yet. Check back soon!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
