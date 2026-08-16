import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock the AuthContext
vi.mock('../context/AuthContext', () => ({
    AuthProvider: ({ children }) => <div>{children}</div>,
    useAuth: () => ({ user: null, loading: false })
}))

// Mock API to prevent calls
vi.mock('../lib/api', () => ({
    checkHealth: vi.fn().mockResolvedValue({ status: 'ok' }),
    getTracks: vi.fn().mockResolvedValue([]),
}))

describe('App', () => {
    it('renders home hero copy', async () => {
        render(<App />)
        expect(await screen.findByRole('heading', { name: /learning that feels like a clear plan/i })).toBeInTheDocument()
    })
})
