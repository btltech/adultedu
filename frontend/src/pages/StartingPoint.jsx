import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    ArrowRight,
    BookOpenCheck,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    Clock3,
    Code2,
    Compass,
    GraduationCap,
    ShieldCheck,
    Sparkles,
    Target,
} from 'lucide-react'
import {
    checkHealth,
    completeOnboarding,
    getOnboardingRecommendation,
    getOnboardingStatus,
} from '../lib/api'
import { formatLessonTime } from '../lib/studyTime'
import { useAuth } from '../context/AuthContext'
import DiagnosticModal from '../components/diagnostic/DiagnosticModal'
import { getPathwayGuidance } from '../lib/pathwayGuidance'

const GOAL_OPTIONS = [
    {
        key: 'digital-confidence',
        title: 'Digital Confidence',
        description: 'Start with everyday online tasks, plain language, and confidence-building practice.',
        icon: ShieldCheck,
    },
    {
        key: 'essential-digital-skills',
        title: 'Essential Digital Skills',
        description: 'Build practical digital capability for life, forms, communication, and work.',
        icon: BookOpenCheck,
    },
    {
        key: 'life-in-the-uk',
        title: 'Life in the UK',
        description: 'Prepare for citizenship and practical life in the UK with guided revision.',
        icon: Compass,
    },
    {
        key: 'employability-skills',
        title: 'Employability Skills',
        description: 'Focus on work readiness, communication, and digital confidence for day-to-day tasks.',
        icon: BriefcaseBusiness,
    },
    {
        key: 'tech-foundations',
        title: 'Tech Foundations',
        description: 'Start technical learning with a calmer, structured route into coding and AI topics.',
        icon: Code2,
    },
    {
        key: 'qualification-prep',
        title: 'Qualification Preparation',
        description: 'Work toward GCSE, Functional Skills, or A-Level progression through structured pathways.',
        icon: GraduationCap,
    },
]

const CONFIDENCE_OPTIONS = [
    { value: 1, label: 'Very low', description: 'I need a calm, guided first step.' },
    { value: 2, label: 'Low', description: 'I can start, but I need clear support.' },
    { value: 3, label: 'Building', description: 'I am ready for a step-by-step route.' },
    { value: 4, label: 'Fairly confident', description: 'I can handle a fuller pathway.' },
    { value: 5, label: 'Ready to stretch', description: 'I am comfortable starting with more depth.' },
]

const WEEKLY_TIME_OPTIONS = [
    { key: 'light', label: '30 to 60 minutes', description: 'Short weekly study blocks.' },
    { key: 'steady', label: '1 to 3 hours', description: 'A manageable weekly routine.' },
    { key: 'focused', label: '3+ hours', description: 'Room for a deeper pathway.' },
]

const REFERRAL_OPTIONS = [
    { key: 'self', label: 'I found AdultEdu myself' },
    { key: 'library', label: 'Library or community digital support' },
    { key: 'council', label: 'Council or adult learning team' },
    { key: 'charity', label: 'Charity or community organisation' },
    { key: 'provider', label: 'Training provider or college' },
    { key: 'employability', label: 'Jobcentre or employability support' },
    { key: 'friend-family', label: 'Friend, family, or local contact' },
    { key: 'other', label: 'Other' },
]

function ChoiceCard({ active, icon: Icon, title, description, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`feature-panel text-left transition-all ${active ? 'border-primary-500/40 bg-primary-500/10 ring-2 ring-primary-500/25' : ''}`}
        >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/12 text-primary-300">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-dark-50">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-dark-300">{description}</p>
        </button>
    )
}

function ConfidenceCard({ active, option, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-4 text-left transition-all ${active
                ? 'border-primary-500/40 bg-primary-500/10 ring-2 ring-primary-500/25'
                : 'border-dark-800/80 bg-dark-900/60 hover:border-dark-600'
                }`}
        >
            <p className="text-sm font-semibold text-dark-100">{option.label}</p>
            <p className="mt-2 text-sm leading-6 text-dark-400">{option.description}</p>
        </button>
    )
}

function TimeCard({ active, option, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border p-4 text-left transition-all ${active
                ? 'border-accent-500/40 bg-accent-500/10 ring-2 ring-accent-500/20'
                : 'border-dark-800/80 bg-dark-900/60 hover:border-dark-600'
                }`}
        >
            <p className="text-sm font-semibold text-dark-100">{option.label}</p>
            <p className="mt-2 text-sm leading-6 text-dark-400">{option.description}</p>
        </button>
    )
}

