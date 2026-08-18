import { expect } from 'chai'
import { apiRateLimitKey } from '../src/middleware/rateLimiter.js'

describe('API rate-limit keys', () => {
    it('uses a stable private key for an authenticated session', () => {
        const first = apiRateLimitKey({ cookies: { session: 'session-token' }, ip: '10.0.0.1' })
        const second = apiRateLimitKey({ cookies: { session: 'session-token' }, ip: '10.0.0.2' })

        expect(first).to.equal(second)
        expect(first).to.match(/^session:[a-f0-9]{64}$/)
        expect(first).not.to.include('session-token')
    })

    it('keeps anonymous traffic keyed by normalised IP', () => {
        const key = apiRateLimitKey({ cookies: {}, ip: '10.0.0.1' })

        expect(key).to.equal('ip:10.0.0.1')
    })
})
