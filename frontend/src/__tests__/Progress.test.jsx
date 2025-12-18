import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'user-1', email: 'user@example.com' }, loading: false })
}))

const mockApi = vi.hoisted(() => vi.fn())
const mockGetProgressDetail = vi.hoisted(() => vi.fn())

vi.mock('../lib/api', () => ({
    api: mockApi,
    getProgressDetail: mockGetProgressDetail,
    default: {}
}))

import Progress from '../pages/Progress'

const mockEnrollments = [
    {
        id: 'enr-1',
        trackId: 'track-1',
        trackSlug: 'essential-digital-skills',
        trackTitle: 'Essential Digital Skills',
        currentLevel: 'E3',
        totalTopics: 2,
        completedTopics: 1
    }
]

const mockDetail = {
    track: { id: 'track-1', title: 'Essential Digital Skills', slug: 'essential-digital-skills' },
    overall: { totalQuestions: 4, correctCount: 4, percentage: 100, isMastered: true },
    topicsMastered: 2,
    topics: [
        { id: 'topic-1', title: 'Basics', totalQuestions: 2, correctCount: 2, percentage: 100, isMastered: true },
        { id: 'topic-2', title: 'Safety', totalQuestions: 2, correctCount: 2, percentage: 100, isMastered: true }
    ],
    certificate: {
        awarded: true,
        title: 'Essential Digital Skills Mastery'
    }
}

describe('Progress page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockApi.mockResolvedValue({ enrollments: mockEnrollments })
        mockGetProgressDetail.mockResolvedValue(mockDetail)
    })

    it('shows enrollments and per-topic detail on expand', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Progress />
            </MemoryRouter>
        )

        expect(await screen.findByText('Essential Digital Skills')).toBeInTheDocument()

        const detailsButton = screen.getByRole('button', { name: /view details/i })
        await user.click(detailsButton)

        expect(mockGetProgressDetail).toHaveBeenCalledWith('essential-digital-skills')
        expect(await screen.findByText('Track mastered')).toBeInTheDocument()
        expect(screen.getByText('Basics')).toBeInTheDocument()
        expect(screen.getByText('Safety')).toBeInTheDocument()
    })
})
