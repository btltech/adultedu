import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, BriefcaseBusiness, CheckCircle2, Clock3, Code2, GraduationCap, Layers3, NotebookText, Search, SlidersHorizontal, Target, X } from 'lucide-react'
import { getTracks } from '../lib/api'
import { averagePublishedLessonMinutes, formatLessonTime } from '../lib/studyTime'
import { TrackSkeleton } from '../components/Skeleton'

const categoryConfig = {
    workplace: { icon: BriefcaseBusiness, label: 'Workplace Skills' },
    qual_prep: { icon: GraduationCap, label: 'Qualification Prep' },
    qualifications: { icon: GraduationCap, label: 'GCSE Subjects' },
    tech: { icon: Code2, label: 'Tech Pathways' },
    he: { icon: BookOpenCheck, label: 'Higher Education' },
}

const starterSlugs = ['essential-digital-skills', 'life-in-the-uk-test', 'gcse-maths', 'python-foundations']

const categoryOrder = ['workplace', 'qual_prep', 'qualifications', 'tech', 'he']

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
                        <h3 className="mt-2 text-lg font-semibold text-dark-50 group-hover:text-primary-300 transition-colors">
                            {track.title}
                        </h3>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <span className={`badge ${track.isLive ? 'badge-primary' : 'badge-neutral'}`}>
                        {track.framework}
                    </span>
                    {!track.isLive && (
                        <span className="badge badge-neutral">Coming Soon</span>
                    )}
                </div>
            </div>

            <p className="text-dark-300 text-sm leading-relaxed line-clamp-2">
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

            {track.isLive && (
                <div className="mt-auto flex items-center justify-between border-t border-dark-800/70 pt-4 text-sm">
                    <span className="text-dark-400">Full study: {expectedStudyTime}</span>
                    <span className="inline-flex items-center gap-2 font-medium text-primary-300 transition-all group-hover:gap-3">
                        Open pathway <ArrowRight className="h-4 w-4" />
                    </span>
                </div>
            )}
        </CardWrapper>
    )
}

function StarterPathway({ track }) {
    if (!track) return null

    const config = categoryConfig[track.category] || categoryConfig.workplace
    const Icon = config.icon

    return (
        <Link to={`/track/${track.slug}`} className="feature-panel group block p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Good first route</p>
                    <h3 className="mt-2 text-base font-semibold text-dark-50 transition-colors group-hover:text-primary-300">{track.title}</h3>
                </div>
            </div>
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-dark-400">{track.description}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-300">
                Start here <ArrowRight className="h-4 w-4" />
            </div>
        </Link>
    )
}

function SelectFilter({ label, value, onChange, options }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="input">
                {options.map((option) => (
                    <option key={option.key} value={option.key}>{option.label}</option>
                ))}
            </select>
        </label>
    )
}

