import { expect } from 'chai'
import {
    normalizeFrameworkSlug,
    normalizeFrameworks,
    normalizeTrackCategory,
} from '../src/lib/curriculumTaxonomy.js'
import { recommendTracks } from '../src/lib/learnerOnboarding.js'

describe('curriculum taxonomy compatibility', () => {
    it('maps legacy GCSE category and framework casing to canonical values', () => {
        expect(normalizeTrackCategory('qualifications')).to.equal('qual_prep')
        expect(normalizeTrackCategory('qual_prep')).to.equal('qual_prep')
        expect(normalizeFrameworkSlug('gcse')).to.equal('GCSE')
        expect(normalizeFrameworks([
            { framework: { slug: 'gcse', title: 'GCSE' } },
            { framework: { slug: 'GCSE', title: 'GCSE' } },
        ])).to.deep.equal([{ slug: 'GCSE', title: 'GCSE' }])
    })

    it('scores a legacy GCSE record as qualification preparation', () => {
        const [result] = recommendTracks({
            primaryGoal: 'qualification-prep',
            confidenceBefore: 3,
            weeklyTime: 'steady',
            tracks: [{
                id: 'legacy-gcse',
                slug: 'gcse-science',
                title: 'GCSE Science',
                description: 'GCSE preparation',
                category: 'qualifications',
                trackFrameworks: [{ framework: { slug: 'gcse', title: 'GCSE' } }],
                topics: [{ lessons: [], _count: { questions: 25 } }],
            }],
        })

        expect(result.category).to.equal('qual_prep')
        expect(result.frameworks).to.deep.equal([{ slug: 'GCSE', title: 'GCSE' }])
        expect(result.learningGoal).to.equal('Exam preparation')
        expect(result.score).to.be.greaterThan(80)
    })
})
