import { expect } from 'chai'
import { validateReview } from '../scripts/review-content-drafts.js'

describe('generated draft review safeguards', () => {
    it('accepts a complete pass review with one item per practice question', () => {
        const review = validateReview({
            decision: 'pass',
            items: [
                { decision: 'pass', reason: 'The answer and explanation agree.' },
                { decision: 'pass', reason: 'The item is self-contained.' },
            ],
        }, 2)
        expect(review.decision).to.equal('pass')
    })

    it('rejects an unsafe rewrite with duplicate options', () => {
        expect(() => validateReview({
            decision: 'rewrite',
            items: [{
                decision: 'rewrite',
                reason: 'The original is ambiguous.',
                proposed: { prompt: 'Which option is correct here?', options: ['A', 'A', 'C', 'D'], correctIndex: 0, explanation: 'The first option is correct.' },
            }],
        }, 1)).to.throw('rewrite proposal options are not distinct')
    })
})
