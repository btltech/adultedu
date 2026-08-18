import { expect } from 'chai'
import {
    hasLiveContentChange,
    publicationReadinessIssues,
} from '../src/lib/contentQuality.js'

const approvedQuestion = {
    sourceUrl: 'https://www.gov.uk/example',
    sourceTitle: 'Example primary source',
    sourceCheckedAt: new Date('2026-08-01T00:00:00.000Z'),
    curriculumObjective: 'Read and interpret employment information.',
    contentRisk: 'standard',
    reviewStatus: 'approved',
    reviewedBy: 'Content reviewer',
    reviewedAt: new Date('2026-08-02T00:00:00.000Z'),
    reviewDueAt: null,
}

describe('content quality publication gate', () => {
    it('accepts an approved, sourced standard-content question', () => {
        expect(publicationReadinessIssues(approvedQuestion, new Date('2026-08-16T00:00:00.000Z'))).to.deep.equal([])
    })

    it('requires evidence and approval before publication', () => {
        const issues = publicationReadinessIssues({ reviewStatus: 'draft', contentRisk: 'standard' })
        expect(issues).to.include('Add a primary source URL before publishing.')
        expect(issues).to.include('Set reviewStatus to approved before publishing (or legacy for existing public content).')
    })

    it('accepts legacy content that was public before the governance workflow', () => {
        expect(publicationReadinessIssues({
            ...approvedQuestion,
            reviewStatus: 'legacy',
            reviewedBy: null,
            reviewedAt: null,
        }, new Date('2026-08-16T00:00:00.000Z'))).to.deep.equal([])
    })

    it('requires a future review date for regulated content', () => {
        const issues = publicationReadinessIssues({
            ...approvedQuestion,
            contentRisk: 'regulated',
            reviewDueAt: new Date('2026-08-01T00:00:00.000Z'),
        }, new Date('2026-08-16T00:00:00.000Z'))

        expect(issues).to.include('The review due date has passed; re-check the source before publishing.')
    })

    it('recognises learner-facing changes that need re-approval', () => {
        expect(hasLiveContentChange({ explanation: 'Corrected explanation' })).to.equal(true)
        expect(hasLiveContentChange({ reviewStatus: 'approved' })).to.equal(false)
    })
})
