// Turns lesson content into text a voice can read well. Pure functions, no browser APIs.

// Capital-letter words that are said as a word, not spelled out.
const SPOKEN_AS_WORDS = new Set(['UK', 'NASA', 'STEM', 'UCAS', 'PIN', 'SIM', 'WIFI', 'OFSTED'])
const ACRONYM_PRONUNCIATION = { UCAS: 'You-cass', ESOL: 'Ee-sol', OFSTED: 'Off-sted' }

const CALLOUT_LABELS = { tip: 'Tip', warning: 'Watch for this' }

const spellOut = (word) => word.split('').join(' ')

function expandAcronyms(text) {
    return text.replace(/\b[A-Z]{2,6}\b/g, (word) => {
        if (ACRONYM_PRONUNCIATION[word]) return ACRONYM_PRONUNCIATION[word]
        if (word === 'UK') return 'U K'
        if (SPOKEN_AS_WORDS.has(word)) return word
        return spellOut(word)
    })
}

function expandSymbols(text) {
    return text
        .replace(/£\s?(\d[\d,]*(?:\.\d+)?)/g, (_, amount) => `${amount.replace(/,/g, '')} pounds`)
        .replace(/(\d+(?:\.\d+)?)\s?%/g, '$1 percent')
        .replace(/(\d)\s?[x×]\s?(\d)/g, '$1 times $2')
        .replace(/×/g, ' times ')
        .replace(/÷/g, ' divided by ')
        .replace(/(\d)\s?\/\s?(\d)/g, '$1 over $2')
        .replace(/(\w)²/g, '$1 squared')
        .replace(/(\w)³/g, '$1 cubed')
        .replace(/≤/g, ' is less than or equal to ')
        .replace(/≥/g, ' is greater than or equal to ')
        .replace(/ = /g, ' equals ')
        .replace(/(\d)\s?\+\s?(\d)/g, '$1 plus $2')
        .replace(/(\d)\s?[−–]\s?(\d)/g, '$1 minus $2')
        .replace(/&/g, ' and ')
        .replace(/e\.g\./gi, 'for example')
        .replace(/i\.e\./gi, 'that is')
}

function stripFormatting(text) {
    return text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\$([^$]+)\$/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/https?:\/\/\S+/g, ' link ')
        .replace(/[*_#>]+/g, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/** Make one piece of text speakable. */
export function toSpeakable(text) {
    if (typeof text !== 'string') return ''
    return expandAcronyms(expandSymbols(stripFormatting(text))).replace(/\s+/g, ' ').trim()
}

/** Split into sentences so playback can start quickly and be skipped through. */
export function splitSentences(text) {
    const parts = text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean)
    return parts.length ? parts : (text.trim() ? [text.trim()] : [])
}

const withStop = (text) => (/[.!?:]$/.test(text) ? text : `${text}.`)

/**
 * Lesson content blocks -> ordered sentences to read aloud.
 * Code, interactive widgets and activities (which have their own controls) are skipped.
 */
export function lessonToSentences(lesson) {
    const sentences = []
    const add = (text) => {
        const speakable = toSpeakable(text)
        if (speakable) sentences.push(...splitSentences(withStop(speakable)))
    }

    add(lesson?.title)
    add(lesson?.summary)
    for (const block of lesson?.contentBlocks || []) {
        switch (block?.type) {
            case 'heading':
            case 'subheading':
                add(block.content)
                break
            case 'paragraph':
                add(block.content)
                break
            case 'list':
                for (const item of block.items || []) add(item)
                break
            case 'callout':
                add(`${CALLOUT_LABELS[block.variant] || 'Key idea'}: ${block.content ?? ''}`)
                break
            default:
                break
        }
    }
    return sentences
}
