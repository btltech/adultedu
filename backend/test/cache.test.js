import { expect } from 'chai'
import { cache } from '../src/lib/cache.js'

describe('cache helper', () => {
    it('stores and reads JSON values without Redis', async () => {
        const key = `test:cache:${Date.now()}`
        const value = { tracks: [{ slug: 'gcse-maths' }] }

        await cache.setJson(key, value, { EX: 60 })
        expect(await cache.getJson(key)).to.deep.equal(value)
        await cache.del(key)
        expect(await cache.getJson(key)).to.equal(null)
    })

    it('deduplicates concurrent cache misses', async () => {
        const key = `test:cache:flight:${Date.now()}`
        let calls = 0
        const loader = async () => {
            calls += 1
            return { ok: true }
        }

        const results = await Promise.all([
            cache.getOrSetJson(key, loader, { EX: 60 }),
            cache.getOrSetJson(key, loader, { EX: 60 }),
        ])

        expect(calls).to.equal(1)
        expect(results[0].value).to.deep.equal({ ok: true })
        expect(results[1].value).to.deep.equal({ ok: true })
        await cache.del(key)
    })
})
