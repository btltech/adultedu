import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { checkHealth, getTracks } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DailyChallenge from '../components/gamification/DailyChallenge'
import AchievementBadges from '../components/gamification/AchievementBadges'
import Leaderboard from '../components/gamification/Leaderboard'

// Icons
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

const ComputerIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
)

const ClockIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

// Category config
const categoryConfig = {
    workplace: { icon: ComputerIcon, label: 'Workplace Skills' },
    qual_prep: { icon: BookIcon, label: 'Qualification Prep' },
    tech: { icon: CodeIcon, label: 'Tech Pathways' },
    he: { icon: BookIcon, label: 'Higher Education' },
}

// Default tracks for demo mode
const defaultTracks = [
    { id: 1, slug: 'essential-digital-skills', title: 'Essential Digital Skills', description: 'Master the digital skills you need for everyday life and work.', category: 'workplace', isLive: true, framework: 'EDS', estimatedHours: 20, topics: 5 },
    { id: 2, slug: 'gcse-maths', title: 'GCSE Maths Preparation', description: 'Build strong maths foundations with practice questions.', category: 'qual_prep', isLive: true, framework: 'GCSE', estimatedHours: 40, topics: 8 },
    { id: 3, slug: 'python-foundations', title: 'Python Foundations', description: 'Learn programming from scratch with practical projects.', category: 'tech', isLive: true, framework: 'TECH', estimatedHours: 30, topics: 6 },
]

