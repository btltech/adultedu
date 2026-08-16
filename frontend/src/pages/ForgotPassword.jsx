import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await api('/auth/forgot-password', {
                method: 'POST',
                body: { email: email.trim().toLowerCase() },
            })
            setSubmitted(true)
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-50 mb-2">
                        {submitted ? 'Check your email' : 'Forgot your password?'}
                    </h1>
                    <p className="text-dark-400 text-sm">
                        {submitted
                            ? `If an account exists for ${email}, we've sent a reset link. It expires in 1 hour.`
                            : "Enter your email address and we'll send you a link to reset your password."}
                    </p>
                </div>

                <div className="editorial-panel p-8">
                    {submitted ? (
                        <div className="space-y-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mx-auto">
                                <Mail className="h-6 w-6 text-primary-400" />
                            </div>
                            <p className="text-dark-300 text-sm leading-relaxed">
                                Didn't receive it? Check your spam folder, or{' '}
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-primary-400 hover:text-primary-300 underline"
                                >
                                    try again
                                </button>
                                .
                            </p>
                            <Link to="/login" className="btn-secondary w-full justify-center flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="rounded-2xl border border-dark-800/80 bg-dark-900/60 p-4 text-sm leading-6 text-dark-300">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                                    <p>We will send a reset link if the email matches an AdultEdu account.</p>
                                </div>
                            </div>
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
                                        Sending...
                                    </span>
                                ) : (
                                    'Send reset link'
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <Link to="/login" className="text-sm text-dark-400 hover:text-dark-200 inline-flex items-center gap-1">
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Back to login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
