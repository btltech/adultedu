import { describe, it } from 'mocha'
import { expect } from 'chai'
import { scoreQuestionAnswer } from '../src/lib/scoring.js'

describe('Interactive scoring', () => {
    it('scores ordering questions (index-based correct answer)', () => {
        const question = {
            type: 'ordering',
            options: JSON.stringify(['Subtract 5', '3x = 15', 'Divide by 3', 'x = 5']),
            answer: JSON.stringify([0, 1, 2, 3]),
        }

        const ok = scoreQuestionAnswer({
            question,
            userAnswer: ['Subtract 5', '3x = 15', 'Divide by 3', 'x = 5'],
        })
        expect(ok.ok).to.equal(true)
        expect(ok.isCorrect).to.equal(true)

        const wrong = scoreQuestionAnswer({
            question,
            userAnswer: ['3x = 15', 'Subtract 5', 'Divide by 3', 'x = 5'],
        })
        expect(wrong.ok).to.equal(true)
        expect(wrong.isCorrect).to.equal(false)
        expect(wrong.correctAnswer).to.deep.equal(['Subtract 5', '3x = 15', 'Divide by 3', 'x = 5'])
    })

    it('scores slider questions with tolerance', () => {
        const question = {
            type: 'slider',
            options: JSON.stringify([0, 10, 0.1, '']),
            answer: JSON.stringify(6.6),
            sourceMeta: JSON.stringify({ slider: { tolerance: 0.2 } }),
        }

        const within = scoreQuestionAnswer({ question, userAnswer: '6.5' })
        expect(within.ok).to.equal(true)
        expect(within.isCorrect).to.equal(true)
        expect(within.correctAnswer).to.equal(6.6)

        const outside = scoreQuestionAnswer({ question, userAnswer: '6.2' })
        expect(outside.ok).to.equal(true)
        expect(outside.isCorrect).to.equal(false)
    })

    it('scores image label questions from JSON mapping', () => {
        const question = {
            type: 'image_label',
            options: JSON.stringify(['A', 'B']),
            answer: JSON.stringify({ t1: 'A', t2: 'B' }),
            assets: JSON.stringify({ answer: { t1: 'A', t2: 'B' } }),
        }

        const res = scoreQuestionAnswer({
            question,
            userAnswer: JSON.stringify({ t1: 'A', t2: 'B' }),
        })

        expect(res.ok).to.equal(true)
        expect(res.isCorrect).to.equal(true)
    })

    it('scores multi_step MCQ-style questions', () => {
        const question = {
            type: 'multi_step',
            options: JSON.stringify(['Option A', 'Option B']),
            answer: JSON.stringify(1),
        }

        const res = scoreQuestionAnswer({ question, userAnswer: 'Option B' })
        expect(res.ok).to.equal(true)
        expect(res.isCorrect).to.equal(true)
    })
})

