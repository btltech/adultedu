import { useEffect, useState } from 'react'
import { Building2, ClipboardCheck, Download, Route, Search, TrendingUp, Users } from 'lucide-react'
import { getPartnerExportUrl, getPartnerOverview } from '../../lib/api'

function formatLabel(value) {
    return String(value || '')
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')
}

function formatDate(value) {
    if (!value) return 'Not updated yet'

    try {
        return new Date(value).toLocaleDateString()
    } catch {
        return 'Not updated yet'
    }
}

function SummaryCard({ title, value, detail, icon: Icon }) {
    return (
        <div className="solid-card p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">{title}</p>
                    <p className="mt-3 text-3xl font-semibold text-dark-50">{value}</p>
                    <p className="mt-2 text-sm text-dark-400">{detail}</p>
                </div>
                <div className="rounded-2xl border border-dark-700 bg-dark-900/80 p-3 text-primary-300">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

export default function PartnerDelivery() {
    const [overview, setOverview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [organizationTag, setOrganizationTag] = useState('')
    const [cohortTag, setCohortTag] = useState('')
    const [referralSource, setReferralSource] = useState('')

    useEffect(() => {
        const timeout = setTimeout(async () => {
            setLoading(true)
            setError('')

            try {
                const data = await getPartnerOverview({
                    search,
                    organizationTag,
                    cohortTag,
                    referralSource,
                })
                setOverview(data)
            } catch (err) {
                setError(err.message || 'Unable to load partner delivery data right now.')
            } finally {
                setLoading(false)
            }
        }, 250)

        return () => clearTimeout(timeout)
    }, [search, organizationTag, cohortTag, referralSource])

    const handleExport = async () => {
        setExporting(true)
        setError('')

        try {
            const response = await fetch(getPartnerExportUrl({
                search,
                organizationTag,
                cohortTag,
                referralSource,
            }), {
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error(`Export failed with status ${response.status}`)
            }

            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = 'adultedu-partner-evidence.csv'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(blobUrl)
        } catch (err) {
            setError(err.message || 'Unable to export partner evidence right now.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-400">
                        Partner Delivery
                    </h1>
                    <p className="mt-2 max-w-3xl text-dark-400">
                        Lightweight evidence built from onboarding baseline, pathway completion, and saved next-step choices. This is intended to make partner delivery discussable without turning the platform into a heavy case-management system.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-primary flex items-center gap-2 self-start lg:self-auto disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting CSV...' : 'Export evidence CSV'}
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    title="Learners in view"
                    value={overview?.summary.learners ?? 0}
                    detail="Current filtered learner count"
                    icon={Users}
                />
                <SummaryCard
                    title="Tagged for partner mode"
                    value={overview?.summary.partnerTagged ?? 0}
                    detail="Referral, cohort, or organisation tag present"
                    icon={Building2}
                />
                <SummaryCard
                    title="Pathways completed"
                    value={overview?.summary.pathwayCompleted ?? 0}
                    detail="Certificate or strong completion signal reached"
                    icon={Route}
                />
                <SummaryCard
                    title="Outcomes recorded"
                    value={overview?.summary.outcomeRecorded ?? 0}
                    detail="Confidence-after and next-step choice saved"
                    icon={ClipboardCheck}
                />
                <SummaryCard
                    title="Average confidence change"
                    value={overview?.summary.avgConfidenceChange ?? '—'}
                    detail="From onboarding baseline to saved outcome"
                    icon={TrendingUp}
                />
            </div>

            <div className="solid-card p-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(180px,0.6fr))]">
                    <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Search learner or pathway</span>
                        <span className="relative block">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Email, route, organisation, cohort"
                                className="input pl-11"
                            />
                        </span>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Organisation tag</span>
                        <select value={organizationTag} onChange={(event) => setOrganizationTag(event.target.value)} className="input">
                            <option value="">All organisations</option>
                            {overview?.availableFilters.organizationTags?.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Cohort tag</span>
                        <select value={cohortTag} onChange={(event) => setCohortTag(event.target.value)} className="input">
                            <option value="">All cohorts</option>
                            {overview?.availableFilters.cohortTags?.map((value) => (
                                <option key={value} value={value}>{value}</option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-dark-500">Referral source</span>
                        <select value={referralSource} onChange={(event) => setReferralSource(event.target.value)} className="input">
                            <option value="">All referral sources</option>
                            {overview?.availableFilters.referralSources?.map((value) => (
                                <option key={value} value={value}>{formatLabel(value)}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {error && (
                <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {error}
                </div>
            )}

            <div className="solid-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-dark-800/80 px-6 py-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-dark-50">
                            <ClipboardCheck className="h-4 w-4 text-accent-300" />
                            Learner evidence rows
                        </h2>
                        <p className="mt-1 text-sm text-dark-400">Each row combines intake, route progress, and declared next-step direction.</p>
                    </div>
                    <p className="text-sm text-dark-500">{overview?.learners?.length ?? 0} rows</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-dark-800/80 bg-dark-950/70 text-[11px] uppercase tracking-[0.14em] text-dark-500">
                            <tr>
                                <th className="px-6 py-4">Learner</th>
                                <th className="px-6 py-4">Pathway</th>
                                <th className="px-6 py-4">Tags</th>
                                <th className="px-6 py-4">Confidence</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Next step</th>
                                <th className="px-6 py-4">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-800/80 text-sm text-dark-300">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-dark-400">Loading partner delivery data...</td>
                                </tr>
                            ) : overview?.learners?.length ? (
                                overview.learners.map((row) => (
                                    <tr key={row.userId} className="align-top hover:bg-dark-900/35">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-dark-100">{row.displayName || row.email}</p>
                                            <p className="mt-1 text-xs text-dark-500">{row.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-dark-100">{row.selectedTrackTitle || 'No pathway chosen yet'}</p>
                                            <p className="mt-1 text-xs text-dark-500">{row.goalLabel || 'Guided learning'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {row.organizationTag && <span className="badge badge-neutral">{row.organizationTag}</span>}
                                                {row.cohortTag && <span className="badge badge-neutral">{row.cohortTag}</span>}
                                                {row.referralSource && <span className="badge badge-neutral">{formatLabel(row.referralSource)}</span>}
                                                {!row.organizationTag && !row.cohortTag && !row.referralSource && (
                                                    <span className="text-dark-500">No partner tags yet</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-dark-100">
                                                {row.baselineConfidence || '—'}
                                                <span className="mx-2 text-dark-600">→</span>
                                                {row.confidenceAfter || '—'}
                                            </p>
                                            <p className="mt-1 text-xs text-dark-500">
                                                {row.confidenceChange === '' ? 'Outcome not saved yet' : `Change ${Number(row.confidenceChange) > 0 ? '+' : ''}${row.confidenceChange}`}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-dark-100">{row.pathwayProgressPercent}%</p>
                                            <p className="mt-1 text-xs text-dark-500">{row.pathwayCompleted ? 'Completion signal reached' : 'Still in progress'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-dark-100">{row.nextStepChoice || 'Not recorded yet'}</p>
                                            <p className="mt-1 text-xs text-dark-500">{row.outcomeRecordedAt ? 'Outcome saved' : 'No completion reflection yet'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-dark-400">
                                            <p>{formatDate(row.outcomeRecordedAt || row.updatedAt || row.createdAt)}</p>
                                            <p className="mt-1 text-xs text-dark-500">Joined {formatDate(row.createdAt)}</p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-dark-400">No learners matched these filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}