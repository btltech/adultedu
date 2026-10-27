// Kokoro-82M text-to-speech worker (runs the model off the main thread).
//
// The site's Content-Security-Policy only allows 'self', so nothing is fetched from
// huggingface.co or a CDN: model files come from the same origin (see
// functions/api/kokoro-model) and the ONNX WebAssembly runtime from /onnxruntime.

import { env } from '@huggingface/transformers'
import { KokoroTTS } from 'kokoro-js'

// kokoro-js hardcodes this URL for voice files and checks Cache Storage under this
// name before fetching, so we seed that cache from our own origin instead.
const KOKORO_VOICE_CACHE = 'kokoro-voices'
const kokoroVoiceUrl = (voice) => `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/${voice}.bin`
const MODEL_ID = 'v1.0'

let tts = null

async function seedVoice(modelBase, voice) {
    const cache = await caches.open(KOKORO_VOICE_CACHE)
    const key = kokoroVoiceUrl(voice)
    if (await cache.match(key)) return
    const response = await fetch(`${modelBase}/${MODEL_ID}/voices/${voice}.bin`)
    if (!response.ok) throw new Error(`Voice ${voice} unavailable (${response.status})`)
    await cache.put(key, response)
}

async function init(modelBase, voices) {
    env.allowRemoteModels = false
    env.allowLocalModels = true
    env.localModelPath = `${modelBase}/`
    if (env.backends.onnx.wasm) {
        env.backends.onnx.wasm.wasmPaths = '/onnxruntime/'
        // The site is not cross-origin isolated, so WebAssembly threads are unavailable.
        env.backends.onnx.wasm.numThreads = 1
    }

    const files = new Map()
    tts = await KokoroTTS.from_pretrained(MODEL_ID, {
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (info) => {
            if (info.status !== 'progress' || !info.file || !info.total) return
            files.set(info.file, { loaded: info.loaded || 0, total: info.total })
            let loaded = 0
            let total = 0
            for (const file of files.values()) {
                loaded += file.loaded
                total += file.total
            }
            self.postMessage({ type: 'progress', progress: total ? loaded / total : 0 })
        },
    })
    await Promise.all(voices.map((voice) => seedVoice(modelBase, voice)))
    self.postMessage({ type: 'ready' })
}

self.onmessage = async (event) => {
    const message = event.data
    try {
        if (message.type === 'init') {
            await init(message.modelBase, message.voices)
        } else if (message.type === 'generate') {
            if (!tts) throw new Error('Kokoro is not initialised')
            const audio = await tts.generate(message.text, { voice: message.voice, speed: message.speed })
            self.postMessage(
                { type: 'audio', id: message.id, samples: audio.audio, sampleRate: audio.sampling_rate },
                [audio.audio.buffer],
            )
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            id: message.type === 'generate' ? message.id : undefined,
            message: error instanceof Error ? error.message : String(error),
        })
    }
}
