import { describe, expect, it } from 'vitest'
import { authReturnState, normaliseReturnLocation, returnLocationPath } from '../lib/navigation'

describe('navigation return locations', () => {
    it('preserves a safe internal deep link and its route state', () => {
        const state = { openDiagnostic: true }
        const result = normaliseReturnLocation({
            pathname: '/track/digital-confidence',
            search: '?level=2',
            hash: '#first-lesson',
            state,
        })

        expect(returnLocationPath(result)).toBe('/track/digital-confidence?level=2#first-lesson')
        expect(result.state).toEqual(state)
    })

    it('rejects external and protocol-relative return destinations', () => {
        expect(normaliseReturnLocation({ pathname: 'https://example.com' })).toMatchObject({ pathname: '/' })
        expect(normaliseReturnLocation({ pathname: '//example.com' })).toMatchObject({ pathname: '/' })
    })

    it('does not create an authentication redirect loop', () => {
        expect(authReturnState({ pathname: '/login', search: '', hash: '' })).toEqual({
            from: { pathname: '/', search: '', hash: '', state: null },
        })
    })
})