function TrackCard({ track }) {
    const config = categoryConfig[track.category] || categoryConfig.workplace
    const Icon = config.icon
    const topicCount = typeof track.topics === 'number' ? track.topics : (track.topics?.length || 0)

    const CardWrapper = track.isLive ? Link : 'div'
    const cardProps = track.isLive ? { to: `/track/${track.slug}` } : {}

    return (
        <CardWrapper {...cardProps} className={`track-card group ${!track.isLive ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
                    <Icon />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <span className={`badge ${track.isLive ? 'badge-primary' : 'badge-neutral'}`}>
                        {track.framework}
                    </span>
                    {!track.isLive && <span className="badge badge-neutral">Soon</span>}
                </div>
            </div>

            <div className="flex-grow space-y-1.5">
                <h3 className="text-base font-semibold text-dark-50 group-hover:text-primary-400 transition-colors leading-snug">
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

            {track.isLive && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 group-hover:gap-2.5 transition-all">
                    Start Learning <ArrowRightIcon />
                </span>
            )}
        </CardWrapper>
    )
}

function TrackSkeleton() {
    return (
        <div className="skeleton-card p-5 sm:p-6 flex flex-col gap-4 h-56">
            <div className="flex justify-between">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="skeleton w-12 h-5 rounded-md" />
            </div>
            <div className="space-y-2 flex-grow">
                <div className="skeleton-title" />
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-2/3" />
            </div>
        </div>
    )
}

function Hero() {
    return (
        <section className="relative overflow-hidden py-16 sm:py-20 lg:py-28">
            {/* Gradient accents */}
            <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container-app relative">
                <div className="max-w-2xl animate-fade-slide-up">
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-800/60 border border-dark-700/50 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                        <span className="text-xs font-medium text-dark-300">UK-aligned learning paths</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-[1.15] tracking-tight">
                        Build skills that <span className="text-gradient">open doors</span>
                    </h1>

                    {/* Supporting copy */}
                    <p className="text-base sm:text-lg text-dark-300 mb-8 leading-relaxed max-w-xl">
                        Free courses for essential digital skills, GCSE prep, and tech pathways. Learn at your pace, aligned to UK frameworks.
                    </p>

                    {/* Single CTA */}
                    <Link to="/tracks" className="btn-primary px-6 py-3 text-base">
                        Explore courses
                        <ArrowRightIcon />
                    </Link>
                </div>
            </div>
        </section>
    )
}

function Features() {
    const features = [
        { icon: '🎯', title: 'UK Framework Aligned', description: 'Content mapped to Entry Level through Level 8.' },
        { icon: '📊', title: 'Diagnostic First', description: 'Start with an assessment to find your level.' },
        { icon: '✅', title: 'Clear Explanations', description: 'Every question includes detailed feedback.' },
        { icon: '📈', title: 'Track Progress', description: 'See your mastery grow topic by topic.' },
    ]

    return (
        <section className="section-padding bg-dark-900/30">
            <div className="container-app">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-dark-50 mb-2">
                        Why learn with AdultEdu?
                    </h2>
                    <p className="text-dark-400 max-w-md mx-auto text-sm">
                        Designed for adult learners building new skills or returning to education.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                    {features.map((feature, index) => (
                        <div key={index} className="glass-card p-5 text-center hover:border-dark-600 transition-colors">
                            <div className="text-2xl mb-2">{feature.icon}</div>
                            <h3 className="text-sm font-semibold text-dark-100 mb-1">{feature.title}</h3>
                            <p className="text-dark-400 text-xs leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function TracksSection() {
    const [tracks, setTracks] = useState(import.meta.env.VITE_DEMO_MODE === 'true' ? defaultTracks : [])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTracks() {
            try {
                const data = await getTracks()
                if (data && data.length > 0) {
                    setTracks(data)
                } else {
                    setTracks([])
                }
            } catch (err) {
                console.log('Failed to fetch tracks:', err.message)
                if (import.meta.env.VITE_DEMO_MODE === 'true') {
                    console.log('Using default tracks in demo mode')
                } else {
                    setTracks([])
                }
            } finally {
                setLoading(false)
            }
        }
        fetchTracks()
    }, [])

    const liveTracks = tracks.filter(t => t.isLive)
    const comingSoonTracks = tracks.filter(t => !t.isLive)

    return (
        <section className="section-padding">
            <div className="container-app">
                <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-dark-50 mb-2">
                        Start Learning Today
                    </h2>
                    <p className="text-dark-400 text-sm">
                        Free courses ready for you to begin right now.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map(i => <TrackSkeleton key={i} />)}
                    </div>
                ) : (
                    <>
                        {liveTracks.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children mb-12">
                                {liveTracks.map(track => (
                                    <TrackCard key={track.id} track={track} />
                                ))}
                            </div>
                        )}

                        {comingSoonTracks.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-dark-400 mb-4">Coming Soon</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {comingSoonTracks.map(track => (
                                        <TrackCard key={track.id} track={track} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {tracks.length === 0 && !loading && (
                            <div className="text-center py-12 text-dark-400">
                                <p>No courses available yet. Check back soon!</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}

function HealthStatus() {
    const [status, setStatus] = useState(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        async function check() {
            try {
                const result = await checkHealth()
                setStatus({ ok: true, data: result })
            } catch (err) {
                setStatus({ ok: false, error: err.message })
            } finally {
                setChecking(false)
            }
        }
        check()
    }, [])

    if (checking) return null

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${status?.ok
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                API: {status?.ok ? 'Connected' : 'Offline'}
            </div>
        </div>
    )
}

function GamificationSection() {
    const { user } = useAuth()

    if (!user) return null // Only show for logged in users

    return (
        <section className="section-padding bg-dark-900/30">
            <div className="container-app">
                <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-semibold text-dark-50 mb-2">
                        Your Progress
                    </h2>
                    <p className="text-dark-400 text-sm">
                        Track your achievements and compete with fellow learners.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily Challenge */}
                    <div className="lg:col-span-2">
                        <DailyChallenge />
                    </div>

                    {/* Achievements */}
                    <div>
                        <AchievementBadges />
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="mt-6">
                    <Leaderboard />
                </div>
            </div>
        </section>
    )
}

export default function Home() {
    return (
        <>
            <Hero />
            <GamificationSection />
            <Features />
            <TracksSection />
            <HealthStatus />
        </>
    )
}
