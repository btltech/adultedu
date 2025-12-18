function safeJsonParse(value) {
    if (value === null || value === undefined) return { ok: true, value: null }
    if (typeof value !== 'string') return { ok: true, value }
    try {
        return { ok: true, value: JSON.parse(value) }
    } catch (error) {
        return { ok: false, value, error }
    }
}

function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
}

function parseJsonLoose(value) {
    const parsed = safeJsonParse(value)
    return parsed.ok ? parsed.value : value
}

function parseStringArray(value) {
    const parsed = safeJsonParse(value)
    if (!parsed.ok) return null
    if (!Array.isArray(parsed.value)) return null
    return parsed.value.map((v) => String(v))
}

function parseObject(value) {
    const parsed = safeJsonParse(value)
    if (!parsed.ok) return null
    if (!parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) return null
    return parsed.value
}

function findOptionIndex(options, target) {
    const t = normalizeText(target)
    if (!t) return -1
    return options.findIndex((o) => normalizeText(o) === t)
}

function resolveOptionText({ options, storedAnswer }) {
    if (!Array.isArray(options) || options.length === 0) return { ok: false, reason: 'no_options' }

    // Index (number)
    if (Number.isInteger(storedAnswer)) {
        const idx = storedAnswer
        if (idx >= 0 && idx < options.length) return { ok: true, index: idx, text: options[idx] }
        return { ok: false, reason: 'index_out_of_range' }
    }

    // Boolean (true_false)
    if (typeof storedAnswer === 'boolean') {
        const expected = storedAnswer ? 'true' : 'false'
        const idx = findOptionIndex(options, expected)
        if (idx >= 0) return { ok: true, index: idx, text: options[idx] }

        const idxTitle = findOptionIndex(options, storedAnswer ? 'true' : 'false')
        if (idxTitle >= 0) return { ok: true, index: idxTitle, text: options[idxTitle] }

        // Fallback: assume ["True","False"] order
        if (options.length === 2) return { ok: true, index: storedAnswer ? 0 : 1, text: options[storedAnswer ? 0 : 1] }
        return { ok: false, reason: 'boolean_no_match' }
    }

    // String: literal match first, then numeric index
    if (typeof storedAnswer === 'string') {
        const trimmed = storedAnswer.trim()
        const literalIdx = findOptionIndex(options, trimmed)
        if (literalIdx >= 0) return { ok: true, index: literalIdx, text: options[literalIdx] }

        if (/^\d+$/.test(trimmed)) {
            const idx = parseInt(trimmed, 10)
            if (idx >= 0 && idx < options.length) return { ok: true, index: idx, text: options[idx] }
        }

        // Strip quotes
        const stripped = trimmed.replace(/^["']|["']$/g, '').trim()
        if (stripped && stripped !== trimmed) {
            const strippedIdx = findOptionIndex(options, stripped)
            if (strippedIdx >= 0) return { ok: true, index: strippedIdx, text: options[strippedIdx] }
            if (/^\d+$/.test(stripped)) {
                const idx = parseInt(stripped, 10)
                if (idx >= 0 && idx < options.length) return { ok: true, index: idx, text: options[idx] }
            }
        }
    }

    // Float -> try literal text match
    if (typeof storedAnswer === 'number') {
        const idx = findOptionIndex(options, String(storedAnswer))
        if (idx >= 0) return { ok: true, index: idx, text: options[idx] }
    }

    return { ok: false, reason: 'no_match' }
}

function scoreOptionBased({ options, correctRaw, userAnswer }) {
    const resolved = resolveOptionText({ options, storedAnswer: correctRaw })
    if (!resolved.ok) return { ok: false, reason: resolved.reason || 'unresolved_correct_answer' }

    const correctText = resolved.text
    const correctIndex = resolved.index

    // User may submit index or text.
    if (Number.isInteger(userAnswer)) {
        return { ok: true, isCorrect: userAnswer === correctIndex, correctAnswer: correctText }
    }
    if (typeof userAnswer === 'string' && /^\d+$/.test(userAnswer.trim())) {
        const idx = parseInt(userAnswer.trim(), 10)
        if (!Number.isNaN(idx)) return { ok: true, isCorrect: idx === correctIndex, correctAnswer: correctText }
    }

    const isCorrect = normalizeText(userAnswer) === normalizeText(correctText)
    return { ok: true, isCorrect, correctAnswer: correctText }
}

function scoreOrdering({ options, correctRaw, userAnswer }) {
    const optionList = Array.isArray(options) ? options.map((o) => String(o)) : []
    if (optionList.length < 2) return { ok: false, reason: 'options_missing' }

    const correctParsed = parseJsonLoose(correctRaw)
    let correctOrderValues = null

    if (Array.isArray(correctParsed)) {
        if (correctParsed.every((v) => Number.isInteger(v))) {
            // Indices -> values
            const values = []
            for (const idx of correctParsed) {
                if (idx < 0 || idx >= optionList.length) return { ok: false, reason: 'correct_index_out_of_range' }
                values.push(optionList[idx])
            }
            correctOrderValues = values
        } else {
            // Assume value list
            correctOrderValues = correctParsed.map((v) => String(v))
        }
    }

    if (!correctOrderValues) return { ok: false, reason: 'correct_order_invalid' }

    let userValues = null
    if (Array.isArray(userAnswer)) {
        userValues = userAnswer.map((v) => String(v))
    } else if (typeof userAnswer === 'string') {
        const parsed = safeJsonParse(userAnswer)
        if (parsed.ok && Array.isArray(parsed.value)) userValues = parsed.value.map((v) => String(v))
    }

    if (!userValues) return { ok: false, reason: 'user_order_invalid' }
    if (userValues.length !== correctOrderValues.length) return { ok: true, isCorrect: false, correctAnswer: correctOrderValues }

    const isCorrect = userValues.every((v, i) => normalizeText(v) === normalizeText(correctOrderValues[i]))
    return { ok: true, isCorrect, correctAnswer: correctOrderValues }
}

function parseSliderConfig(options) {
    if (Array.isArray(options)) {
        const min = Number(options[0])
        const max = Number(options[1])
        const step = Number(options[2])
        const unit = options[3] === undefined || options[3] === null ? '' : String(options[3])
        return { min, max, step, unit }
    }
    return { min: 0, max: 100, step: 1, unit: '' }
}

function scoreSlider({ options, correctRaw, userAnswer, meta }) {
    const cfg = parseSliderConfig(options)
    const correctNum = Number(parseJsonLoose(correctRaw))
    const userNum = Number(typeof userAnswer === 'string' ? userAnswer.trim() : userAnswer)

    if (!Number.isFinite(correctNum) || !Number.isFinite(userNum)) {
        return { ok: true, isCorrect: false, correctAnswer: correctNum }
    }

    const range = Number.isFinite(cfg.max) && Number.isFinite(cfg.min) ? Math.abs(cfg.max - cfg.min) : 0
    const step = Number.isFinite(cfg.step) && cfg.step > 0 ? cfg.step : 1

    const explicitTol = Number(meta?.slider?.tolerance ?? meta?.sliderTolerance ?? meta?.tolerance)
    const tolFromRange = range > 0 ? range * 0.02 : 0.5
    const tolFromStep = step / 2
    const tolerance = Number.isFinite(explicitTol) && explicitTol > 0
        ? explicitTol
        : Math.max(tolFromStep, tolFromRange)

    const isCorrect = Math.abs(userNum - correctNum) <= tolerance
    return { ok: true, isCorrect, correctAnswer: correctNum, details: { tolerance, unit: cfg.unit } }
}

function scoreImageLabel({ correctRaw, assetsRaw, userAnswer }) {
    const correctObj = parseObject(correctRaw) || parseObject(assetsRaw?.answer)
    if (!correctObj) return { ok: false, reason: 'correct_mapping_missing' }

    let userObj = null
    if (userAnswer && typeof userAnswer === 'object' && !Array.isArray(userAnswer)) {
        userObj = userAnswer
    } else if (typeof userAnswer === 'string') {
        userObj = parseObject(userAnswer)
    }
    if (!userObj) return { ok: true, isCorrect: false, correctAnswer: correctObj }

    const keys = Object.keys(correctObj)
    if (keys.length === 0) return { ok: false, reason: 'correct_mapping_empty' }

    const isCorrect = keys.every((k) => normalizeText(userObj[k]) === normalizeText(correctObj[k]))
    return { ok: true, isCorrect, correctAnswer: correctObj }
}

function scoreMultiStep({ options, correctRaw, assetsRaw, userAnswer }) {
    // If this is a scaffolded multi-step question with steps, accept "Completed" for backward compatibility.
    const correctVal = parseJsonLoose(correctRaw)
    const assets = assetsRaw && typeof assetsRaw === 'object' ? assetsRaw : null
    const steps = Array.isArray(assets?.steps) ? assets.steps : null

    if (steps && steps.length > 0) {
        // If client sends legacy "Completed", accept only if expected is Completed.
        if (typeof userAnswer === 'string' && normalizeText(userAnswer) === 'completed') {
            return { ok: true, isCorrect: normalizeText(correctVal) === 'completed', correctAnswer: correctVal }
        }

        let payload = null
        if (userAnswer && typeof userAnswer === 'object') payload = userAnswer
        else if (typeof userAnswer === 'string') {
            const parsed = safeJsonParse(userAnswer)
            if (parsed.ok && parsed.value && typeof parsed.value === 'object') payload = parsed.value
        }

        const stepAnswers = payload?.stepAnswers
        if (!stepAnswers || typeof stepAnswers !== 'object') {
            return { ok: true, isCorrect: false, correctAnswer: correctVal }
        }

        const ok = steps.every((step, idx) => normalizeText(stepAnswers[idx]) === normalizeText(step?.answer))
        return { ok: true, isCorrect: ok, correctAnswer: correctVal }
    }

    // Otherwise treat multi_step with options as option-based (MCQ-like).
    if (Array.isArray(options) && options.length > 0) {
        return scoreOptionBased({ options, correctRaw: correctVal, userAnswer })
    }

    // Fallback: simple equality
    return { ok: true, isCorrect: normalizeText(userAnswer) === normalizeText(correctVal), correctAnswer: correctVal }
}

export function scoreQuestionAnswer({ question, userAnswer }) {
    const type = String(question?.type || 'mcq')

    const options = parseJsonLoose(question?.options)
    const correctRaw = question?.answer
    const assetsParsed = parseJsonLoose(question?.assets)
    const sourceMetaParsed = parseJsonLoose(question?.sourceMeta) || {}

    const meta = sourceMetaParsed && typeof sourceMetaParsed === 'object' ? sourceMetaParsed : {}

    if (type === 'ordering') {
        return scoreOrdering({ options, correctRaw, userAnswer })
    }

    if (type === 'slider') {
        return scoreSlider({ options, correctRaw, userAnswer, meta })
    }

    if (type === 'image_label') {
        const assetsObj = assetsParsed && typeof assetsParsed === 'object' ? assetsParsed : null
        return scoreImageLabel({ correctRaw, assetsRaw: assetsObj, userAnswer })
    }

    if (type === 'multi_step') {
        const assetsObj = assetsParsed && typeof assetsParsed === 'object' ? assetsParsed : null
        return scoreMultiStep({ options, correctRaw, assetsRaw: assetsObj, userAnswer })
    }

    // MCQ-like types (scenario with options behaves like MCQ in this app)
    if (type === 'mcq' || type === 'true_false' || type === 'scenario') {
        if (Array.isArray(options) && options.length > 0) {
            const correctVal = parseJsonLoose(correctRaw)
            return scoreOptionBased({ options, correctRaw: correctVal, userAnswer })
        }
    }

    // Fallback: short answer / anything else
    const correctVal = parseJsonLoose(correctRaw)
    const isCorrect = normalizeText(userAnswer) === normalizeText(correctVal)
    return { ok: true, isCorrect, correctAnswer: correctVal }
}

export function parseSourceMeta(sourceMeta) {
    const parsed = safeJsonParse(sourceMeta)
    if (!parsed.ok) return {}
    return parsed.value && typeof parsed.value === 'object' ? parsed.value : {}
}

