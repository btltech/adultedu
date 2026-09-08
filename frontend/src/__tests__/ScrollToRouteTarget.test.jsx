import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ScrollToRouteTarget from '../components/ScrollToRouteTarget'

describe('ScrollToRouteTarget', () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = vi.fn()
    })

    it('reveals a named section after route navigation', async () => {
        render(
            <MemoryRouter initialEntries={['/tracks#pathway-finder']}>
                <ScrollToRouteTarget />
                <section id="pathway-finder">Pathway finder</section>
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
                block: 'start',
                behavior: 'auto',
            })
        })
    })

    it('waits for an asynchronously rendered destination', async () => {
        const { rerender } = render(
            <MemoryRouter initialEntries={['/track/example#topic-outline']}>
                <ScrollToRouteTarget />
            </MemoryRouter>,
        )

        rerender(
            <MemoryRouter initialEntries={['/track/example#topic-outline']}>
                <ScrollToRouteTarget />
                <section id="topic-outline">Topic outline</section>
            </MemoryRouter>,
        )

        await waitFor(() => {
            expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
                block: 'start',
                behavior: 'auto',
            })
        })
    })
})
