import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DiagnosticModal from '../components/diagnostic/DiagnosticModal'

vi.mock('../lib/api', () => ({
    api: vi.fn(() => Promise.resolve({ questions: [] })),
    getUserMessage: (error, fallback) => fallback,
}))

/**
 * The modal is only reachable behind sign-in, so these behaviours cannot be
 * checked by browsing the site. They are also the ones most likely to regress
 * silently: nothing visibly breaks when a focus trap stops trapping.
 */
function Harness() {
    const [open, setOpen] = useState(false)
    return (
        <MemoryRouter>
            <button type="button" onClick={() => setOpen(true)}>Start Diagnostic</button>
            <DiagnosticModal isOpen={open} onClose={() => setOpen(false)} trackSlug="gcse-maths" trackTitle="GCSE Maths" />
        </MemoryRouter>
    )
}

describe('DiagnosticModal accessibility', () => {
    beforeEach(() => vi.clearAllMocks())

    it('exposes a labelled modal dialog', async () => {
        const user = userEvent.setup()
        render(<Harness />)
        await user.click(screen.getByRole('button', { name: /start diagnostic/i }))

        const dialog = await screen.findByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')

        // The accessible name must resolve to real text, not a dangling id.
        const labelledBy = dialog.getAttribute('aria-labelledby')
        expect(labelledBy).toBeTruthy()
        expect(document.getElementById(labelledBy)?.textContent?.trim()).toBeTruthy()
    })

    it('moves focus into the dialog when it opens', async () => {
        const user = userEvent.setup()
        render(<Harness />)
        await user.click(screen.getByRole('button', { name: /start diagnostic/i }))

        const dialog = await screen.findByRole('dialog')
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))
    })

    it('keeps Tab and Shift+Tab inside the dialog', async () => {
        const user = userEvent.setup()
        render(<Harness />)
        await user.click(screen.getByRole('button', { name: /start diagnostic/i }))
        const dialog = await screen.findByRole('dialog')
        await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

        // Tabbing well past the number of controls must never escape the dialog.
        for (let i = 0; i < 12; i += 1) {
            await user.tab()
            expect(dialog.contains(document.activeElement)).toBe(true)
        }
        for (let i = 0; i < 12; i += 1) {
            await user.tab({ shift: true })
            expect(dialog.contains(document.activeElement)).toBe(true)
        }
    })

    it('closes on Escape and returns focus to what opened it', async () => {
        const user = userEvent.setup()
        render(<Harness />)
        const trigger = screen.getByRole('button', { name: /start diagnostic/i })
        await user.click(trigger)
        await screen.findByRole('dialog')

        await user.keyboard('{Escape}')

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        // Focus must not be stranded on the removed dialog.
        await waitFor(() => expect(document.activeElement).toBe(trigger))
    })
})
