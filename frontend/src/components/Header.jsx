import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import StreakCounter from './gamification/StreakCounter'
import DisplayPreferences from './DisplayPreferences'

const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
)

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

export default function Header() {
    const { user, isAuthenticated, logout } = useAuth()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [displayOpen, setDisplayOpen] = useState(false)

    // Better active state detection for nested routes
    const isActive = (path) => {
        if (path === '/') return location.pathname === '/'
        if (path === '/tracks') return location.pathname === '/tracks' || location.pathname.startsWith('/track/')
        if (path === '/progress') return location.pathname === '/progress'
        if (path === '/start') return location.pathname === '/start'
        if (path === '/admin') return location.pathname.startsWith('/admin')
        return location.pathname === path
    }

    const navLinks = [
        { to: '/tracks', label: 'Pathways' },
    ]

    const authNavLinks = isAuthenticated ? [
        ...(user?.needsOnboarding ? [{ to: '/start', label: 'Start Here' }] : []),
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/progress', label: 'My Progress' },
        { to: '/review', label: 'Review' },
    ] : []

    const adminLink = isAuthenticated && user?.role === 'admin' ?
        { to: '/admin', label: 'Admin Panel', isAdmin: true } : null

    return (
        <header className="sticky top-0 z-40 backdrop-blur-md bg-dark-950/90 border-b border-dark-800/50">
            <div className="container-app">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    {/* logo.svg is a full lockup (mark + "AdultEdu" wordmark), so no
                        adjacent text label — it would render the name twice. */}
                    <Link to="/" className="flex items-center shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                        <img
                            src="/logo.svg"
                            alt="AdultEdu"
                            className="h-8 w-auto"
                        />
                    </Link>

                    {/* Nav — desktop */}
                    <nav className="hidden md:flex items-center gap-7 ml-10">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm font-medium transition-colors ${isActive(link.to) ? 'text-white' : 'text-dark-400 hover:text-dark-200'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {authNavLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm font-medium transition-colors ${isActive(link.to) ? 'text-white' : 'text-dark-400 hover:text-dark-200'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {adminLink && (
                            <Link
                                to={adminLink.to}
                                className={`text-sm font-medium transition-colors ${isActive('/admin') ? 'text-accent-400' : 'text-accent-500/70 hover:text-accent-400'
                                    }`}
                            >
                                {adminLink.label}
                            </Link>
                        )}
                    </nav>

                    {/* Utilities — right side */}
                    <div className="flex items-center gap-2 ml-auto">
                        {isAuthenticated ? (
                            <>
                                <div className="hidden md:block">
                                    <StreakCounter />
                                </div>
                                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-dark-800/50 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                                    <span className="text-dark-300 truncate max-w-[120px]">{user.displayName || user.email}</span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="hidden md:block text-sm font-medium text-dark-300 hover:text-dark-100 transition-colors px-2"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="hidden md:block text-sm font-medium text-dark-300 hover:text-dark-100 transition-colors px-2"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="hidden md:block btn-primary text-sm px-4 py-1.5"
                                >
                                    Start here
                                </Link>
                            </>
                        )}

                        {/* Accessibility / Display settings */}
                        <div className="relative hidden md:block">
                            <button
                                type="button"
                                onClick={() => setDisplayOpen(prev => !prev)}
                                aria-expanded={displayOpen}
                                aria-controls="display-preferences-panel"
                                aria-label="Display settings"
                                className="p-2 text-dark-500 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-800/50"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                            </button>
                            <DisplayPreferences
                                isOpen={displayOpen}
                                onClose={() => setDisplayOpen(false)}
                            />
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-dark-300 hover:text-dark-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-dark-800 py-4 space-y-2">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {authNavLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.to)
                                    ? 'bg-primary-500/20 text-primary-400'
                                    : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        {adminLink && (
                            <Link
                                to={adminLink.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin')
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'text-emerald-500/80 hover:bg-dark-800 hover:text-emerald-400'
                                    }`}
                            >
                                {adminLink.label}
                            </Link>
                        )}

                        {/* Mobile auth actions */}
                        <div className="border-t border-dark-800 pt-4 mt-4 space-y-2">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        logout()
                                        setMobileMenuOpen(false)
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
                                >
                                    Log out
                                </button>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-4 py-2 text-sm font-medium text-dark-300 hover:bg-dark-800 hover:text-dark-100 rounded-lg transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to="/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block mx-4 text-center btn-primary text-sm px-4 py-2"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
