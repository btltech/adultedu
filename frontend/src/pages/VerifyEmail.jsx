import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, LoaderCircle, MailWarning } from 'lucide-react'
import { checkHealth, verifyEmail } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
    const [params] = useSearchParams()
    const [status, setStatus] = useState('loading')
    const [message, setMessage] = useState('We are confirming your email now.')
    const { checkAuth } = useAuth()
    const token = params.get('token')

    useEffect(() => {
        let active = true

        async function runVerification() {
            if (!token) {
                setStatus('error')
                setMessage('This verification link is missing the token. Please request a new one from your account banner.')
                return
            }

            setStatus('loading')

            try {
                await checkHealth()
                const result = await verifyEmail({ token })
                await checkAuth()

                if (!active) return

                setStatus('success')
                setMessage(result.message || 'Your email has been verified successfully.')
            } catch (error) {
                if (!active) return

                setStatus('error')
                setMessage(error.message || 'We could not verify that link. Please request a new one from your account banner.')
            }
        }

        runVerification()

        return () => {
            active = false
        }
    }, [checkAuth, token])

    return (
        <div className="py-16">
            <div className="container-app max-w-2xl">
                <div className="editorial-panel p-8 sm:p-10">
                    <div className="mb-6 inline-flex rounded-2xl border border-dark-700 bg-dark-900/70 p-3">
                        {status === 'loading' ? (
                            <LoaderCircle className="h-6 w-6 animate-spin text-primary-300" />
                        ) : status === 'success' ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        ) : (
                            <MailWarning className="h-6 w-6 text-amber-300" />
                        )}
                    </div>

                    <p className="section-eyebrow">Email verification</p>
                    <h1 className="mt-3 text-3xl font-bold text-dark-50">
                        {status === 'success' ? 'Your email is verified' : status === 'error' ? 'This verification link needs attention' : 'Verifying your email'}
                    </h1>
                    <p className="mt-4 text-base leading-8 text-dark-300">{message}</p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to="/start" className="btn-primary justify-center">
                            Go to your starting point
                        </Link>
                        <Link to="/dashboard" className="btn-secondary justify-center">
                            Open dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}