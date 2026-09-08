import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
    current: { isAuthenticated: false, progressSync: { status: 'idle' }, syncProgress: vi.fn() },
}))
const getStorageStatus = vi.hoisted(() => vi.fn())

vi.mock('../context/AuthContext', () => ({ useAuth: () => authState.current }))
vi.mock('../lib/learnerProgress', () => ({
    localLearnerProgressStore: { getStorageStatus },
}))

import LearnerStorageStatus from '../components/LearnerStorageStatus'

describe('LearnerStorageStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.current = { isAuthenticated: false, progressSync: { status: 'idle' }, syncProgress: vi.fn() }
    })

    it('reassures a guest when IndexedDB is persistent and offers account protection', async () => {
        getStorageStatus.mockResolvedValue({ persistent: true, backend: 'indexeddb', lastSuccessfulBackupAt: null })
        render(<MemoryRouter initialEntries={['/lesson/lesson-1?from=track#example']}><LearnerStorageStatus /></MemoryRouter>)

        expect(await screen.findByText('Saved on this device')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /protect your progress/i })).toHaveAttribute('href', '/signup')
    })

    it('warns clearly when private browsing only permits temporary storage', async () => {
        getStorageStatus.mockResolvedValue({ persistent: false, backend: 'memory' })
        render(<MemoryRouter initialEntries={['/practice/topic-1']}><LearnerStorageStatus /></MemoryRouter>)

        expect(await screen.findByText('Progress is temporary in this browsing mode')).toBeInTheDocument()
        expect(screen.getByText(/export a backup before closing/i)).toBeInTheDocument()
    })

    it('stays out of the way on non-learning pages', () => {
        getStorageStatus.mockResolvedValue({ persistent: true, backend: 'indexeddb' })
        render(<MemoryRouter initialEntries={['/about']}><LearnerStorageStatus /></MemoryRouter>)

        expect(screen.queryByLabelText('Learning progress storage status')).not.toBeInTheDocument()
        expect(getStorageStatus).not.toHaveBeenCalled()
    })
})
