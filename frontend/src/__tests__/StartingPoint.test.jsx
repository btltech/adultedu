import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    checkHealth: vi.fn(),
    getOnboardingRecommendation: vi.fn(),
    getOnboardingStatus: vi.fn(),
    completeOnboarding: vi.fn(),
}))

vi.mock('../lib/api', () => mocks)
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: null, checkAuth: vi.fn() }),
}))
vi.mock('../components/diagnostic/DiagnosticModal', () => ({ default: () => null }))

import StartingPoint from '../pages/StartingPoint'

function LocationProbe() {
    const location = useLocation()
    return <div data-testid="location">{`${location.pathname}${location.hash}`}</div>
}

describe('StartingPoint recommendation', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.checkHealth.mockResolvedValue({ status: 'ok' })
        mocks.getOnboardingRecommendation.mockResolvedValue({
            message: 'AdultEdu recommends starting with Digital Confidence.',
            recommendedPathway: {
                id: 'track-1',
                slug: 'digital-confidence',
                title: 'Digital Confidence',
                description: 'A calm route into everyday digital tasks.',
                reasons: ['Matches your goal'],
                expectedStudyMinutes: 60,
                questionCount: 10,
            },
            alternativePathways: [],
        })
        window.HTMLElement.prototype.scrollIntoView = vi.fn()
    })

    it('reveals the recommendation when the learner requests it', async () => {
        const user = userEvent.setup()
        render(
            <MemoryRouter initialEntries={['/start']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <StartingPoint />
            </MemoryRouter>
        )

        await user.click(screen.getByRole('button', { name: /get my recommendation/i }))

        expect(await screen.findByRole('heading', { name: /recommends starting with digital confidence/i })).toBeInTheDocument()
        expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    })

    it('lets a guest open the recommended pathway without registering', async () => {
        const user = userEvent.setup()
        render(
            <MemoryRouter initialEntries={['/start']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/start" element={<StartingPoint />} />
                    <Route path="/track/:slug" element={<LocationProbe />} />
                </Routes>
            </MemoryRouter>
        )

        await user.click(screen.getByRole('button', { name: /get my recommendation/i }))
        await user.click(await screen.findByRole('button', { name: /use this pathway/i }))

        expect(screen.getByTestId('location')).toHaveTextContent('/track/digital-confidence#topic-outline')
    })
})
