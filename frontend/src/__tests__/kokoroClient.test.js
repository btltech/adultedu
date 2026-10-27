import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    disableKokoro,
    enableKokoro,
    getKokoroState,
    initKokoroFromPreference,
    probeKokoroAvailable,
    resetKokoroForTests,
    speakWithKokoro,
} from '../lib/speech/kokoroClient'

class FakeWorker {
    static instances = []
    constructor() { FakeWorker.instances.push(this); this.sent = []; this.terminated = false }
    postMessage(message) { this.sent.push(message) }
    terminate() { this.terminated = true }
    emit(data) { this.onmessage?.({ data }) }
}

describe('kokoroClient', () => {
    beforeEach(() => {
        resetKokoroForTests()
        FakeWorker.instances = []
        const storage = new Map()
        vi.stubGlobal('localStorage', {
            getItem: (key) => storage.get(String(key)) ?? null,
            setItem: (key, value) => storage.set(String(key), String(value)),
            removeItem: (key) => storage.delete(String(key)),
            clear: () => storage.clear(),
        })
        vi.stubGlobal('Worker', FakeWorker)
        vi.stubGlobal('caches', {})
        vi.stubGlobal('AudioContext', class {})
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('downloads nothing until the learner opts in', async () => {
        initKokoroFromPreference()
        expect(FakeWorker.instances).toHaveLength(0)
        expect(await speakWithKokoro(['Hello.'])).toBe(false)
    })

    it('restores a saved opt-in and starts loading', () => {
        localStorage.setItem('adultedu:natural-voice', '1')
        initKokoroFromPreference()
        expect(getKokoroState().status).toBe('loading')
        expect(FakeWorker.instances[0].sent[0]).toMatchObject({ type: 'init', modelBase: '/api/kokoro-model' })
    })

    it('uses the browser voice (returns false) while the model is still loading', async () => {
        enableKokoro()
        expect(await speakWithKokoro(['Hello.'])).toBe(false)
    })

    it('tracks download progress and becomes ready', () => {
        enableKokoro()
        FakeWorker.instances[0].emit({ type: 'progress', progress: 0.5 })
        expect(getKokoroState().progress).toBe(0.5)
        FakeWorker.instances[0].emit({ type: 'ready' })
        expect(getKokoroState().status).toBe('ready')
    })

    it('reports an init failure without throwing', () => {
        enableKokoro()
        FakeWorker.instances[0].emit({ type: 'error', message: 'model missing' })
        expect(getKokoroState()).toMatchObject({ status: 'error', error: 'model missing' })
    })

    it('turning it off removes the preference and stops the worker', () => {
        enableKokoro()
        disableKokoro()
        expect(getKokoroState().status).toBe('off')
        expect(FakeWorker.instances[0].terminated).toBe(true)
        expect(localStorage.getItem('adultedu:natural-voice')).toBeNull()
    })

    it('only offers the natural voice when the model is hosted', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
        expect(await probeKokoroAvailable()).toBe(false)
        resetKokoroForTests()
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
        expect(await probeKokoroAvailable()).toBe(true)
        expect(getKokoroState().available).toBe(true)
    })
})
