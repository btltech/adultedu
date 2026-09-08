import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { localLearnerProgressStore, syncLocalProgressToCloud } from '../lib/learnerProgress'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [authUnavailable, setAuthUnavailable] = useState(false)
    const [progressSync, setProgressSync] = useState({ status: 'idle', error: null })

    const syncProgress = useCallback(async () => {
        setProgressSync({ status: 'syncing', error: null })
        try {
            const result = await syncLocalProgressToCloud()
            setProgressSync({ status: 'synced', error: null })
            return { success: true, result }
        } catch (err) {
            // Authentication has still succeeded. Local progress remains the
            // source of truth and can be retried without data loss.
            console.error('Learner progress sync failed:', err)
            setProgressSync({ status: 'failed', error: err.message })
            return { success: false, error: err.message }
        }
    }, [])

    const checkAuth = useCallback(async () => {
        try {
            const data = await api('/auth/me')
            setUser(data.user)
            setAuthUnavailable(false)
            await syncProgress()
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
    }, [syncProgress])

    // Check auth status on mount.
    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    const signup = useCallback(async (email, password, displayName) => {
        setError(null)
        try {
            const data = await api('/auth/signup', {
                method: 'POST',
                body: { email, password, displayName },
            })
            setUser(data.user)
            setAuthUnavailable(false)
            const migration = await syncProgress()
            return { success: true, user: data.user, migration }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }, [syncProgress])

    const login = useCallback(async (email, password) => {
        setError(null)
        try {
            const data = await api('/auth/login', {
                method: 'POST',
                body: { email, password },
            })
            setUser(data.user)
            setAuthUnavailable(false)
            const migration = await syncProgress()
            return { success: true, user: data.user, migration }
        } catch (err) {
            setError(err.message)
            return { success: false, error: err.message }
        }
    }, [syncProgress])

    const logout = useCallback(async () => {
        const syncResult = await syncProgress()
        if (!syncResult.success) {
            setError('We could not safely sync this device, so you are still signed in. Your local progress has not been cleared.')
            return { success: false, error: syncResult.error }
        }

        try {
            // Once verified in the cloud, remove account-bound local state
            // before ending the session so a subsequent guest on a shared
            // device cannot see the previous learner's record.
            await localLearnerProgressStore.clearAccountBoundLearningData()
            await api('/auth/logout', { method: 'POST' })
            setUser(null)
            setAuthUnavailable(false)
            setProgressSync({ status: 'idle', error: null })
            return { success: true }
        } catch (err) {
            console.error('Logout error:', err)
            setError('We could not finish signing you out. Please try again.')
            return { success: false, error: err.message }
        }
    }, [syncProgress])

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
        progressSync,
        syncProgress,
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
