import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

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

    if (loading) return <div className="p-8">Loading...</div>
    if (!user || user.role !== 'admin') return null

    const navItems = [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Content', path: '/admin/content' },
        { label: 'Analytics', path: '/admin/analytics' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Settings', path: '/admin/settings' },
    ]

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-dark-900 px-4 py-2 rounded shadow-lg font-bold">
                Skip to Content
            </a>
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-emerald-400">AdultEdu Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-2 rounded transition-colors ${location.pathname === item.path
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="text-sm text-slate-400 mb-2">{user.email}</div>
                    <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-800 rounded transition-colors"
                    >
                        Sign Out
                    </button>
                    <Link to="/" className="block mt-2 px-4 py-2 text-slate-400 hover:text-white text-sm">
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main id="admin-main-content" className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
