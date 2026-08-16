import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { checkAuth } = useAuth()

    const token = searchParams.get('token') || ''

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // If no token in URL, redirect to forgot-password
    useEffect(() => {
        if (!token) {
            navigate('/forgot-password', { replace: true })
        }
    }, [token, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            return setError('Password must be at least 8 characters')
        }
        if (password !== confirm) {
            return setError('Passwords do not match')
        }

        setLoading(true)

        try {
            await api('/auth/reset-password', {
                method: 'POST',
                body: { token, password },
            })
            // Backend logs the user in via session cookie; refresh auth state
            await checkAuth()
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
            setLoading(false)
        }
    }

    const passwordStrength = () => {
        if (password.length === 0) return null
        if (password.length < 8) return { label: 'Too short', color: 'text-red-400' }
        const checks = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/]
        const passed = checks.filter((r) => r.test(password)).length
        if (passed === 0) return { label: 'Weak', color: 'text-orange-400' }
        if (passed === 1) return { label: 'Fair', color: 'text-yellow-400' }
        return { label: 'Strong', color: 'text-green-400' }
    }

    const strength = passwordStrength()

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-slide-up">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                            AE
                        </div>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-50 mb-2">Set a new password</h1>
                    <p className="text-dark-400 text-sm">Choose a new password for your account.</p>
                </div>

                <div className="editorial-panel p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm leading-6 text-dark-300">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                <p>Choose a password you do not use elsewhere. You will be signed in after the reset succeeds.</p>
                            </div>
                        </div>
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}{' '}
                                {error.toLowerCase().includes('expired') && (
                                    <Link to="/forgot-password" className="underline hover:text-red-300">
                                        Request a new link
                                    </Link>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-2">
                                New password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pr-10"
                                    placeholder="At least 8 characters"
                                    required
                                    autoFocus
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
                            {strength && (
                                <p className={`text-xs mt-1.5 ${strength.color}`}>{strength.label}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirm" className="block text-sm font-medium text-dark-200 mb-2">
                                Confirm password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="input pr-10"
                                    placeholder="Repeat your new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute inset-y-0 right-3 flex items-center text-dark-500 hover:text-dark-300"
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirm.length > 0 && password !== confirm && (
                                <p className="text-xs mt-1.5 text-red-400">Passwords do not match</p>
                            )}
                            {confirm.length > 0 && password === confirm && password.length >= 8 && (
                                <p className="text-xs mt-1.5 text-green-400 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Passwords match
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                'Save new password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
