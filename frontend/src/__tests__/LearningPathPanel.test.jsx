import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LearningPathPanel from '../components/LearningPathPanel'

describe('LearningPathPanel', () => {
    it('does not render unavailable steps as links', () => {
        render(
            <MemoryRouter>
                <LearningPathPanel
                    title="Course map"
                    items={[
                        { id: 'available', title: 'Available lesson' },
                        { id: 'unavailable', title: 'Coming later' },
                    ]}
                    getHref={(item) => item.id === 'available' ? '/lesson/available' : null}
                />
            </MemoryRouter>
        )

        expect(screen.getByRole('link', { name: /available lesson/i })).toHaveAttribute('href', '/lesson/available')
        expect(screen.queryByRole('link', { name: /coming later/i })).not.toBeInTheDocument()
        expect(document.querySelector('a[href="#"]')).not.toBeInTheDocument()
    })
})
