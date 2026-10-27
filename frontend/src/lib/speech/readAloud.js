// Read-aloud for lessons. Uses the natural on-device voice (Kokoro) when the learner has
// turned it on and it has finished loading; otherwise the browser's built-in voice, so the
// Listen button works for everyone straight away.

import { isKokoroSpeaking, pauseKokoro, resumeKokoro, speakWithKokoro, stopKokoro } from './kokoroClient'

let state = { status: 'idle', index: -1, total: 0, engine: null }
const listeners = new Set()
const setState = (next) => {
    state = { ...state, ...next }
    listeners.forEach((listener) => listener(state))
}
let token = 0

export const getReadAloudState = () => state

export function subscribeReadAloud(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export const isReadAloudSupported = () => typeof window !== 'undefined'
    && ('speechSynthesis' in window || typeof Worker !== 'undefined')

const VOICE_HINTS = ['natural', 'online', 'premium', 'enhanced', 'google', 'neural', 'siri']

function pickBrowserVoice() {
    if (!('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    const english = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'))
    const score = (voice) => {
        const name = (voice.name || '').toLowerCase()
        let points = 0
        if (voice.lang === 'en-GB') points += 100
        else if (voice.lang?.toLowerCase().startsWith('en-gb')) points += 90
        if (VOICE_HINTS.some((hint) => name.includes(hint))) points += 20
        if (name.includes('compact') || name.includes('espeak')) points -= 50
        return points
    }
    return [...english].sort((a, b) => score(b) - score(a))[0] || null
}

// Resolves the sentence being spoken, so stopping never leaves readAloud() waiting on a
// browser that doesn't fire an end event after cancel().
let finishBrowserSentence = null

function speakSentenceInBrowser(sentence, voice) {
    return new Promise((resolve) => {
        finishBrowserSentence = resolve
        const utterance = new SpeechSynthesisUtterance(sentence)
        utterance.lang = voice?.lang || 'en-GB'
        if (voice) utterance.voice = voice
        utterance.rate = 0.95
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.speak(utterance)
    })
}

/** Start reading. Replaces anything already being read. Resolves when finished or stopped. */
export async function readAloud(sentences) {
    stopReadAloud()
    if (!sentences.length) return
    const myToken = ++token
    setState({ status: 'speaking', index: 0, total: sentences.length, engine: null })

    const handledByKokoro = await speakWithKokoro(sentences, {
        onSentence: (index) => {
            if (myToken === token) setState({ index, engine: 'natural' })
        },
    })
    if (myToken !== token) return
    if (handledByKokoro) {
        setState({ status: 'idle', index: -1, total: 0, engine: null })
        return
    }

    if (!('speechSynthesis' in window)) {
        setState({ status: 'idle', index: -1, total: 0, engine: null })
        return
    }
    setState({ engine: 'browser' })
    const voice = pickBrowserVoice()
    for (let i = 0; i < sentences.length; i++) {
        if (myToken !== token) return
        setState({ index: i })
        await speakSentenceInBrowser(sentences[i], voice)
    }
    if (myToken === token) setState({ status: 'idle', index: -1, total: 0, engine: null })
}

export function stopReadAloud() {
    token++
    stopKokoro()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    finishBrowserSentence?.()
    finishBrowserSentence = null
    if (state.status !== 'idle') setState({ status: 'idle', index: -1, total: 0, engine: null })
}

export function pauseReadAloud() {
    if (state.status !== 'speaking') return
    if (isKokoroSpeaking()) pauseKokoro()
    else if ('speechSynthesis' in window) window.speechSynthesis.pause()
    setState({ status: 'paused' })
}

export function resumeReadAloud() {
    if (state.status !== 'paused') return
    resumeKokoro()
    if ('speechSynthesis' in window) window.speechSynthesis.resume()
    setState({ status: 'speaking' })
}