function PathwayCard({ pathway, featured = false, current = false, onChoose, onDiagnostic }) {
    if (!pathway) return null

    const guidance = getPathwayGuidance(pathway)
    const primaryFramework = pathway.framework || pathway.frameworks?.[0]?.slug || null

    return (
        <div className={`editorial-panel p-6 ${featured ? 'border-primary-500/30 bg-primary-500/8' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">
                        {featured ? 'Recommended pathway' : 'Alternative pathway'}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-dark-50">{pathway.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {primaryFramework && <span className="badge badge-primary">{primaryFramework}</span>}
                    {pathway.learningGoal && <span className="badge badge-neutral">{pathway.learningGoal}</span>}
                    {current && <span className="badge badge-neutral">Saved route</span>}
                </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-dark-300">{pathway.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                    <p className="learning-stat-label">Study load</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-dark-100">
                        <Clock3 className="h-4 w-4 text-accent-300" />
                        {formatLessonTime(pathway.expectedStudyMinutes)}
                    </p>
                </div>
                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                    <p className="learning-stat-label">Practice</p>
                    <p className="mt-2 text-sm font-medium text-dark-100">{pathway.questionCount || 0} questions</p>
                </div>
                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                    <p className="learning-stat-label">Pace</p>
                    <p className="mt-2 text-sm font-medium capitalize text-dark-100">{pathway.expectedStudyBand || 'tbd'}</p>
                </div>
            </div>

            {Array.isArray(pathway.reasons) && pathway.reasons.length > 0 && (
                <div className="mt-5 rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-500">Why this fits</p>
                    <ul className="mt-3 space-y-2 text-sm text-dark-300">
                        {pathway.reasons.map((reason) => (
                            <li key={reason} className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-500">What this route supports</p>
                    <ul className="mt-3 space-y-2 text-sm text-dark-300">
                        {guidance.outcomes.slice(0, 2).map((outcome) => (
                            <li key={outcome} className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                <span>{outcome}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-500">What this can lead to next</p>
                    <ul className="mt-3 space-y-2 text-sm text-dark-300">
                        {guidance.nextSteps.slice(0, 2).map((nextStep) => (
                            <li key={nextStep.title} className="flex gap-2">
                                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-300" />
                                <span>{nextStep.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onChoose} className={featured ? 'btn-primary' : 'btn-secondary'}>
                    Use this pathway
                    <ArrowRight className="h-4 w-4" />
                </button>
                {featured && onDiagnostic && (
                    <button type="button" onClick={onDiagnostic} className="btn-ghost">
                        Check my starting level
                    </button>
                )}
                <Link to={`/track/${pathway.slug}`} className="btn-ghost">
                    View pathway details
                </Link>
            </div>
        </div>
    )
}

export default function StartingPoint() {
    const { user, checkAuth } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const onboardingDraft = location.state?.onboardingDraft || null
    const onboardingResumeError = location.state?.onboardingResumeError || ''
    const resumeDiagnosticTrack = location.state?.resumeDiagnosticTrack || null

    const [statusLoading, setStatusLoading] = useState(true)
    const [goal, setGoal] = useState('digital-confidence')
    const [confidenceBefore, setConfidenceBefore] = useState(3)
    const [weeklyTime, setWeeklyTime] = useState('steady')
    const [savedOnboarding, setSavedOnboarding] = useState(null)
    const [recommendation, setRecommendation] = useState(null)
    const [loadingRecommendation, setLoadingRecommendation] = useState(false)
    const [savingChoice, setSavingChoice] = useState('')
    const [error, setError] = useState('')
    const [diagnosticTrack, setDiagnosticTrack] = useState(null)
    const [referralSource, setReferralSource] = useState('self')
    const [cohortTag, setCohortTag] = useState('')
    const [organizationTag, setOrganizationTag] = useState('')

    useEffect(() => {
        if (!onboardingDraft) return

        const nextGoal = onboardingDraft.primaryGoal || 'digital-confidence'
        const nextConfidence = onboardingDraft.confidenceBefore || 3
        const nextWeeklyTime = onboardingDraft.weeklyTime || 'steady'

        setGoal(nextGoal)
        setConfidenceBefore(nextConfidence)
        setWeeklyTime(nextWeeklyTime)
        setReferralSource(onboardingDraft.referralSource || 'self')
        setCohortTag(onboardingDraft.cohortTag || '')
        setOrganizationTag(onboardingDraft.organizationTag || '')
        setRecommendation(null)
        setError(onboardingResumeError)

        const restoredPath = `${location.pathname}${location.search}`
        navigate(restoredPath, { replace: true })

        let cancelled = false

        async function restoreRecommendation() {
            setLoadingRecommendation(true)

            try {
                const result = await getOnboardingRecommendation({
                    primaryGoal: nextGoal,
                    confidenceBefore: nextConfidence,
                    weeklyTime: nextWeeklyTime,
                })

                if (!cancelled) {
                    setRecommendation(result)
                }
            } catch (err) {
                if (!cancelled && !onboardingResumeError) {
                    setError(err.message || 'We could not restore your saved recommendation right now.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingRecommendation(false)
                }
            }
        }

        restoreRecommendation()

        return () => {
            cancelled = true
        }
    }, [location.pathname, location.search, navigate, onboardingDraft, onboardingResumeError])

    useEffect(() => {
        if (!resumeDiagnosticTrack) return

        setDiagnosticTrack(resumeDiagnosticTrack)

        const restoredPath = `${location.pathname}${location.search}`
        navigate(restoredPath, { replace: true })
    }, [location.pathname, location.search, navigate, resumeDiagnosticTrack])

    useEffect(() => {
        async function fetchStatus() {
            if (!user) {
                try {
                    await checkHealth()
                } catch {
                    // Anonymous recommendation can still proceed if the health probe fails temporarily.
                } finally {
                    setSavedOnboarding(null)
                    setStatusLoading(false)
                }

                return
            }

            try {
                const data = await getOnboardingStatus()
                setSavedOnboarding(data.onboarding)

                if (data.onboarding) {
                    setGoal(data.onboarding.primaryGoal || 'digital-confidence')
                    setConfidenceBefore(data.onboarding.confidenceBefore || 3)
                    setWeeklyTime(data.onboarding.weeklyTime || 'steady')
                    setReferralSource(data.onboarding.referralSource || 'self')
                    setCohortTag(data.onboarding.cohortTag || '')
                    setOrganizationTag(data.onboarding.organizationTag || '')
                }
            } catch {
                setSavedOnboarding(user?.onboarding || null)
            } finally {
                setStatusLoading(false)
            }
        }

        fetchStatus()
    }, [user?.id, user?.onboarding])

    const handleRecommend = async () => {
        setError('')
        setLoadingRecommendation(true)

        try {
            if (!user) {
                await checkHealth()
            }

            const result = await getOnboardingRecommendation({
                primaryGoal: goal,
                confidenceBefore,
                weeklyTime,
            })
            setRecommendation(result)
        } catch (err) {
            setError(err.message || 'We could not generate a recommendation right now.')
        } finally {
            setLoadingRecommendation(false)
        }
    }

    const persistChoice = async (pathway, nextStepChoice) => {
        if (!recommendation?.recommendedPathway && !pathway) return

        if (!user) {
            navigate('/signup', {
                state: {
                    from: { pathname: '/start' },
                    onboardingDraft: {
                        primaryGoal: goal,
                        confidenceBefore,
                        weeklyTime,
                        referralSource,
                        cohortTag,
                        organizationTag,
                        selectedTrackSlug: pathway.slug,
                        recommendedTrackSlug: recommendation?.recommendedPathway?.slug || pathway.slug,
                        nextStepChoice,
                    },
                },
            })
            return
        }

        setSavingChoice(`${pathway.slug}:${nextStepChoice}`)
        setError('')

        try {
            const result = await completeOnboarding({
                primaryGoal: goal,
                confidenceBefore,
                weeklyTime,
                recommendedTrackSlug: recommendation?.recommendedPathway?.slug || pathway.slug,
                selectedTrackSlug: pathway.slug,
                referralSource,
                cohortTag,
                organizationTag,
                nextStepChoice,
            })

            setSavedOnboarding(result.onboarding)
            await checkAuth()

            if (nextStepChoice === 'start-diagnostic') {
                setDiagnosticTrack({ slug: pathway.slug, title: pathway.title })
            } else {
                navigate(`/track/${pathway.slug}`)
            }
        } catch (err) {
            setError(err.message || 'We could not save this starting route right now.')
        } finally {
            setSavingChoice('')
        }
    }

    const handleDiagnosticComplete = async () => {
        await checkAuth()
        navigate(`/track/${diagnosticTrack.slug}`)
    }

    const selectedGoal = GOAL_OPTIONS.find((option) => option.key === goal)
    const isAuthenticated = Boolean(user)

    return (
        <div className="py-12">
            <DiagnosticModal
                trackSlug={diagnosticTrack?.slug}
                trackTitle={diagnosticTrack?.title}
                isOpen={!!diagnosticTrack}
                onClose={() => setDiagnosticTrack(null)}
                onComplete={handleDiagnosticComplete}
            />

            <div className="container-app max-w-6xl">
                <section className="marketing-shell mb-8 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
                        <div>
                            <span className="section-eyebrow">
                                <Target className="h-3.5 w-3.5" />
                                Find your starting point
                            </span>
                            <h1 className="mt-4 text-3xl font-bold text-dark-50 sm:text-4xl lg:text-5xl">Start with the route that fits you now, not the biggest catalogue item.</h1>
                            <p className="mt-4 max-w-3xl text-lg leading-8 text-dark-300">
                                Answer three short questions and AdultEdu will recommend a pathway, save your starting point, and help you begin with a clearer first step.
                            </p>
                        </div>

                        <div className="editorial-panel p-6 lg:p-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">Why this exists</p>
                            <div className="mt-5 space-y-3 text-sm text-dark-300">
                                <div className="editorial-subpanel p-4">
                                    <p className="font-semibold text-dark-100">Lower-friction starts</p>
                                    <p className="mt-1 text-dark-400">New learners should be guided into a practical route, not left to decode the catalogue alone.</p>
                                </div>
                                <div className="editorial-subpanel p-4">
                                    <p className="font-semibold text-dark-100">Baseline capture</p>
                                    <p className="mt-1 text-dark-400">AdultEdu records your starting confidence, chosen route, and next step so progress has a clear beginning.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {savedOnboarding?.selectedTrack && (
                    <div className="progress-panel mb-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Saved starting point</p>
                                <h2 className="mt-2 text-2xl font-semibold text-dark-50">{savedOnboarding.selectedTrack.title}</h2>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-dark-300">
                                    {savedOnboarding.goalLabel ? `${savedOnboarding.goalLabel}. ` : ''}
                                    {savedOnboarding.currentStartingPoint?.description}
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link to={`/track/${savedOnboarding.selectedTrack.slug}`} className="btn-secondary">
                                    Open saved pathway
                                </Link>
                                <button type="button" onClick={handleRecommend} className="btn-ghost">
                                    Refresh recommendation
                                </button>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                <p className="learning-stat-label">Confidence before start</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{savedOnboarding.confidenceBefore || 'Not set'}</p>
                            </div>
                            <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                <p className="learning-stat-label">Weekly time</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{savedOnboarding.weeklyTimeLabel || 'Not set'}</p>
                            </div>
                            <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                <p className="learning-stat-label">Starting level</p>
                                <p className="mt-2 text-xl font-semibold text-dark-50">{savedOnboarding.recommendedLevel?.title || 'Not set yet'}</p>
                            </div>
                        </div>

                        {(savedOnboarding.organizationTag || savedOnboarding.cohortTag || savedOnboarding.referralSource) && (
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                    <p className="learning-stat-label">Organisation tag</p>
                                    <p className="mt-2 text-sm font-medium text-dark-100">{savedOnboarding.organizationTag || 'Not set'}</p>
                                </div>
                                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                    <p className="learning-stat-label">Cohort tag</p>
                                    <p className="mt-2 text-sm font-medium text-dark-100">{savedOnboarding.cohortTag || 'Not set'}</p>
                                </div>
                                <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4">
                                    <p className="learning-stat-label">Referral source</p>
                                    <p className="mt-2 text-sm font-medium text-dark-100">{REFERRAL_OPTIONS.find((option) => option.key === savedOnboarding.referralSource)?.label || savedOnboarding.referralSource || 'Not set'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <div className="space-y-6">
                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">1. Pick your goal</p>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {GOAL_OPTIONS.map((option) => (
                                    <ChoiceCard
                                        key={option.key}
                                        active={goal === option.key}
                                        icon={option.icon}
                                        title={option.title}
                                        description={option.description}
                                        onClick={() => setGoal(option.key)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">2. Set your confidence</p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                {CONFIDENCE_OPTIONS.map((option) => (
                                    <ConfidenceCard
                                        key={option.value}
                                        active={confidenceBefore === option.value}
                                        option={option}
                                        onClick={() => setConfidenceBefore(option.value)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">3. Choose your weekly study rhythm</p>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {WEEKLY_TIME_OPTIONS.map((option) => (
                                    <TimeCard
                                        key={option.key}
                                        active={weeklyTime === option.key}
                                        option={option}
                                        onClick={() => setWeeklyTime(option.key)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-300">4. Add partner intake details if relevant</p>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Referral source</span>
                                    <select
                                        value={referralSource}
                                        onChange={(event) => setReferralSource(event.target.value)}
                                        className="input"
                                    >
                                        {REFERRAL_OPTIONS.map((option) => (
                                            <option key={option.key} value={option.key}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Organisation tag</span>
                                    <span className="relative block">
                                        <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
                                        <input
                                            type="text"
                                            value={organizationTag}
                                            onChange={(event) => setOrganizationTag(event.target.value)}
                                            placeholder="Ealing libraries, local charity, provider name"
                                            className="w-full rounded-2xl border border-dark-700 bg-dark-900/80 py-3 pl-11 pr-4 text-sm text-dark-100 outline-none transition-all placeholder:text-dark-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </span>
                                </label>
                            </div>

                            <label className="mt-4 block">
                                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Cohort tag</span>
                                <input
                                    type="text"
                                    value={cohortTag}
                                    onChange={(event) => setCohortTag(event.target.value)}
                                    placeholder="Spring 2026, Ealing cohort A, library pilot"
                                    className="w-full rounded-2xl border border-dark-700 bg-dark-900/80 px-4 py-3 text-sm text-dark-100 outline-none transition-all placeholder:text-dark-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                />
                            </label>

                            <p className="mt-3 text-sm leading-7 text-dark-400">These details stay lightweight on purpose. They make partner delivery and evidence exports discussable without turning this into a heavy admin intake system.</p>
                        </div>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Your intake summary</p>
                            <div className="mt-4 space-y-4 text-sm text-dark-300">
                                <div>
                                    <p className="font-semibold text-dark-100">Goal</p>
                                    <p className="mt-1 text-dark-400">{selectedGoal?.title}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-dark-100">Confidence right now</p>
                                    <p className="mt-1 text-dark-400">{CONFIDENCE_OPTIONS.find((option) => option.value === confidenceBefore)?.label}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-dark-100">Weekly time</p>
                                    <p className="mt-1 text-dark-400">{WEEKLY_TIME_OPTIONS.find((option) => option.key === weeklyTime)?.label}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleRecommend}
                                disabled={loadingRecommendation}
                                className="btn-primary mt-6 w-full justify-center disabled:opacity-50"
                            >
                                {loadingRecommendation ? 'Finding your route...' : 'Get my recommendation'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="progress-panel">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Product principle</p>
                            <div className="mt-4 flex items-start gap-3">
                                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" />
                                <p className="text-sm leading-7 text-dark-300">Every recommendation should make the first step clearer, calmer, and more practical for the learner.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                {error}
                            </div>
                        )}
                    </aside>
                </div>

                {recommendation && (
                    <div className="mt-8 space-y-6">
                        <div className="mb-2">
                            <span className="section-eyebrow">
                                <Compass className="h-3.5 w-3.5" />
                                Recommended route
                            </span>
                            <h2 className="mt-4 text-3xl font-semibold text-dark-50">{recommendation.message}</h2>
                            <p className="mt-3 max-w-3xl text-base leading-8 text-dark-300">
                                This recommendation does not lock you in. It is meant to reduce the friction of choosing a sensible first step.
                            </p>
                        </div>

                        <PathwayCard
                            pathway={recommendation.recommendedPathway}
                            featured
                            current={savedOnboarding?.selectedTrack?.slug === recommendation.recommendedPathway.slug}
                            onChoose={() => persistChoice(recommendation.recommendedPathway, 'open-pathway')}
                            onDiagnostic={() => persistChoice(recommendation.recommendedPathway, 'start-diagnostic')}
                        />

                        {!isAuthenticated && (
                            <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-4 text-sm text-dark-200">
                                Create a free account when you are ready to save a recommended route, record your starting point, or run the guided level check.
                            </div>
                        )}

                        {recommendation.alternativePathways?.length > 0 && (
                            <div>
                                <h3 className="text-xl font-semibold text-dark-50">Other sensible options</h3>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-dark-400">If the first suggestion is not quite right, these routes still fit the goal and starting point you described.</p>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                    {recommendation.alternativePathways.map((pathway) => (
                                        <PathwayCard
                                            key={pathway.slug}
                                            pathway={pathway}
                                            current={savedOnboarding?.selectedTrack?.slug === pathway.slug}
                                            onChoose={() => persistChoice(pathway, 'open-pathway')}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {statusLoading && (
                    <div className="mt-8 grid gap-4 lg:grid-cols-2">
                        <div className="skeleton h-48 rounded-[1.75rem]" />
                        <div className="skeleton h-48 rounded-[1.75rem]" />
                    </div>
                )}
            </div>
        </div>
    )
}
