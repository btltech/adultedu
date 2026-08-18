import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [authUnavailable, setAuthUnavailable] = useState(false)

    // Check auth status on mount
    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = useCallback(async () => {
        try {
            const data = await api('/auth/me')
            setUser(data.user)
            setAuthUnavailable(false)
        } catch (err) {
            // A 401 means the learner is anonymous. A 5xx/network failure
            // means we do not know their session state, so preserve an
            // existing session and let protected routes offer a retry.
            if (err.status === 401 || err.status === 403) {
                setUser(null)
                setAuthUnavailable(false)
            } else {
                setAuthUnavailable(true)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const signup = useCallback(async (email, password, displayName) => {
        setError(null)
        try {
            const data = await api('/auth/signup', {
                method: 'POST',
                body: { email, password, displayName },
            })
            setUser(data.user)
            setAuthUnavailable(false)
            return { success: true, user: data.user }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }, [])

    const login = useCallback(async (email, password) => {
        setError(null)
        try {
            const data = await api('/auth/login', {
                method: 'POST',
                body: { email, password },
            })
            setUser(data.user)
            setAuthUnavailable(false)
            return { success: true, user: data.user }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await api('/auth/logout', { method: 'POST' })
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            setUser(null)
            setAuthUnavailable(false)
        }
    }, [])

    const resendVerification = useCallback(async () => {
        setError(null)
        try {
            const data = await api('/auth/resend-verification', { method: 'POST' })
            if (data.user) {
                setUser(data.user)
            }
            return { success: true, message: data.message, user: data.user || null }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }, [])

    const value = {
        user,
        loading,
        error,
        authUnavailable,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        needsOnboarding: !!user?.needsOnboarding,
        signup,
        login,
        logout,
        resendVerification,
        checkAuth,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
