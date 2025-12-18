
import { useEffect, useState } from 'react'
import {
    Users,
    BookOpen,
    Award,
    Activity,
    ArrowUpRight,
    Plus,
    Settings
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import api from '../../lib/api'
import { Link } from 'react-router-dom'

// Mock Data for Chart (replace with real API data if available later)
const MOCK_ACTIVITY_DATA = [
    { name: 'Mon', active: 12 },
    { name: 'Tue', active: 18 },
    { name: 'Wed', active: 15 },
    { name: 'Thu', active: 25 },
    { name: 'Fri', active: 20 },
    { name: 'Sat', active: 32 },
    { name: 'Sun', active: 28 },
]

export default function AdminDashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get('/admin/stats')
                setStats(data)
            } catch (err) {
                console.error('Failed to fetch stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-dark-400 font-medium">Loading Dashboard...</p>
            </div>
        </div>
    )

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-400">
                        Dashboard
                    </h1>
                    <p className="text-dark-400 mt-1">Overview of your platform's performance</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/settings"
                        className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
                        aria-label="Admin Settings"
                    >
                        <Settings size={18} aria-hidden="true" />
                        Settings
                    </Link>
                    <Link
                        to="/admin/questions/new"
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm shadow-lg shadow-primary-500/20"
                        aria-label="Create New Question"
                    >
                        <Plus size={18} aria-hidden="true" />
                        New Question
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Learners"
                    value={stats?.users || 0}
                    icon={Users}
                    trend="+12%"
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    borderColor="border-blue-500"
                    idx={0}
                />
                <StatCard
                    label="Questions"
                    value={stats?.questions || 0}
                    icon={BookOpen}
                    trend="+5%"
                    color="text-purple-400"
                    bg="bg-purple-500/10"
                    borderColor="border-purple-500"
                    idx={1}
                />
                <StatCard
                    label="Active Tracks"
                    value={stats?.liveTracks || 0}
                    icon={Activity}
                    trend="Stable"
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    borderColor="border-emerald-500"
                    idx={2}
                />
                <StatCard
                    label="Enrollments"
                    value={stats?.enrollments || 0}
                    icon={Award}
                    trend="+8%"
                    color="text-amber-400"
                    bg="bg-amber-500/10"
                    borderColor="border-amber-500"
                    idx={3}
                />
            </div>

            {/* Chart Section */}
            <div className="solid-card p-6 md:p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-semibold text-white">Learner Activity</h2>
                    <select className="bg-dark-800 border-dark-700 text-dark-300 text-sm rounded-lg px-3 py-1 outline-none">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                    </select>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_ACTIVITY_DATA}>
                            <defs>
                                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="active"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorActive)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value, icon: Icon, trend, color, bg, idx, borderColor }) {
    return (
        <div
            className={`solid-card p-6 relative overflow-hidden group hover:border-dark-500 transition-all duration-300 animate-slide-up border-t-4 ${borderColor}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
        >
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-dark-300 text-sm font-medium mb-1">{label}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <span className="text-emerald-400 text-xs font-medium flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ArrowUpRight size={12} className="mr-1" />
                    {trend}
                </span>
                <span className="text-dark-400 text-xs">vs last week</span>
            </div>

            {/* Background Decoration - reduced opacity */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} blur-2xl opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />
        </div>
    )
}
