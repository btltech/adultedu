import { describe, expect, it } from 'vitest'
import { normalizeFrameworkSlug, normalizeTrackCategory } from '../lib/curriculumTaxonomy'
import { getPathwayGuidance } from '../lib/pathwayGuidance'

describe('curriculum taxonomy compatibility', () => {
    it('normalizes legacy GCSE category and framework casing', () => {
        expect(normalizeTrackCategory('qualifications')).toBe('qual_prep')
        expect(normalizeFrameworkSlug('gcse')).toBe('GCSE')
    })

    it('gives legacy qualification tracks qualification guidance', () => {
        const guidance = getPathwayGuidance({ category: 'qualifications', slug: 'legacy-gcse' })
        expect(guidance.audience).toMatch(/formal tests|qualification/i)
        expect(guidance.outcomes.join(' ')).toMatch(/revision/i)
    })
})
