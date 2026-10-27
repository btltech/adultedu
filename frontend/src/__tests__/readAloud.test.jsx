import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ListenButton from '../components/ListenButton'
import { getReadAloudState, readAloud, stopReadAloud } from '../lib/speech/readAloud'
import { resetKokoroForTests } from '../lib/speech/kokoroClient'

const spoken = []

class FakeUtterance {
    constructor(text) { this.text = text }
}

function installSpeechSynthesis({ endImmediately = true } = {}) {
    spoken.length = 0
    window.speechSynthesis = {
        speak: vi.fn((utterance) => {
            spoken.push(utterance.text)
            if (endImmediately) setTimeout(() => utterance.onend?.(), 0)
        }),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: () => [
            { name: 'Compact US', lang: 'en-US' },
            { name: 'Google UK English Female', lang: 'en-GB' },
        ],
    }
    window.SpeechSynthesisUtterance = FakeUtterance
}

const lesson = {
    id: 'lesson-1',
    title: 'Using email',
    summary: 'Send your first email',
    contentBlocks: [
        { type: 'paragraph', content: 'Open your inbox. Then click new.' },
        { type: 'code', content: 'ignored()' },
    ],
}

describe('read aloud (browser voice)', () => {
    beforeEach(() => {
        resetKokoroForTests()
        installSpeechSynthesis()
    })

    afterEach(() => {
        stopReadAloud()
        delete window.speechSynthesis
        delete window.SpeechSynthesisUtterance
    })

    it('reads each sentence with the browser voice when the natural voice is off', async () => {
        await readAloud(['One.', 'Two.'])
        expect(spoken).toEqual(['One.', 'Two.'])
        expect(getReadAloudState().status).toBe('idle')
    })

    it('stop cancels speech and resets state', async () => {
        installSpeechSynthesis({ endImmediately: false })
        const reading = readAloud(['One.', 'Two.'])
        await Promise.resolve()
        stopReadAloud()
        await reading
        expect(window.speechSynthesis.cancel).toHaveBeenCalled()
        expect(getReadAloudState().status).toBe('idle')
    })
})

describe('ListenButton', () => {
    beforeEach(() => {
        resetKokoroForTests()
        installSpeechSynthesis({ endImmediately: false })
    })

    afterEach(() => {
        stopReadAloud()
        delete window.speechSynthesis
        delete window.SpeechSynthesisUtterance
    })

    it('starts reading the lesson, then offers pause and stop', async () => {
        render(<ListenButton lesson={lesson} />)
        fireEvent.click(screen.getByRole('button', { name: /listen to this lesson/i }))

        expect(await screen.findByRole('button', { name: /pause/i })).toBeTruthy()
        expect(screen.getByRole('button', { name: /stop/i })).toBeTruthy()
        expect(spoken[0]).toBe('Using email.')

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /stop/i })) })
        expect(screen.getByRole('button', { name: /listen to this lesson/i })).toBeTruthy()
    })

    it('renders nothing for a lesson with no readable text', () => {
        const { container } = render(<ListenButton lesson={{ id: 'x', contentBlocks: [{ type: 'code', content: 'x' }] }} />)
        expect(container.firstChild).toBeNull()
    })
})
