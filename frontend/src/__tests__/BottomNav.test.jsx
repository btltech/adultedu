import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: false }),
}))

import BottomNav from '../components/BottomNav'

function LoginProbe() {
    const location = useLocation()
    return <div data-testid="return-path">{location.state?.from?.pathname}</div>
}

describe('BottomNav', () => {
    it('keeps Learn active on lesson routes and preserves the page when opening login', async () => {
        const user = userEvent.setup()
        render(
            <MemoryRouter initialEntries={['/lesson/lesson-1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/lesson/:id" element={<BottomNav />} />
                    <Route path="/login" element={<LoginProbe />} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByRole('link', { name: /pathways/i })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('link', { name: /pathways/i })).toHaveAttribute('href', '/tracks#pathway-finder')
        await user.click(screen.getByRole('link', { name: /login/i }))
        expect(screen.getByTestId('return-path')).toHaveTextContent('/lesson/lesson-1')
    })
})
