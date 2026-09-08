import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTracks } from '../lib/api'

describe('tracks API resilience', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('rejects a successful but malformed catalogue response before rendering', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            json: async () => ({ tracks: [] }),
        }))

        await expect(getTracks()).rejects.toMatchObject({
            message: 'Invalid tracks response',
            userMessage: 'Pathways are temporarily unavailable. Please try again.',
        })
    })
})
