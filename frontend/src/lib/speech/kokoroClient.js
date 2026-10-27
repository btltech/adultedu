// Opt-in natural English voice (Kokoro) running on the learner's device.
//
// Nothing is downloaded until the learner turns it on (about 90MB, once). Until the
// model is ready, speakWithKokoro() returns false and readAloud falls back to the
// browser voice, so reading aloud never waits on the download. No text leaves the
// device and there is no per-use cost.

const STORAGE_KEY = 'adultedu:natural-voice'
const MODEL_BASE = import.meta.env.VITE_KOKORO_MODEL_BASE || '/api/kokoro-model'
const PROBE_URL = `${MODEL_BASE}/v1.0/config.json`
const VOICE = { voice: 'bf_emma', speed: 0.95 } // British English, clear and calm
const SENTENCE_GAP_MS = 150
const GENERATE_TIMEOUT_MS = 30000

let state = { status: 'off', progress: 0, error: undefined, available: undefined }
const listeners = new Set()
const setState = (next) => {
    state = { ...state, ...next }
    listeners.forEach((listener) => listener(state))
}

let worker = null
let nextRequestId = 1
const pending = new Map()
let context = null
let activeSource = null
let activeFinish = null
let playToken = 0

export const getKokoroState = () => state

export function subscribeKokoro(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function isKokoroSupported() {
    return typeof Worker !== 'undefined'
        && typeof WebAssembly !== 'undefined'
        && typeof caches !== 'undefined'
        && (typeof AudioContext !== 'undefined' || typeof window?.webkitAudioContext !== 'undefined')
}

/** Is the model actually hosted on this site? (It is only when the R2 bucket is bound.) */
export async function probeKokoroAvailable() {
    if (state.available !== undefined) return state.available
    let available = false
    if (isKokoroSupported()) {
        try {
            const response = await fetch(PROBE_URL, { method: 'HEAD' })
            available = response.ok
        } catch {
            available = false
        }
    }
    setState({ available })
    return available
}

function failWorker(message) {
    pending.forEach(({ reject }) => reject(new Error(message)))
    pending.clear()
    worker?.terminate()
    worker = null
    setState({ status: 'error', error: message })
}

function handleMessage(event) {
    const message = event.data
    if (message.type === 'progress') {
        setState({ progress: message.progress })
    } else if (message.type === 'ready') {
        setState({ status: 'ready', progress: 1, error: undefined })
    } else if (message.type === 'audio') {
        const request = pending.get(message.id)
        pending.delete(message.id)
        request?.resolve({ samples: message.samples, sampleRate: message.sampleRate })
    } else if (message.type === 'error') {
        if (message.id !== undefined) {
            const request = pending.get(message.id)
            pending.delete(message.id)
            request?.reject(new Error(message.message))
        } else {
            failWorker(message.message)
        }
    }
}

export function warmupKokoro() {
    if (state.status === 'loading' || state.status === 'ready') return
    if (!isKokoroSupported()) {
        setState({ status: 'error', error: 'This browser cannot run the natural voice.' })
        return
    }
    try {
        worker = new Worker(new URL('./kokoro.worker.js', import.meta.url), { type: 'module' })
    } catch (error) {
        setState({ status: 'error', error: error instanceof Error ? error.message : 'Could not start the voice.' })
        return
    }
    worker.onmessage = handleMessage
    worker.onerror = (event) => failWorker(event.message || 'The natural voice stopped working.')
    setState({ status: 'loading', progress: 0, error: undefined })
    worker.postMessage({ type: 'init', modelBase: MODEL_BASE, voices: [VOICE.voice] })
}

export function enableKokoro() {
    try {
        localStorage.setItem(STORAGE_KEY, '1')
    } catch {
        // Private browsing: the choice lasts for this visit only.
    }
    setState({ status: 'idle' })
    warmupKokoro()
}

export function disableKokoro() {
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        // ignore
    }
    stopKokoro()
    pending.forEach(({ reject }) => reject(new Error('Natural voice turned off')))
    pending.clear()
    worker?.terminate()
    worker = null
    setState({ status: 'off', progress: 0, error: undefined })
}

/** Restore the saved choice on app start. Downloads nothing unless the learner opted in. */
export function initKokoroFromPreference() {
    let enabled = false
    try {
        enabled = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
        enabled = false
    }
    if (state.status === 'off' && enabled) {
        setState({ status: 'idle' })
        warmupKokoro()
    }
}

function generate(text) {
    return new Promise((resolve, reject) => {
        const id = nextRequestId++
        const timer = setTimeout(() => {
            pending.delete(id)
            reject(new Error('The natural voice took too long'))
        }, GENERATE_TIMEOUT_MS)
        pending.set(id, {
            resolve: (audio) => { clearTimeout(timer); resolve(audio) },
            reject: (error) => { clearTimeout(timer); reject(error) },
        })
        worker.postMessage({ type: 'generate', id, text, voice: VOICE.voice, speed: VOICE.speed })
    })
}

function getContext() {
    if (!context) {
        const Ctor = window.AudioContext || window.webkitAudioContext
        context = new Ctor()
    }
    return context
}

function playSamples(samples, sampleRate) {
    return new Promise((resolve) => {
        const ctx = getContext()
        const buffer = ctx.createBuffer(1, samples.length, sampleRate)
        buffer.copyToChannel(samples, 0)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        activeSource = source
        activeFinish = resolve
        source.onended = () => {
            if (activeSource === source) {
                activeSource = null
                activeFinish = null
            }
            resolve()
        }
        source.start()
    })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Speak sentences with Kokoro. Resolves true if speech was produced (or deliberately
 * stopped), false if the natural voice cannot be used right now and the caller should
 * use the browser voice instead.
 */
export async function speakWithKokoro(sentences, { onSentence } = {}) {
    if (!sentences.length) return false
    if (state.status === 'idle') warmupKokoro()
    if (state.status !== 'ready' || !worker) return false

    stopKokoro()
    const token = ++playToken
    // Create/resume inside the learner's click so autoplay rules are satisfied.
    const ctx = getContext()
    if (ctx.state === 'suspended') ctx.resume()

    let upcoming
    try {
        upcoming = generate(sentences[0])
        await upcoming
    } catch {
        return false
    }

    try {
        for (let i = 0; i < sentences.length; i++) {
            const audio = await upcoming
            if (token !== playToken) return true
            if (i + 1 < sentences.length) {
                // Prepare the next sentence while this one plays.
                upcoming = generate(sentences[i + 1])
                upcoming.catch(() => undefined)
            }
            onSentence?.(i)
            await playSamples(audio.samples, audio.sampleRate)
            if (token !== playToken) return true
            if (i + 1 < sentences.length) await sleep(SENTENCE_GAP_MS)
        }
    } catch {
        // Failed part-way: the first sentence already played, so don't repeat it with another voice.
    }
    return true
}

export function stopKokoro() {
    playToken++
    const finish = activeFinish
    try {
        activeSource?.stop()
    } catch {
        // already stopped
    }
    activeSource = null
    activeFinish = null
    finish?.()
}

export function pauseKokoro() {
    if (activeSource && context?.state === 'running') context.suspend()
}

export function resumeKokoro() {
    if (context?.state === 'suspended') context.resume()
}

export const isKokoroSpeaking = () => activeSource !== null

/** Test helper: reset module state. */
export function resetKokoroForTests() {
    pending.clear()
    worker = null
    context = null
    activeSource = null
    activeFinish = null
    playToken = 0
    state = { status: 'off', progress: 0, error: undefined, available: undefined }
    listeners.clear()
}
