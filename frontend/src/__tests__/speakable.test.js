import { describe, expect, it } from 'vitest'
import { lessonToSentences, splitSentences, toSpeakable } from '../lib/speech/speakable'

describe('toSpeakable', () => {
    it('reads money, percentages and fractions in words', () => {
        expect(toSpeakable('It costs £1,250.50 with 20% off.')).toBe('It costs 1250.50 pounds with 20 percent off.')
        expect(toSpeakable('Half is 1/2 of the total')).toBe('Half is 1 over 2 of the total')
    })

    it('reads arithmetic symbols between numbers', () => {
        expect(toSpeakable('3 × 4 = 12')).toBe('3 times 4 equals 12')
        expect(toSpeakable('5 + 6')).toBe('5 plus 6')
        expect(toSpeakable('9 ÷ 3')).toBe('9 divided by 3')
        expect(toSpeakable('x² and y³')).toBe('x squared and y cubed')
    })

    it('spells out acronyms but keeps words and special pronunciations', () => {
        expect(toSpeakable('GCSE and HMRC')).toBe('G C S E and H M R C')
        expect(toSpeakable('Apply through UCAS')).toBe('Apply through You-cass')
        expect(toSpeakable('Life in the UK')).toBe('Life in the U K')
    })

    it('removes markdown, links, emoji and inline code markers', () => {
        expect(toSpeakable('**Bold** and `code` and [a link](https://example.com) 🎉')).toBe('Bold and code and a link')
        expect(toSpeakable('See https://example.com/page now')).toBe('See link now')
    })

    it('returns an empty string for non-text input', () => {
        expect(toSpeakable(undefined)).toBe('')
        expect(toSpeakable(42)).toBe('')
    })
})

describe('splitSentences', () => {
    it('splits on sentence ends and keeps text without punctuation whole', () => {
        expect(splitSentences('One. Two! Three?')).toEqual(['One.', 'Two!', 'Three?'])
        expect(splitSentences('No stop')).toEqual(['No stop'])
        expect(splitSentences('')).toEqual([])
    })
})

describe('lessonToSentences', () => {
    const lesson = {
        title: 'Using email',
        summary: 'Send your first email',
        contentBlocks: [
            { type: 'heading', content: 'Getting started' },
            { type: 'paragraph', content: 'Open your inbox. Then click new.' },
            { type: 'list', items: ['Add a subject', 'Write a message'] },
            { type: 'callout', variant: 'tip', content: 'Check the address twice' },
            { type: 'callout', content: 'Emails are not private' },
            { type: 'code', content: 'print("hello")' },
            { type: 'interactive', widget: 'FractionLab' },
            { type: 'writing_activity', prompt: 'Write something' },
        ],
    }

    it('reads title, summary and text blocks in order, skipping code and activities', () => {
        expect(lessonToSentences(lesson)).toEqual([
            'Using email.',
            'Send your first email.',
            'Getting started.',
            'Open your inbox.',
            'Then click new.',
            'Add a subject.',
            'Write a message.',
            'Tip: Check the address twice.',
            'Key idea: Emails are not private.',
        ])
    })

    it('copes with missing content', () => {
        expect(lessonToSentences({})).toEqual([])
        expect(lessonToSentences(null)).toEqual([])
    })
})
