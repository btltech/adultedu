import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Redirect destination after login
    const from = location.state?.from?.pathname || '/'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)

        setLoading(false)

        if (result.success) {
            if (result.user?.role === 'admin') {
                navigate('/admin', { replace: true })
            } else if (result.user?.needsOnboarding && from === '/') {
                navigate('/start', { replace: true })
            } else {
                navigate(from, { replace: true })
            }
        } else {
            setError(result.error || 'Login failed')
        }
    }

    return (
        <div className="py-12 animate-fade-slide-up">
            <div className="container-app grid min-h-[72vh] max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.6fr)]">
                <section className="marketing-shell hidden px-8 py-10 lg:block">
                    <span className="section-eyebrow">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Secure learner access
                    </span>
                    <h1 className="mt-4 text-4xl font-bold text-dark-50">Return to the pathway you were building.</h1>
                    <p className="mt-4 max-w-xl text-base leading-8 text-dark-300">
                        Sign in to continue practice, review due cards, and keep your starting-point plan connected to real progress.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="learning-stat"><p className="learning-stat-label">Progress</p><p className="mt-2 text-sm text-dark-300">Saved across pathways</p></div>
                        <div className="learning-stat"><p className="learning-stat-label">Review</p><p className="mt-2 text-sm text-dark-300">Spaced recall queue</p></div>
                        <div className="learning-stat"><p className="learning-stat-label">Plan</p><p className="mt-2 text-sm text-dark-300">Starting route kept visible</p></div>
                    </div>
                </section>

                <div className="w-full max-w-md justify-self-center">
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                            AE
                        </div>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-50 mb-2">Welcome back</h1>
                    <p className="text-dark-400 text-sm">Log in to continue your pathway or find your starting point</p>
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
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-dark-200">
                                    Password
                                </label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs text-dark-400 hover:text-primary-300"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-dark-500 hover:text-dark-300"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
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
                                    Logging in...
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">Log in <ArrowRight className="h-4 w-4" /></span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-dark-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    )
}
