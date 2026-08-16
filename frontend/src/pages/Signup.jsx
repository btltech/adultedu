import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, Compass, ShieldCheck } from 'lucide-react'
import { completeOnboarding } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { signup } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const onboardingDraft = location.state?.onboardingDraft || null
    const from = location.state?.from?.pathname || '/start'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)

        const result = await signup(email, password, displayName.trim() || undefined)

        if (result.success) {
            if (onboardingDraft?.primaryGoal && onboardingDraft?.selectedTrackSlug) {
                try {
                    const resumeResult = await completeOnboarding({
                        primaryGoal: onboardingDraft.primaryGoal,
                        confidenceBefore: onboardingDraft.confidenceBefore,
                        weeklyTime: onboardingDraft.weeklyTime,
                        recommendedTrackSlug: onboardingDraft.recommendedTrackSlug,
                        selectedTrackSlug: onboardingDraft.selectedTrackSlug,
                        referralSource: onboardingDraft.referralSource,
                        cohortTag: onboardingDraft.cohortTag,
                        organizationTag: onboardingDraft.organizationTag,
                        nextStepChoice: onboardingDraft.nextStepChoice,
                    })

                    const selectedTrack = resumeResult.onboarding?.selectedTrack

                    if (onboardingDraft.nextStepChoice === 'start-diagnostic') {
                        navigate('/start', {
                            replace: true,
                            state: {
                                resumeDiagnosticTrack: {
                                    slug: selectedTrack?.slug || onboardingDraft.selectedTrackSlug,
                                    title: selectedTrack?.title || 'Selected pathway',
                                },
                            },
                        })
                    } else {
                        navigate(`/track/${selectedTrack?.slug || onboardingDraft.selectedTrackSlug}`, { replace: true })
                    }

                    return
                } catch (resumeError) {
                    navigate('/start', {
                        replace: true,
                        state: {
                            onboardingDraft,
                            onboardingResumeError: resumeError.message || 'Your account was created, but we could not restore your pathway automatically.',
                        },
                    })
                    return
                }
            }

            navigate(from === '/login' || from === '/signup' ? '/start' : from, { replace: true })
        } else {
            setLoading(false)
            setError(result.error || 'Signup failed')
        }
    }

    return (
        <div className="py-12">
            <div className="container-app grid min-h-[72vh] max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.6fr)]">
                <section className="marketing-shell hidden px-8 py-10 lg:block">
                    <span className="section-eyebrow">
                        <Compass className="h-3.5 w-3.5" />
                        Start with direction
                    </span>
                    <h1 className="mt-4 text-4xl font-bold text-dark-50">Create an account, then choose a realistic first pathway.</h1>
                    <p className="mt-4 max-w-xl text-base leading-8 text-dark-300">
                        AdultEdu starts by asking what you need, how confident you feel, and how much time you have. The first route should feel manageable from day one.
                    </p>
                    <div className="mt-6 space-y-3">
                        <div className="editorial-subpanel p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-primary-300" /><p className="text-sm text-dark-300">Progress, review, and recommendations are saved to your account.</p></div></div>
                        <div className="editorial-subpanel p-4"><div className="flex gap-3"><BookOpenCheck className="mt-0.5 h-5 w-5 text-accent-300" /><p className="text-sm text-dark-300">You can change pathway later without losing your learning record.</p></div></div>
                    </div>
                </section>

                <div className="w-full max-w-md justify-self-center">
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                            AE
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-dark-50 mb-2">Create your account</h1>
                    <p className="text-dark-400">We will help you find the right starting route after sign-up.</p>
                </div>

                {/* Form */}
                <div className="editorial-panel p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium text-dark-200 mb-2">
                                What should we call you? <span className="text-dark-500 font-normal">(optional)</span>
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="input"
                                placeholder="Your name"
                                autoComplete="name"
                                maxLength={50}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-2">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="you@example.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                placeholder="At least 8 characters"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-200 mb-2">
                                Confirm password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">Create account and start <ArrowRight className="h-4 w-4" /></span>
                            )}
                        </button>

                        <p className="text-xs text-dark-500 text-center">
                            We will send a verification link straight away, but you can keep learning without waiting for it.
                        </p>

                        <p className="text-xs text-dark-500 text-center">
                            By signing up, you agree to our{' '}
                            <Link to="/terms" className="text-primary-400 hover:text-primary-300">Terms of Use</Link>
                            {' '}and{' '}
                            <Link to="/privacy-policy" className="text-primary-400 hover:text-primary-300">Privacy Policy</Link>.
                        </p>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-dark-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}
