import { useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Flag, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const STATUS_OPTIONS = ['open', 'acknowledged', 'fixed', 'dismissed']
const REASON_LABELS = {
    incorrect_answer: 'Answer or explanation may be wrong',
    unclear_question: 'Question is unclear',
    typo_or_formatting: 'Typo or formatting',
    out_of_date: 'May be out of date',
    other: 'Other',
}

export default function QuestionReports() {
    const [reports, setReports] = useState([])
    const [status, setStatus] = useState('open')
    const [page, setPage] = useState(1)
    const [pages, setPages] = useState(1)
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const data = await api.get(`/admin/question-reports?status=${status}&page=${page}&limit=50`)
            setReports(data.reports || [])
            setPages(Math.max(1, data.pagination?.pages || 1))
        } catch {
            toast.error('Could not load question reports')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [status, page])

    const changeStatus = (nextStatus) => {
        setStatus(nextStatus)
        setPage(1)
    }

    const update = async (id, nextStatus) => {
        try {
            await api.put(`/admin/question-reports/${id}`, { body: { status: nextStatus } })
            setReports((current) => current.filter((report) => report.id !== id))
            toast.success(`Report marked ${nextStatus}`)
        } catch {
            toast.error('Could not update report')
        }
    }

    return (
        <div>
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-300">Learner feedback</p>
                    <h1 className="mt-2 text-3xl font-bold text-dark-50">Question reports</h1>
                    <p className="mt-2 max-w-2xl text-dark-400">Review issues learners flag and record what happened. Automatic quarantine is only used when explicitly enabled and its safety threshold is met.</p>
                </div>
                <button type="button" onClick={load} className="btn-secondary"><RefreshCw className="h-4 w-4" /> Refresh</button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                    <button key={option} type="button" onClick={() => changeStatus(option)} className={`rounded-xl px-4 py-2 text-sm font-medium ${status === option ? 'bg-primary-500/20 text-primary-200' : 'bg-dark-900 text-dark-400 hover:text-dark-100'}`}>
                        {option[0].toUpperCase() + option.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? <div className="progress-panel p-8 text-dark-400">Loading reports…</div> : reports.length === 0 ? (
                <div className="progress-panel p-10 text-center"><Flag className="mx-auto h-8 w-8 text-dark-500" /><p className="mt-3 text-dark-300">No {status} reports.</p></div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <article key={report.id} className="progress-panel p-5">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-dark-500">
                                        <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-200">{REASON_LABELS[report.reason] || report.reason}</span>
                                        <span>{new Date(report.createdAt).toLocaleString()}</span>
                                        {report.question?.topic?.track && <span>{report.question.topic.track.title} · {report.question.topic.title}</span>}
                                    </div>
                                    <p className="mt-4 text-lg leading-7 text-dark-100">{report.question?.prompt || 'Question no longer exists'}</p>
                                    {report.details && <p className="mt-3 rounded-xl bg-dark-900/70 p-3 text-sm leading-6 text-dark-300">“{report.details}”</p>}
                                    {report.user?.email && <p className="mt-3 text-xs text-dark-500">Reported by {report.user.email}</p>}
                                </div>
                                <div className="flex shrink-0 gap-2 sm:self-start">
                                    {status === 'open' && <button type="button" onClick={() => update(report.id, 'acknowledged')} className="btn-secondary px-3 py-2 text-sm"><Check className="h-4 w-4" /> Acknowledge</button>}
                                    <button type="button" onClick={() => update(report.id, 'fixed')} className="btn-primary px-3 py-2 text-sm"><Check className="h-4 w-4" /> Fixed</button>
                                    <button type="button" onClick={() => update(report.id, 'dismissed')} className="btn-secondary px-3 py-2 text-sm"><X className="h-4 w-4" /> Dismiss</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {pages > 1 && (
                <nav className="mt-6 flex items-center justify-between" aria-label="Question report pages">
                    <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40">
                        <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <span className="text-sm text-dark-400">Page {page} of {pages}</span>
                    <button type="button" onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={page === pages} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40">
                        Next <ChevronRight className="h-4 w-4" />
                    </button>
                </nav>
            )}
        </div>
    )
}
