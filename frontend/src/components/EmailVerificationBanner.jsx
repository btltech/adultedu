import { useState } from 'react'
import toast from 'react-hot-toast'
import { MailWarning, RefreshCcw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function EmailVerificationBanner() {
    const { isAuthenticated, user, resendVerification } = useAuth()
    const [sending, setSending] = useState(false)

    if (!isAuthenticated || !user || user.emailVerified) {
        return null
    }

    const handleResend = async () => {
        setSending(true)

        const result = await resendVerification()

        if (result.success) {
            toast.success(result.message || 'Verification email sent')
        } else {
            toast.error(result.error || 'Could not resend verification email')
        }

        setSending(false)
    }

    return (
        <div className="border-b border-amber-500/20 bg-amber-500/10">
            <div className="container-app flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-amber-500/15 p-2 text-amber-300">
                        <MailWarning className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-200">Verify your email to secure your account</p>
                        <p className="text-sm text-dark-300">
                            {user.email} is not verified yet. You can keep learning now, but password recovery and reminder emails work better once you confirm the inbox.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={sending}
                    className="btn-secondary shrink-0 justify-center border-amber-400/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {sending ? (
                        'Sending...'
                    ) : (
                        <span className="inline-flex items-center gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Resend verification
                        </span>
                    )}
                </button>
            </div>
        </div>
    )
}