
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Header from '../components/Header'

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        isAuthenticated: false,
        logout: vi.fn(),
    })
}))

describe('Header Component', () => {
    it('renders the logo and brand name', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        )
        // Check for Logo text or image alt
        expect(screen.getByAltText(/AdultEdu/i)).toBeInTheDocument()
    })

    it('contains navigation links', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        )
        // Check for common links
        expect(screen.getByRole('link', { name: /Courses/i })).toBeInTheDocument()
    })
})
