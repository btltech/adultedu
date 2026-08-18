import { useState } from 'react'
import { Flag, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getUserMessage } from '../lib/api'

const REASONS = [
    ['incorrect_answer', 'The answer or explanation seems wrong'],
    ['unclear_question', 'The question is unclear'],
    ['typo_or_formatting', 'There is a typo or formatting problem'],
    ['out_of_date', 'The information may be out of date'],
    ['other', 'Something else'],
]

export default function QuestionReportButton({ question, context = {} }) {
    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState('incorrect_answer')
    const [details, setDetails] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const submit = async (event) => {
        event.preventDefault()
        setSending(true)
        try {
            const result = await api('/question-reports', {
                method: 'POST',
                body: { questionId: question.id, reason, details, context },
            })
            setSent(true)
            toast.success(result.alreadyReported ? 'You already reported this issue.' : 'Thanks — your report has been recorded.')
        } catch (error) {
            toast.error(getUserMessage(error, 'We could not send that report. Please try again.'))
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="mt-4">
            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 text-sm text-dark-500 transition-colors hover:text-dark-200"
                    aria-label="Report a problem with this question"
                >
                    <Flag className="h-4 w-4" />
                    Report a problem with this question
                </button>
            ) : (
                <div className="rounded-2xl border border-dark-700 bg-dark-900/80 p-4" role="region" aria-label="Report a question problem">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-medium text-dark-100">Something wrong with this question?</h3>
                            <p className="mt-1 text-sm text-dark-400">Tell us what you noticed. Your report helps us improve the question for everyone.</p>
                        </div>
                        <button type="button" onClick={() => setOpen(false)} className="text-dark-500 hover:text-dark-200" aria-label="Close report form">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {sent ? (
                        <div className="mt-4 rounded-xl border border-accent-500/30 bg-accent-500/10 p-3 text-sm text-accent-200">
                            Thanks. We have recorded the report and will check it.
                        </div>
                    ) : (
                        <form onSubmit={submit} className="mt-4 space-y-3">
                            <label className="block text-sm text-dark-300">
                                What is the problem?
                                <select value={reason} onChange={(event) => setReason(event.target.value)} className="input mt-2 w-full">
                                    {REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm text-dark-300">
                                Extra detail <span className="text-dark-500">(optional)</span>
                                <textarea
                                    value={details}
                                    onChange={(event) => setDetails(event.target.value.slice(0, 2000))}
                                    className="input mt-2 min-h-24 w-full resize-y"
                                    placeholder="For example: option B is also correct because..."
                                    maxLength={2000}
                                />
                            </label>
                            <button type="submit" disabled={sending} className="btn-secondary disabled:opacity-50">
                                <Send className="h-4 w-4" />
                                {sending ? 'Sending…' : 'Send report'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}
