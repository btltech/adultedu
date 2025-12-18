import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * A wrapper component that redirects unauthenticated users to the login page.
 * Use this to protect routes that require authentication.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    // Show loading while checking auth status
    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-dark-400">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading...</span>
                </div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}
