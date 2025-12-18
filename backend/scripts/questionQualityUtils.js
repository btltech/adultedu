import crypto from 'crypto'

const HYPHENS_REGEX = /[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g

export function safeJsonParse(value) {
    if (value === null || value === undefined) return { ok: true, value: null }
    if (typeof value !== 'string') return { ok: true, value }
    try {
        return { ok: true, value: JSON.parse(value) }
    } catch (error) {
        return { ok: false, value, error }
    }
}

export function normalizeTextLoose(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(HYPHENS_REGEX, '-')
        .replace(/\u2018|\u2019/g, "'")
        .replace(/\u201C|\u201D/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
}

export function normalizeTextStrict(value) {
    return normalizeTextLoose(value).toLowerCase()
}

export function extractAnswerCandidateFromExplanation(explanation) {
    const text = normalizeTextLoose(explanation)
    if (!text) return null

    const tailMatch = text.match(/(?:answer\s*[:=]|=| is)\s*([^\n.!?;:]+)\s*[.!?]?$/i)
    if (tailMatch) {
        const candidate = tailMatch[1].trim()
        if (candidate.includes(',')) return candidate.split(',').at(-1)?.trim() || candidate
        return { candidate, source: 'phrase' }
    }

    const lastNumber = text.match(/(-?\d+(?:\.\d+)?)\s*[.!?]?$/)
    if (lastNumber) return { candidate: lastNumber[1], source: 'number' }

    return null
}

export function findOptionMatch(options, target) {
    const targetNorm = normalizeTextStrict(target)
    if (!targetNorm) return null

    for (const option of options) {
        if (normalizeTextStrict(option) === targetNorm) return option
    }
    return null
}

export function dedupeExactOptions(options) {
    const seen = new Set()
    const deduped = []
    for (const option of options) {
        const key = normalizeTextLoose(option)
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(option)
    }
    return deduped
}

export function canonicalizeMcqAnswer({ options, answerRaw, explanation }) {
    const answerParsed = safeJsonParse(answerRaw)
    if (!answerParsed.ok) return { ok: false, reason: 'answer_invalid_json' }

    const optionsParsed = safeJsonParse(options)
    if (!optionsParsed.ok) return { ok: false, reason: 'options_invalid_json' }
    if (!Array.isArray(optionsParsed.value) || optionsParsed.value.length < 2) {
        return { ok: false, reason: 'options_invalid_or_too_short' }
    }

    const optionList = optionsParsed.value
    const answerValue = answerParsed.value
    let resolvedStored = null

    // 1) If answer is an integer index, treat it as 0-based.
    if (Number.isInteger(answerValue)) {
        const idx = answerValue
        if (idx >= 0 && idx < optionList.length) {
            resolvedStored = optionList[idx]
        }
    }

    // 2) If answer is a numeric string, first treat it as literal option text, then as index.
    if (typeof answerValue === 'string') {
        const asText = findOptionMatch(optionList, answerValue)
        if (asText) resolvedStored = asText

        const numeric = answerValue.trim()
        if (/^\d+$/.test(numeric)) {
            const idx = parseInt(numeric, 10)
            if (idx >= 0 && idx < optionList.length) resolvedStored = optionList[idx]
            // Some generators may have used 1-based indices.
            if (!resolvedStored && idx > 0 && idx <= optionList.length) resolvedStored = optionList[idx - 1]
        }

        // 3) Strip wrapping quotes and retry.
        const stripped = answerValue.trim().replace(/^["']|["']$/g, '')
        const strippedMatch = findOptionMatch(optionList, stripped)
        if (strippedMatch) resolvedStored = strippedMatch
    }

    // 4) If answer is a number but NOT a valid in-range index, try matching to option text.
    // This avoids misreading an index like 0 as the literal option "0".
    if (!resolvedStored && typeof answerValue === 'number') {
        const asText = findOptionMatch(optionList, String(answerValue))
        if (asText) resolvedStored = asText
    }

    const fromExplanation = extractAnswerCandidateFromExplanation(explanation)
    const explanationCandidate = fromExplanation?.candidate ?? null
    const explanationSource = fromExplanation?.source ?? null
    const explanationMatch = explanationCandidate ? findOptionMatch(optionList, explanationCandidate) : null

    // If the explanation clearly states an option and it differs from the stored answer, prefer it.
    if (explanationMatch && resolvedStored && normalizeTextStrict(explanationMatch) !== normalizeTextStrict(resolvedStored)) {
        // Avoid overriding based on a weak heuristic (last-number fallback).
        if (explanationSource === 'phrase') {
            return {
                ok: true,
                answer: explanationMatch,
                stored: resolvedStored,
                usedExplanation: true,
                reason: 'explanation_contradiction',
            }
        }
    }

    if (resolvedStored) return { ok: true, answer: resolvedStored, stored: resolvedStored }

    // 5) Use explanation-derived candidate if it matches an option.
    if (explanationMatch) {
        return { ok: true, answer: explanationMatch, stored: null, usedExplanation: true, reason: 'explanation_fallback' }
    }

    return { ok: false, reason: 'no_match' }
}

export function stableReportId(prefix = 'report') {
    return `${prefix}-${crypto.randomBytes(6).toString('hex')}`
}
