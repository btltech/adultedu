import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowRight,
    BookOpenCheck,
    BriefcaseBusiness,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Code2,
    GraduationCap,
    NotebookText,
    ShieldCheck,
    Sparkles,
    Target,
} from 'lucide-react'
import { checkHealth, getTracks } from '../lib/api'
import { formatLessonTime } from '../lib/studyTime'
import { useAuth } from '../context/AuthContext'

const categoryConfig = {
    workplace: { icon: BriefcaseBusiness, label: 'Workplace Skills' },
    qual_prep: { icon: GraduationCap, label: 'Qualification Prep' },
    qualifications: { icon: GraduationCap, label: 'GCSE Subjects' },
    tech: { icon: Code2, label: 'Tech Pathways' },
    he: { icon: BookOpenCheck, label: 'Higher Education' },
}

const defaultTracks = [
    { id: 1, slug: 'essential-digital-skills', title: 'Essential Digital Skills', description: 'Master the digital skills you need for everyday life and work.', category: 'workplace', isLive: true, framework: 'EDS', estimatedMinutes: null, expectedStudyMinutes: null, questionCount: 0, learningGoal: { label: 'Work readiness' }, topics: 6 },
    { id: 2, slug: 'gcse-maths', title: 'GCSE Maths Preparation', description: 'Build strong maths foundations with guided practice and confidence-building revision.', category: 'qual_prep', isLive: true, framework: 'GCSE', estimatedMinutes: null, expectedStudyMinutes: null, questionCount: 0, learningGoal: { label: 'Exam preparation' }, topics: 8 },
    { id: 3, slug: 'python-foundations', title: 'Python Foundations', description: 'Learn programming from scratch with practical projects and structured support.', category: 'tech', isLive: true, framework: 'TECH', estimatedMinutes: null, expectedStudyMinutes: null, questionCount: 0, learningGoal: { label: 'Career and digital skills' }, topics: 8 },
]

