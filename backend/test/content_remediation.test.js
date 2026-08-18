import { expect } from 'chai'
import { scanQuestion, validateProposal, normaliseText } from '../scripts/remediate-published-content.js'

const base = {
    id: 'q-1',
    type: 'mcq',
    prompt: 'Which option is safest for this fictional account?',
    options: JSON.stringify(['Use a strong password', 'Share the code', 'Disable updates', 'Ignore the warning']),
    answer: JSON.stringify('Use a strong password'),
    explanation: 'A strong password helps protect the account from unauthorised access.',
    sourceUrl: 'https://example.org/source',
    sourceTitle: 'Approved source',
    curriculumObjective: 'OBJ-1',
}

describe('published content remediation safeguards', () => {
    it('finds a safe answer representation repair without changing meaning', () => {
        const result = scanQuestion(base)
        expect(result.issues).to.include('answer_representation_noncanonical')
        expect(result.safeUpdates.answer).to.equal('0')
    })

    it('flags unresolved indexes and does not invent a repair', () => {
        const result = scanQuestion({ ...base, answer: JSON.stringify(9) })
        expect(result.issues).to.include('answer_unresolved')
        expect(result.safeUpdates).to.deep.equal({})
    })

    it('rejects proposals that change option count or embed answer lists', () => {
        const bad = validateProposal(base, {
            decision: 'rewrite',
            prompt: 'A. First B. Second C. Third D. Fourth',
            options: ['One', 'Two', 'Three'],
            answer: 0,
            explanation: 'This explanation is long enough to pass the minimum length check.',
        })
        expect(bad.ok).to.equal(false)
    })

    it('accepts a bounded rewrite with a zero-based answer index', () => {
        const good = validateProposal(base, {
            decision: 'rewrite',
            prompt: 'Which action best protects the fictional account in this example?',
            options: ['Use a unique strong password', 'Share the code', 'Disable updates', 'Ignore the warning'],
            answer: 0,
            explanation: 'A unique strong password makes unauthorised access harder and does not disclose a security code.',
            rationale: 'The original wording was ambiguous.',
        })
        expect(good.ok).to.equal(true)
    })

    it('normalises text consistently for duplicate detection', () => {
        expect(normaliseText('  “Strong\u2013password”  ')).to.equal('"strong-password"')
    })

    it('marks embedded option labels as a safe formatting repair', () => {
        const result = scanQuestion({
            ...base,
            options: JSON.stringify(['B) Share the code', 'A) Use a strong password', 'C) Disable updates', 'D) Ignore the warning']),
            answer: JSON.stringify(1),
        })
        expect(result.issues).to.include('embedded_option_labels')
        expect(JSON.parse(result.safeUpdates.options)).to.deep.equal(['Share the code', 'Use a strong password', 'Disable updates', 'Ignore the warning'])
    })
})