export default function Tracks() {
    const [searchParams] = useSearchParams()
    const [tracks, setTracks] = useState([])
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all')
    const [frameworkFilter, setFrameworkFilter] = useState(searchParams.get('framework') || 'all')
    const [goalFilter, setGoalFilter] = useState(searchParams.get('goal') || 'all')
    const [studyTimeFilter, setStudyTimeFilter] = useState(searchParams.get('studyTime') || 'all')
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || searchParams.get('search') || '')
    const deferredSearchTerm = useDeferredValue(searchTerm)

    useEffect(() => {
        setCategoryFilter(searchParams.get('category') || 'all')
        setFrameworkFilter(searchParams.get('framework') || 'all')
        setGoalFilter(searchParams.get('goal') || 'all')
        setStudyTimeFilter(searchParams.get('studyTime') || 'all')
        setSearchTerm(searchParams.get('q') || searchParams.get('search') || '')
    }, [searchParams])

    useEffect(() => {
        async function fetchTracks() {
            try {
                const data = await getTracks()
                setTracks(data || [])
                setFailed(false)
            } catch (err) {
                console.error('Failed to load tracks:', err)
                // A failed request is not an empty catalogue — say so.
                setFailed(true)
            } finally {
                setLoading(false)
            }
        }
        fetchTracks()
    }, [])

    const categories = [
        { key: 'all', label: 'All Pathways' },
        { key: 'workplace', label: 'Workplace' },
        { key: 'qual_prep', label: 'Qualification Prep' },
        { key: 'qualifications', label: 'GCSE Subjects' },
        { key: 'tech', label: 'Tech' },
        { key: 'he', label: 'Higher Education' },
    ]

    const studyTimeOptions = [
        { key: 'all', label: 'Any study time' },
        { key: 'short', label: 'Short' },
        { key: 'medium', label: 'Medium' },
        { key: 'long', label: 'Long' },
        { key: 'tbd', label: 'Not yet set' },
    ]

    const frameworkOptions = useMemo(() => {
        const unique = new Map()

        tracks.forEach((track) => {
            const frameworks = Array.isArray(track.frameworks)
                ? track.frameworks
                : track.framework
                    ? [{ slug: track.framework, title: track.framework }]
                    : []

            frameworks.forEach((framework) => {
                if (!framework?.slug) return
                unique.set(framework.slug, framework.title || framework.slug)
            })
        })

        return [{ key: 'all', label: 'All frameworks' }, ...[...unique.entries()].map(([key, label]) => ({ key, label }))]
    }, [tracks])

    const goalOptions = useMemo(() => {
        const unique = new Map()
        tracks.forEach((track) => {
            if (!track.learningGoal?.key) return
            unique.set(track.learningGoal.key, track.learningGoal.label || track.learningGoal.key)
        })

        return [{ key: 'all', label: 'All goals' }, ...[...unique.entries()].map(([key, label]) => ({ key, label }))]
    }, [tracks])

    const filteredTracks = useMemo(() => {
        const query = deferredSearchTerm.trim().toLowerCase()

        return tracks.filter((track) => {
            const frameworks = Array.isArray(track.frameworks)
                ? track.frameworks.map((framework) => `${framework.slug} ${framework.title || ''}`.toLowerCase())
                : []
            const topicTitles = Array.isArray(track.topics)
                ? track.topics.map((topic) => (typeof topic === 'string' ? topic : topic?.title || '').toLowerCase())
                : []
            const haystack = [
                track.title,
                track.description || '',
                track.framework || '',
                track.learningGoal?.label || '',
                ...frameworks,
                ...topicTitles,
            ].join(' ').toLowerCase()

            if (query && !haystack.includes(query)) return false
            if (categoryFilter !== 'all' && track.category !== categoryFilter) return false
            if (frameworkFilter !== 'all') {
                const frameworkSlugs = Array.isArray(track.frameworks) ? track.frameworks.map((framework) => framework.slug) : [track.framework]
                if (!frameworkSlugs.includes(frameworkFilter)) return false
            }
            if (goalFilter !== 'all' && track.learningGoal?.key !== goalFilter) return false
            if (studyTimeFilter !== 'all' && track.expectedStudyBand !== studyTimeFilter) return false

            return true
        })
    }, [categoryFilter, deferredSearchTerm, frameworkFilter, goalFilter, studyTimeFilter, tracks])

    const liveTracks = filteredTracks.filter(t => t.isLive)
    const comingSoonTracks = filteredTracks.filter(t => !t.isLive)
    const starterTracks = starterSlugs
        .map((slug) => tracks.find((track) => track.slug === slug && track.isLive))
        .filter(Boolean)

    const groupedLiveTracks = categoryOrder
        .map((categoryKey) => ({
            key: categoryKey,
            ...categoryConfig[categoryKey],
            tracks: liveTracks
                .filter((track) => track.category === categoryKey)
                .sort((left, right) => left.title.localeCompare(right.title)),
        }))
        .filter((group) => group.tracks.length > 0)
    const stats = useMemo(() => ({
        frameworks: new Set(tracks.map((track) => track.framework).filter(Boolean)).size,
        totalTopics: tracks.reduce((sum, track) => sum + (typeof track.topics === 'number' ? track.topics : (track.topics?.length || 0)), 0),
        averageLessonMinutes: averagePublishedLessonMinutes(tracks),
        averageExpectedMinutes: averagePublishedLessonMinutes(tracks, (track) => track?.expectedStudyMinutes),
    }), [tracks])

    const hasActiveFilters = categoryFilter !== 'all'
        || frameworkFilter !== 'all'
        || goalFilter !== 'all'
        || studyTimeFilter !== 'all'
        || searchTerm.trim().length > 0

    const clearFilters = () => {
        setCategoryFilter('all')
        setFrameworkFilter('all')
        setGoalFilter('all')
        setStudyTimeFilter('all')
        setSearchTerm('')
    }

    return (
        <div className="section-padding animate-fade-slide-up">
            <div className="container-app">
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
                        <div>
                            <span className="section-eyebrow">
                                <Layers3 className="h-3.5 w-3.5" />
                                Structured public catalogue
                            </span>
                            <h1 className="mt-4 max-w-3xl text-4xl font-bold text-dark-50 sm:text-5xl">
                                Find the right pathway without wading through the whole catalogue.
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-8 text-dark-300">
                                Start with a few sensible entry routes, then narrow the full catalogue by goal, framework, and study load when you need a more specific option. Pathways are for guided practice and confidence-building, not formal accreditation.
                            </p>
                        </div>

                        {/* Hard zeros read as "this platform is empty" — only show once real data has landed. */}
                        {!loading && !failed && tracks.length > 0 && (
                        <div className="editorial-panel grid gap-3 p-5 sm:grid-cols-2">
                            <div>
                                <p className="learning-stat-label">Frameworks</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{stats.frameworks || 0}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Topics</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{stats.totalTopics || 0}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Typical full study</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{formatLessonTime(stats.averageExpectedMinutes)}</p>
                            </div>
                            <div>
                                <p className="learning-stat-label">Live pathways</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{tracks.filter((track) => track.isLive).length}</p>
                            </div>
                        </div>
                        )}
                    </div>
                </section>

                {starterTracks.length > 0 && (
                    <section className="mb-8">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <span className="section-eyebrow">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Recommended starting points
                                </span>
                                <h2 className="mt-3 text-2xl font-semibold text-dark-50">Four routes that make the first choice easier.</h2>
                            </div>
                            <Link to="/start" className="btn-secondary self-start sm:self-auto">
                                Help me choose
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {starterTracks.map((track) => (
                                <StarterPathway key={track.id} track={track} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Filters over a catalogue we failed to load would just report
                    "0 pathways shown" next to the error panel. */}
                {!failed && (
                <section className="editorial-panel mb-8 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-dark-100">
                            <SlidersHorizontal className="h-4 w-4 text-accent-300" />
                            <h2 className="text-base font-semibold text-dark-50">Find the right pathway faster</h2>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn-ghost px-4 py-2 text-sm">
                                Clear filters
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(160px,0.55fr))_auto] lg:items-end">
                        <label className="block">
                            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Search</span>
                            <span className="relative block">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search by subject, topic, or framework"
                                    aria-label="Search pathways"
                                    className="w-full rounded-2xl border border-dark-700 bg-dark-900/80 py-3 pl-11 pr-4 text-sm text-dark-100 outline-none transition-all placeholder:text-dark-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                />
                            </span>
                        </label>

                        <SelectFilter label="Learning goal" value={goalFilter} onChange={setGoalFilter} options={goalOptions} />
                        <SelectFilter label="Framework" value={frameworkFilter} onChange={setFrameworkFilter} options={frameworkOptions} />
                        <SelectFilter label="Study time" value={studyTimeFilter} onChange={setStudyTimeFilter} options={studyTimeOptions} />

                        <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 px-4 py-3 text-sm text-dark-300">
                            <span className="font-semibold text-dark-100">{filteredTracks.length}</span> pathway{filteredTracks.length === 1 ? '' : 's'} shown
                        </div>
                    </div>

                    <div className="mt-5">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Category</p>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category.key}
                                    onClick={() => setCategoryFilter(category.key)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${categoryFilter === category.key
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                        : 'border border-dark-700 bg-dark-900/70 text-dark-300 hover:border-dark-500 hover:text-dark-100'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm text-dark-300">
                        <div className="flex items-start gap-3">
                            <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                            <p>Study estimates are guidance, not a guarantee. Expected full study combines published lesson time with the current practice load so pathway scope is clearer before learners start.</p>
                        </div>
                    </div>
                </section>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <TrackSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {groupedLiveTracks.length > 0 && (
                            <div className="space-y-10">
                                {groupedLiveTracks.map((group) => {
                                    const Icon = group.icon

                                    return (
                                        <section key={group.key}>
                                            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                                <div>
                                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-dark-100">
                                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500/12 text-accent-300">
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        {group.label}
                                                    </h2>
                                                    <p className="mt-2 max-w-xl text-sm text-dark-400">
                                                        {group.tracks.length} pathway{group.tracks.length === 1 ? '' : 's'} available in this area.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                                {group.tracks.map(track => (
                                                    <TrackCard key={track.id} track={track} />
                                                ))}
                                            </div>
                                        </section>
                                    )
                                })}
                            </div>
                        )}

                        {/* Coming soon tracks */}
                        {comingSoonTracks.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-dark-300 mb-2">Building Next</h2>
                                <p className="mb-5 max-w-xl text-sm text-dark-500">
                                    Future tracks are visible early so learners can see where the platform is heading.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {comingSoonTracks.map(track => (
                                        <TrackCard key={track.id} track={track} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {tracks.length === 0 && (
                            <div className="editorial-panel p-12 text-center text-dark-300">
                                {failed ? (
                                    <>
                                        <h2 className="text-2xl font-semibold text-dark-50">Pathways aren't loading right now</h2>
                                        <p className="mt-3">This is a problem on our side, not yours. Please try again in a few minutes.</p>
                                        <button onClick={() => window.location.reload()} className="btn-secondary mt-5">
                                            Try again
                                        </button>
                                    </>
                                ) : (
                                    <p>No pathways available yet. Check back soon.</p>
                                )}
                            </div>
                        )}

                        {tracks.length > 0 && filteredTracks.length === 0 && (
                            <div className="editorial-panel p-12 text-center text-dark-300">
                                <h2 className="text-2xl font-semibold text-dark-50">No pathways match the current filters</h2>
                                <p className="mt-3">Try a broader search or clear one or more filters.</p>
                                <button onClick={clearFilters} className="btn-secondary mt-5">
                                    Reset filters
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
