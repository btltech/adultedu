import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    login: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ login: mocks.login }),
}))

import Login from '../pages/Login'

function DestinationProbe() {
    const location = useLocation()
    return (
        <div>
            <span data-testid="destination">{`${location.pathname}${location.search}${location.hash}`}</span>
            <span data-testid="diagnostic-intent">{String(location.state?.openDiagnostic)}</span>
        </div>
    )
}

describe('authentication navigation', () => {
    it('returns to the exact protected deep link after login', async () => {
        mocks.login.mockResolvedValue({ success: true, user: { role: 'user', needsOnboarding: false } })
        const user = userEvent.setup()
        render(
            <MemoryRouter
                initialEntries={[{
                    pathname: '/login',
                    state: {
                        from: {
                            pathname: '/track/digital-confidence',
                            search: '?level=2',
                            hash: '#first-lesson',
                            state: { openDiagnostic: true },
                        },
                    },
                }]}
                future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/track/:slug" element={<DestinationProbe />} />
                </Routes>
            </MemoryRouter>
        )

        await user.type(screen.getByLabelText(/email address/i), 'learner@example.com')
        await user.type(screen.getByLabelText(/^password$/i), 'password123')
        await user.click(screen.getByRole('button', { name: /^log in$/i }))

        expect(await screen.findByTestId('destination')).toHaveTextContent('/track/digital-confidence?level=2#first-lesson')
        expect(screen.getByTestId('diagnostic-intent')).toHaveTextContent('true')
    })
})
