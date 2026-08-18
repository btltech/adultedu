import { expect } from 'chai'
import { auditQuestions } from '../scripts/audit-published-snapshot.js'
import { verifyRow } from '../scripts/verify-topic-mapped-metadata.js'

const sourcePlan = { tracks: { python: { sources: [{ url: 'https://docs.python.org/3/tutorial/', title: 'Python' }] } } }
const topicMap = { tracks: { python: { Basics: { code: 'PY-1', text: 'Use Python basics.' } } } }

describe('topic metadata verification', () => {
    it('accepts a source/objective/topic-consistent row', () => {
        const row = { id: 'q1', sourceUrl: 'https://docs.python.org/3/tutorial/', sourceTitle: 'Python', sourceCheckedAt: '2026-08-17', curriculumObjective: 'Use Python basics.', sourceMeta: JSON.stringify({ verification: 'pending-item-review', objectiveCode: 'PY-1' }), prompt: 'Explain one Python basic.', explanation: 'It is a basic Python concept.', topic: { title: 'Basics', track: { slug: 'python' } } }
        expect(verifyRow(row, sourcePlan, topicMap)).to.include({ ok: true, reason: 'topic_source_objective_consistent', objectiveCode: 'PY-1' })
    })

    it('audits numeric-string answers as resolvable rather than invalid', () => {
        const result = auditQuestions([{ id: 'q1', type: 'mcq', prompt: 'Choose the correct answer here.', options: '["A","B"]', answer: '"1"', explanation: 'B is correct because it matches.', sourceUrl: 'https://example.com', sourceTitle: 'Example', sourceCheckedAt: '2026-08-17', curriculumObjective: 'Choose an answer.', sourceMeta: null, reviewStatus: 'in_review' }])
        expect(result.unresolvableAnswerIndexes).to.equal(0)
        expect(result.answerValuesResolvedFromTextOrNumericString).to.equal(1)
    })
})
