import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    api: vi.fn(),
    sync: vi.fn(),
    clearAccountBoundLearningData: vi.fn(),
}))

vi.mock('../lib/api', () => ({ api: mocks.api }))
vi.mock('../lib/learnerProgress', () => ({
    syncLocalProgressToCloud: mocks.sync,
    localLearnerProgressStore: {
        clearAccountBoundLearningData: mocks.clearAccountBoundLearningData,
    },
}))

import { AuthProvider, useAuth } from '../context/AuthContext'

function AuthProbe({ onChange }) {
    const auth = useAuth()
    useEffect(() => onChange(auth), [auth, onChange])
    return <span>{auth.user?.email || 'anonymous'}</span>
}

describe('safe logout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.sync.mockResolvedValue({ userId: 'user-1' })
        mocks.clearAccountBoundLearningData.mockResolvedValue(undefined)
        mocks.api.mockImplementation(async (path) => {
            if (path === '/auth/me') return { user: { id: 'user-1', email: 'learner@example.com' } }
            if (path === '/auth/logout') return { success: true }
            throw new Error(`Unexpected API call: ${path}`)
        })
    })

    it('does a verified final sync before removing local account data and ending the session', async () => {
        let currentAuth
        const captureAuth = (next) => { currentAuth = next }
        render(<AuthProvider><AuthProbe onChange={captureAuth} /></AuthProvider>)
        expect(await screen.findByText('learner@example.com')).toBeInTheDocument()
        await waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(1))

        let result
        await act(async () => { result = await currentAuth.logout() })

        expect(result).toEqual({ success: true })
        expect(mocks.sync).toHaveBeenCalledTimes(2)
        expect(mocks.clearAccountBoundLearningData).toHaveBeenCalledTimes(1)
        expect(mocks.api).toHaveBeenCalledWith('/auth/logout', { method: 'POST' })
        expect(mocks.sync.mock.invocationCallOrder[1]).toBeLessThan(mocks.clearAccountBoundLearningData.mock.invocationCallOrder[0])
        expect(mocks.clearAccountBoundLearningData.mock.invocationCallOrder[0]).toBeLessThan(mocks.api.mock.invocationCallOrder[1])
        expect(screen.getByText('anonymous')).toBeInTheDocument()
    })

    it('keeps the learner signed in and local data intact when the final sync fails', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
        let currentAuth
        const captureAuth = (next) => { currentAuth = next }
        render(<AuthProvider><AuthProbe onChange={captureAuth} /></AuthProvider>)
        expect(await screen.findByText('learner@example.com')).toBeInTheDocument()
        await waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(1))
        mocks.sync.mockRejectedValueOnce(new Error('network unavailable'))

        let result
        await act(async () => { result = await currentAuth.logout() })

        expect(result).toMatchObject({ success: false, error: 'network unavailable' })
        expect(mocks.clearAccountBoundLearningData).not.toHaveBeenCalled()
        expect(mocks.api.mock.calls.some(([path]) => path === '/auth/logout')).toBe(false)
        expect(screen.getByText('learner@example.com')).toBeInTheDocument()
        consoleError.mockRestore()
    })
})