function TrackCard({ track }) {
    const config = categoryConfig[track.category] || categoryConfig.workplace
    const Icon = config.icon
    const topicCount = typeof track.topics === 'number' ? track.topics : (track.topics?.length || 0)
    const lessonTime = formatLessonTime(track.estimatedMinutes)
    const expectedStudyTime = formatLessonTime(track.expectedStudyMinutes)
    const CardWrapper = track.isLive ? Link : 'div'
    const cardProps = track.isLive ? { to: `/track/${track.slug}` } : {}

    return (
        <CardWrapper
            {...cardProps}
            className={`premium-track-card group ${!track.isLive ? 'opacity-55 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">
                            {config.label}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-dark-50 transition-colors group-hover:text-primary-300">
                            {track.title}
                        </h3>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <span className={`badge ${track.isLive ? 'badge-primary' : 'badge-neutral'}`}>
                        {track.framework}
                    </span>
                    {!track.isLive && <span className="badge badge-neutral">Soon</span>}
                </div>
            </div>

            <p className="text-sm leading-relaxed text-dark-300 line-clamp-2">
                {track.description}
            </p>

            <div className="flex flex-wrap gap-2 text-xs font-medium text-dark-300">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dark-800/80 bg-dark-900/70 px-3 py-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-accent-300" />
                    {lessonTime}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-dark-800/80 bg-dark-900/70 px-3 py-1.5">
                    <NotebookText className="h-3.5 w-3.5 text-accent-300" />
                    {topicCount} topics
                </span>
                <span className="inline-flex items-center rounded-full border border-dark-800/80 bg-dark-900/70 px-3 py-1.5">
                    {track.questionCount || 0} questions
                </span>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-dark-800/70 pt-4 text-sm">
                <span className="text-dark-400">Full study: {expectedStudyTime}</span>
                {track.isLive && (
                    <span className="inline-flex items-center gap-2 font-medium text-primary-300 transition-all group-hover:gap-3">
                        Explore pathway <ArrowRight className="h-4 w-4" />
                    </span>
                )}
            </div>
        </CardWrapper>
    )
}

function TrackSkeleton() {
    return (
        <div className="skeleton-card h-72 rounded-[1.75rem] p-6">
            <div className="flex justify-between">
                <div className="skeleton h-10 w-10 rounded-2xl" />
                <div className="skeleton h-5 w-12 rounded-md" />
            </div>
            <div className="mt-6 space-y-3">
                <div className="skeleton-title" />
                <div className="skeleton-text w-full" />
                <div className="skeleton-text w-4/5" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="skeleton h-16 rounded-2xl" />
                <div className="skeleton h-16 rounded-2xl" />
            </div>
        </div>
    )
}

function Hero() {
    const { user } = useAuth()

    const primaryCta = user
        ? (user.needsOnboarding
            ? { to: '/start', label: 'Find your starting point' }
            : { to: '/dashboard', label: 'Continue learning' })
        : { to: '/signup', label: 'Find your starting point' }

    return (
        <section className="relative overflow-hidden pt-14 sm:pt-18 lg:pt-20">
            <div className="container-app">
                <div className="marketing-shell px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
                    <div className="relative z-10 mx-auto max-w-3xl text-center animate-fade-slide-up lg:mx-0 lg:text-left">
                        <span className="section-eyebrow">
                            <Sparkles className="h-3.5 w-3.5" />
                            Built for adult learners in the UK
                        </span>

                        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Learning that feels like a clear plan, not another app.
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-8 text-dark-300 sm:text-lg">
                            Choose a pathway, try real practice, and build confidence with explanations that show what to revise next.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-dark-300">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/25 bg-accent-500/10 px-3 py-1.5 text-accent-200">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Free public practice available
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-dark-700 bg-dark-900/70 px-3 py-1.5">
                                UK-aligned pathways
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-dark-700 bg-dark-900/70 px-3 py-1.5">
                                Independent learning platform
                            </span>
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                            <Link to={primaryCta.to} className="btn-primary px-6 py-3 text-base">
                                {primaryCta.label}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link to="/tracks" className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-dark-400 transition-colors hover:text-dark-100">
                                Browse pathways
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function WhyDifferent({ liveTrackCount }) {
    const principles = [
        {
            icon: Target,
            title: 'Start in the right place',
            description: 'A guided intake helps learners choose a pathway that fits their goal and confidence level.',
        },
        {
            icon: BookOpenCheck,
            title: 'Study with structure',
            description: 'Lessons, practice, and topic progress sit together so the route always feels visible.',
        },
        {
            icon: CheckCircle2,
            title: 'Try before signing up',
            description: 'The Life in the UK mock test is public, so learners can check the practice experience before creating an account.',
        },
    ]

    // Only claim a track count when the catalogue actually returned one, so the
    // headline can never advertise pathways the page below is failing to show.
    const stats = [
        ...(liveTrackCount > 0
            ? [{ label: 'Learning tracks', value: String(liveTrackCount) }]
            : []),
        { label: 'Practice style', value: 'Explained' },
        { label: 'Study model', value: 'Self-paced' },
    ]

    return (
        <section className="section-padding">
            <div className="container-app">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                    <div className="max-w-xl">
                        <span className="section-eyebrow">
                            <BookOpenCheck className="h-3.5 w-3.5" />
                            Why this is different
                        </span>
                        <h2 className="mt-4 text-3xl font-semibold text-dark-50 sm:text-4xl">
                            A calmer route into learning.
                        </h2>
                        <p className="mt-4 text-base leading-8 text-dark-300">
                            AdultEdu keeps the first decision simple, then gives each learner a visible path through lessons, practice, and progress. It is independent and UK-aligned, not an awarding body or official exam provider.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        {principles.map((principle) => {
                            const Icon = principle.icon
                            return (
                                <div key={principle.title} className="feature-panel flex gap-4 p-5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-dark-50">{principle.title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-dark-300">{principle.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className={`mt-8 grid gap-3 ${stats.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    {stats.map((stat) => (
                        <div key={stat.label} className="learning-stat">
                            <p className="learning-stat-label">{stat.label}</p>
                            <p className="learning-stat-value">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

/**
 * Fetched once for the whole page so the headline stats and the pathway grid
 * can never disagree about how much catalogue exists.
 */
function useTrackCatalogue() {
    const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
    const [tracks, setTracks] = useState(demoMode ? defaultTracks : [])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function fetchTracks() {
            try {
                const data = await getTracks()
                if (cancelled) return
                setTracks(data && data.length > 0 ? data : [])
                setFailed(false)
            } catch (err) {
                if (cancelled) return
                console.error('Failed to load tracks:', err)
                if (!demoMode) {
                    setTracks([])
                    // A failed request is not an empty catalogue — say so.
                    setFailed(true)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchTracks()
        return () => { cancelled = true }
    }, [demoMode])

    return { tracks, loading, failed }
}

function TracksSection({ tracks, loading, failed }) {
    const liveTracks = tracks.filter((track) => track.isLive)
    const featuredTracks = liveTracks.slice(0, 3)

    return (
        <section className="section-padding pt-0">
            <div className="container-app">
                <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <span className="section-eyebrow">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Featured pathways
                        </span>
                        <h2 className="mt-4 text-3xl font-semibold text-dark-50 sm:text-4xl">
                            Choose from a few strong starting points.
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-8 text-dark-300">
                            Start with one route that matches the learner's goal. The full catalogue is there when they are ready to compare more options.
                        </p>
                    </div>

                    {!loading && liveTracks.length <= featuredTracks.length && (
                        <Link to="/tracks" className="btn-secondary shrink-0 self-start lg:self-auto">
                            Browse all pathways
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((item) => <TrackSkeleton key={item} />)}
                    </div>
                ) : (
                    <>
                        {featuredTracks.length > 0 && (
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {featuredTracks.map((track) => (
                                    <TrackCard key={track.id} track={track} />
                                ))}
                            </div>
                        )}

                        {liveTracks.length > featuredTracks.length && (
                            <div className="mt-8 flex justify-center">
                                <Link to="/tracks" className="btn-primary">
                                    View all pathways
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        {tracks.length === 0 && !loading && (
                            <div className="editorial-panel p-10 text-center">
                                {failed ? (
                                    <>
                                        <h3 className="text-2xl font-semibold text-dark-50">Pathways aren't loading right now</h3>
                                        <p className="mt-3 text-dark-300">This is a problem on our side, not yours. Please try again in a few minutes.</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-semibold text-dark-50">The catalogue is still being prepared</h3>
                                        <p className="mt-3 text-dark-300">No pathways are available yet. Check back soon for new public learning routes.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    )
}

function ProofSection() {
    const proofItems = [
        {
            title: 'No account needed to try it',
            description: 'Learners can answer real questions and see explanations before deciding whether to create an account.',
        },
        {
            title: 'Feedback that points somewhere',
            description: 'Each session gives explanations and topic links, so weak areas turn into a clearer revision step.',
        },
        {
            title: 'Transparent limits',
            description: 'AdultEdu supports practice and confidence-building. It does not replace official guidance or formal qualifications.',
        },
    ]

    return (
        <section className="section-padding pt-0">
            <div className="container-app">
                <div className="marketing-shell px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <ClipboardCheck className="h-3.5 w-3.5" />
                                Proof in practice
                            </span>
                            <h2 className="mt-4 text-3xl font-semibold text-dark-50 sm:text-4xl">
                                Try a complete public practice experience.
                            </h2>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-dark-300">
                                The Life in the UK mock test shows the platform promise in one focused flow: questions, explanations, scoring, and topic feedback, with no account required.
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Link to="/life-in-the-uk-test" className="btn-primary">
                                    Take the free mock test
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link to="/track/life-in-the-uk-test" className="btn-secondary">
                                    View the full pathway
                                </Link>
                            </div>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Why it matters</p>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                {proofItems.map((item) => (
                                    <div key={item.title} className="editorial-subpanel p-4">
                                        <p className="font-semibold text-dark-100">{item.title}</p>
                                        <p className="mt-1 text-dark-400">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function FinalCta() {
    const { user } = useAuth()
    const cta = user
        ? (user.needsOnboarding
            ? { to: '/start', label: 'Find your starting point', description: 'Answer a few questions and let AdultEdu point you toward a pathway that fits your goal.' }
            : { to: '/dashboard', label: 'Continue learning', description: 'Pick up from your dashboard and keep moving through your current pathway.' })
        : { to: '/signup', label: 'Find your starting point', description: 'Answer a few questions and let AdultEdu point you toward a pathway that fits your goal.' }

    return (
        <section className="section-padding pt-0">
            <div className="container-app">
                <div className="marketing-shell px-6 py-8 text-center sm:px-8 sm:py-10 lg:px-12">
                    <span className="section-eyebrow justify-center">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Ready when you are
                    </span>
                    <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold text-dark-50 sm:text-4xl">
                        Start with one clear next step.
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-dark-300">
                        {cta.description}
                    </p>
                    <div className="mt-7 flex justify-center">
                        <Link to={cta.to} className="btn-primary px-6 py-3 text-base">
                            {cta.label}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

function HealthStatus() {
    const [status, setStatus] = useState(null)

    useEffect(() => {
        if (!import.meta.env.DEV) return

        async function check() {
            try {
                const result = await checkHealth()
                setStatus({ ok: true, data: result })
            } catch (error) {
                setStatus({ ok: false, error: error.message })
            }
        }

        check()
    }, [])

    if (!import.meta.env.DEV || !status) return null

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${status.ok
                ? 'border-accent-500/30 bg-accent-500/20 text-accent-200'
                : 'border-red-500/30 bg-red-500/20 text-red-200'
                }`}>
                API: {status.ok ? 'Connected' : 'Offline'}
            </div>
        </div>
    )
}

export default function Home() {
    const { tracks, loading, failed } = useTrackCatalogue()
    const liveTrackCount = tracks.filter((track) => track.isLive).length

    return (
        <>
            <Hero />
            <WhyDifferent liveTrackCount={loading || failed ? 0 : liveTrackCount} />
            <TracksSection tracks={tracks} loading={loading} failed={failed} />
            <ProofSection />
            <FinalCta />
            <HealthStatus />
        </>
    )
}
