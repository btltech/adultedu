import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import { BarChart3, BookOpenCheck, Building2, Home, LayoutDashboard, LogOut, Settings, Users } from 'lucide-react'

export default function AdminLayout() {
    const { user, logout, loading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login')
            } else if (user.role !== 'admin') {
                navigate('/')
            }
        }
    }, [user, loading, navigate])

    if (loading) return <div className="min-h-screen bg-dark-950 p-8 text-dark-300">Loading admin workspace...</div>
    if (!user || user.role !== 'admin') return null

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Content', path: '/admin/content', icon: BookOpenCheck },
        { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { label: 'Partners', path: '/admin/partners', icon: Building2 },
        { label: 'Users', path: '/admin/users', icon: Users },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-dark-950 text-dark-200 lg:flex">
            <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-dark-900 px-4 py-2 rounded shadow-lg font-bold">
                Skip to Content
            </a>
            <aside className="border-b border-dark-800/80 bg-dark-950/95 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
                <div className="border-b border-dark-800/80 p-5">
                    <Link to="/admin" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-300">
                            AE
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-dark-50">AdultEdu Admin</h1>
                            <p className="text-xs text-dark-500">Platform operations</p>
                        </div>
                    </Link>
                </div>

                <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:p-4">
                    {navItems.map(item => {
                        const Icon = item.icon
                        const active = location.pathname === item.path
                        return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${active
                                ? 'border border-primary-500/35 bg-primary-500/15 text-primary-200'
                                : 'text-dark-400 hover:bg-dark-900 hover:text-dark-100'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )})}
                </nav>

                <div className="hidden border-t border-dark-800/80 p-4 lg:block">
                    <div className="mb-3 rounded-2xl border border-dark-800 bg-dark-900/70 p-3 text-sm text-dark-400">{user.email}</div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                    <Link to="/" className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-dark-400 hover:text-dark-100">
                        <Home className="h-4 w-4" />
                        Back to app
                    </Link>
                </div>
            </aside>

            <main id="admin-main-content" className="min-w-0 flex-1 overflow-auto">
                <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
