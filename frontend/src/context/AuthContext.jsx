import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check auth status on mount
    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = useCallback(async () => {
        try {
            const data = await api('/auth/me')
            setUser(data.user)
        } catch (err) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const signup = useCallback(async (email, password) => {
        setError(null)
        try {
            const data = await api('/auth/signup', {
                method: 'POST',
                body: { email, password },
            })
            setUser(data.user)
            return { success: true }
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
        }
    }, [])

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        signup,
        login,
        logout,
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
