import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { BarChart2, Clock, Filter, TrendingDown, Users } from 'lucide-react'

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)
    const [eventStats, setEventStats] = useState(null)
    const [timeOnTask, setTimeOnTask] = useState(null)
    const [funnel, setFunnel] = useState(null)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const [eventsRes, timeRes, funnelRes] = await Promise.all([
                    api.get(`/admin/analytics/events?days=${days}`),
                    api.get(`/admin/analytics/time-on-task?days=${days}`),
                    api.get(`/admin/analytics/funnel?days=${days}`)
                ])
                setEventStats(eventsRes)
                setTimeOnTask(timeRes)
                setFunnel(funnelRes)
            } catch (err) {
                console.error('Failed to load analytics:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [days])

    if (loading) {
        return (
            <div className="animate-fade-in p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="solid-card p-6 animate-pulse">
                            <div className="h-8 bg-dark-700 rounded w-1/3 mb-4"></div>
                            <div className="h-24 bg-dark-700 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const maxFunnelCount = funnel?.funnel?.[0]?.count || 1

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart2 className="text-primary-400" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-dark-400 mt-1">User behavior and learning insights</p>
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-dark-400" />
                    <select
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                        className="bg-dark-800 border border-dark-600 text-dark-200 text-sm rounded-lg px-3 py-2"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Event Counts */}
                <div className="solid-card p-6">
                    <h3 className="text-sm font-medium text-dark-400 uppercase mb-4 flex items-center gap-2">
                        <Users size={16} /> Event Counts
                    </h3>
                    <div className="space-y-3">
                        {eventStats?.eventCounts?.slice(0, 5).map(e => (
                            <div key={e.eventType} className="flex justify-between items-center">
                                <span className="text-dark-300 text-sm">{e.eventType.replace(/_/g, ' ')}</span>
                                <span className="text-white font-medium">{e.count.toLocaleString()}</span>
                            </div>
                        ))}
                        {(!eventStats?.eventCounts || eventStats.eventCounts.length === 0) && (
                            <p className="text-dark-500 text-sm">No events tracked yet</p>
                        )}
                    </div>
                </div>

                {/* Time on Task */}
                <div className="solid-card p-6">
                    <h3 className="text-sm font-medium text-dark-400 uppercase mb-4 flex items-center gap-2">
                        <Clock size={16} /> Avg Time per Question Type
                    </h3>
                    <div className="space-y-3">
                        {timeOnTask?.timeByType?.map(t => (
                            <div key={t.type} className="flex justify-between items-center">
                                <span className="text-dark-300 text-sm capitalize">{t.type.replace(/_/g, ' ')}</span>
                                <div className="text-right">
                                    <span className="text-white font-medium">{t.avgSeconds}s</span>
                                    <span className="text-dark-500 text-xs ml-2">({t.attempts} attempts)</span>
                                </div>
                            </div>
                        ))}
                        {(!timeOnTask?.timeByType || timeOnTask.timeByType.length === 0) && (
                            <p className="text-dark-500 text-sm">No time data available</p>
                        )}
                    </div>
                </div>

                {/* Learning Funnel */}
                <div className="solid-card p-6">
                    <h3 className="text-sm font-medium text-dark-400 uppercase mb-4 flex items-center gap-2">
                        <TrendingDown size={16} /> Learning Funnel
                    </h3>
                    <div className="space-y-2">
                        {funnel?.funnel?.map((stage, i) => {
                            const prevCount = i === 0 ? stage.count : funnel.funnel[i - 1].count
                            const dropOff = prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : 0
                            const width = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0

                            return (
                                <div key={stage.stage}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-dark-300">{stage.stage}</span>
                                        <span className="text-white">{stage.count}</span>
                                    </div>
                                    <div className="h-6 bg-dark-700 rounded-lg overflow-hidden relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
                                            style={{ width: `${width}%` }}
                                        />
                                        {i > 0 && dropOff > 0 && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400">
                                                -{dropOff}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
