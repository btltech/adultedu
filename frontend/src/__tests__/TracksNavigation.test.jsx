import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getTracks: vi.fn(),
}))

vi.mock('../lib/api', () => ({ getTracks: mocks.getTracks }))

import Tracks from '../pages/Tracks'

function SearchProbe() {
    const location = useLocation()
    return <div data-testid="search-params">{location.search}</div>
}

describe('pathway catalogue navigation', () => {
    it('stores filters in the URL so refresh and back navigation preserve them', async () => {
        mocks.getTracks.mockResolvedValue([{
            id: 'track-1',
            slug: 'digital-confidence',
            title: 'Digital Confidence',
            description: 'Everyday digital skills.',
            category: 'tech',
            framework: 'EDS',
            frameworks: [{ slug: 'eds', title: 'Essential Digital Skills' }],
            topics: [],
            isLive: true,
            estimatedMinutes: 30,
            expectedStudyMinutes: 60,
            expectedStudyBand: 'short',
            questionCount: 5,
        }])
        const user = userEvent.setup()

        render(
            <MemoryRouter initialEntries={['/tracks']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/tracks" element={<><Tracks /><SearchProbe /></>} />
                </Routes>
            </MemoryRouter>
        )

        await screen.findByRole('heading', { name: 'Digital Confidence' })
        await user.click(screen.getByRole('button', { name: 'Tech' }))

        await waitFor(() => expect(screen.getByTestId('search-params')).toHaveTextContent('?category=tech'))
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
    })

    it('treats legacy GCSE casing and category values as canonical filters', async () => {
        mocks.getTracks.mockResolvedValue([{
            id: 'legacy-gcse',
            slug: 'gcse-science',
            title: 'GCSE Science',
            description: 'Legacy taxonomy fixture.',
            category: 'qualifications',
            framework: 'gcse',
            frameworks: [{ slug: 'gcse', title: 'GCSE' }],
            topics: [],
            isLive: true,
            estimatedMinutes: 30,
            expectedStudyMinutes: 90,
            expectedStudyBand: 'short',
            questionCount: 10,
        }])

        render(
            <MemoryRouter initialEntries={['/tracks?category=qualifications&framework=gcse']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/tracks" element={<Tracks />} />
                </Routes>
            </MemoryRouter>
        )

        expect(await screen.findByRole('heading', { name: 'GCSE Science' })).toBeInTheDocument()
        expect(screen.getByRole('combobox', { name: /framework/i })).toHaveValue('GCSE')
        expect(screen.getByRole('button', { name: 'Qualification Prep' })).toHaveClass('bg-primary-500')
        expect(screen.queryByRole('button', { name: 'GCSE Subjects' })).not.toBeInTheDocument()
    })
})
