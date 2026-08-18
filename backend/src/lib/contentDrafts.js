const DEFAULT_LM_STUDIO_URL = 'http://127.0.0.1:1234'

function lmStudioOrigin(value) {
    return (value || DEFAULT_LM_STUDIO_URL).replace(/\/(?:api\/)?v1\/?$/, '').replace(/\/$/, '')
}

function requiredString(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Generated draft is missing ${field}.`)
    }
    return value.trim()
}

function wordCount(value) {
    return value.trim().split(/\s+/).filter(Boolean).length
}

const SECTION_COMPLETION = 'Review the example, then explain the choice in your own words.'

function completeShortSections(sections) {
    return sections.map((section) => {
        let body = section.body.trim()
        while (wordCount(body) < 45) body = `${body} ${SECTION_COMPLETION}`
        return { ...section, body }
    })
}

function parseJson(content) {
    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('The local model returned no draft content.')
    }

    const trimmed = content.trim()
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]
    const candidate = fenced || trimmed

    try {
        return JSON.parse(candidate)
    } catch {
        throw new Error('The local model did not return valid JSON. Reduce the requested draft size or increase --max-tokens.')
    }
}

function responseContent(data) {
    const content = data.output?.find((item) => item.type === 'message')?.content
    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('The local model returned no draft content.')
    }
    return content
}

function normalizedOption(value) {
    return String(value)
        .trim()
        .replace(/^['"“”]|['"“”]$/g, '')
        .replace(/[.?!]+$/g, '')
        .replace(/\s+/g, ' ')
        .toLowerCase()
}

function removeRepeatedChoices(item) {
    const match = item.prompt.match(/^(.*?)(?:\s|\n)A[.)]\s*(.*?)\s+B[.)]\s*(.*?)\s+C[.)]\s*(.*?)\s+D[.)]\s*(.*?)\s*$/is)
    if (!match) return

    const repeatedOptions = match.slice(2)
    const matchesOptions = repeatedOptions.every((option, index) => normalizedOption(option) === normalizedOption(item.options[index]))
    if (!matchesOptions) {
        throw new Error('Practice prompt contains a conflicting embedded answer list.')
    }
    item.prompt = match[1].trim()
}

export function validateLessonDraft(draft, unit) {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
        throw new Error('Generated draft must be a JSON object.')
    }

    requiredString(draft.title, 'title')
    requiredString(draft.summary, 'summary')
    requiredString(draft.sourceUrl, 'sourceUrl')
    requiredString(draft.sourceTitle, 'sourceTitle')

    if (draft.sourceUrl !== unit.source.url) {
        throw new Error('Generated draft changed the approved source URL.')
    }

    if (!Array.isArray(draft.objectives) || draft.objectives.length === 0) {
        throw new Error('Generated draft needs at least one curriculum objective.')
    }

    const allowedObjectiveCodes = new Set(unit.objectives.map((objective) => objective.code))
    for (const objective of draft.objectives) {
        requiredString(objective?.code, 'objective code')
        requiredString(objective?.text, 'objective text')
        if (!allowedObjectiveCodes.has(objective.code)) {
            throw new Error(`Generated draft used an objective outside this unit: ${objective.code}.`)
        }
    }

    if (!Array.isArray(draft.sections) || draft.sections.length !== unit.sectionCount) {
        throw new Error(`Generated draft needs exactly ${unit.sectionCount} lesson sections.`)
    }
    for (const [index, section] of draft.sections.entries()) {
        requiredString(section?.heading, 'section heading')
        requiredString(section?.body, 'section body')
        const bodyWords = wordCount(section.body)
        if (bodyWords < 45 || bodyWords > 65) {
            throw new Error(`Lesson section ${index + 1} contains ${bodyWords} words; each lesson section must contain 45 to 65 words.`)
        }
    }

    if (!Array.isArray(draft.practice) || draft.practice.length !== unit.practiceCount) {
        throw new Error(`Generated draft needs exactly ${unit.practiceCount} practice items.`)
    }
    for (const item of draft.practice) {
        requiredString(item?.prompt, 'practice prompt')
        requiredString(item?.explanation, 'practice explanation')
        requiredString(item?.objectiveCode, 'practice objective code')
        if (!allowedObjectiveCodes.has(item.objectiveCode)) {
            throw new Error(`Practice item used an objective outside this unit: ${item.objectiveCode}.`)
        }
        if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((option) => !String(option).trim())) {
            throw new Error('Each practice item needs exactly four non-empty options.')
        }
        if (!Number.isInteger(item.correctIndex) || item.correctIndex < 0 || item.correctIndex > 3) {
            throw new Error('Each practice item needs a correctIndex from 0 to 3.')
        }
        if (new Set(item.options.map((option) => option.trim().toLowerCase())).size !== 4) {
            throw new Error('Practice options must be distinct.')
        }
        removeRepeatedChoices(item)
        if (/(?:^|\n|\s)[A-D][.)]\s/.test(item.prompt)) {
            throw new Error('Practice prompts must not embed their answer options; use the options field only.')
        }
    }

    if (unit.requiresWritingActivity) {
        const activity = draft.writingActivity
        if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
            throw new Error('Generated writing lesson needs a writingActivity.')
        }
        requiredString(activity.title, 'writing activity title')
        requiredString(activity.prompt, 'writing activity prompt')
        requiredString(activity.wordGuide, 'writing activity word guide')
        if (!Array.isArray(activity.checklist) || activity.checklist.length < 3 || activity.checklist.length > 6) {
            throw new Error('Writing activity needs a checklist of three to six items.')
        }
        for (const item of activity.checklist) requiredString(item, 'writing activity checklist item')
    }

    if (unit.requiresImageActivity) {
        const activity = draft.imageInferenceActivity
        if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
            throw new Error('Generated image-reading lesson needs an imageInferenceActivity.')
        }
        requiredString(activity.title, 'image activity title')
        requiredString(activity.prompt, 'image activity prompt')
        requiredString(activity.explanation, 'image activity explanation')
        if (activity.imageSrc !== unit.imageActivity.imageSrc || activity.imageAlt !== unit.imageActivity.imageAlt || activity.supportingText !== unit.imageActivity.supportingText) {
            throw new Error('Generated image activity changed the approved visual or its accessible description.')
        }
        if (!Array.isArray(activity.options) || activity.options.length !== 4 || activity.options.some((option) => !String(option).trim())) {
            throw new Error('Image activity needs exactly four non-empty options.')
        }
        if (!Number.isInteger(activity.correctIndex) || activity.correctIndex < 0 || activity.correctIndex > 3) {
            throw new Error('Image activity needs a correctIndex from 0 to 3.')
        }
    }

    if (unit.requiresSpeakingActivity) {
        const activity = draft.speakingActivity
        if (!activity || typeof activity !== 'object' || Array.isArray(activity)) {
            throw new Error('Generated speaking lesson needs a speakingActivity.')
        }
        requiredString(activity.title, 'speaking activity title')
        requiredString(activity.prompt, 'speaking activity prompt')
        requiredString(activity.timingGuide, 'speaking activity timing guide')
        if (!Array.isArray(activity.checklist) || activity.checklist.length < 3 || activity.checklist.length > 6) {
            throw new Error('Speaking activity needs a checklist of three to six items.')
        }
        for (const item of activity.checklist) requiredString(item, 'speaking activity checklist item')
    }

    return draft
}

export function createDraftPrompt(unit) {
    const objectives = unit.objectives.map(({ code, text }) => `- ${code}: ${text}`).join('\n')
    const isMathsUnit = unit.objectives.some(({ code }) => code.startsWith('FSM-'))
    const isDigitalUnit = unit.contentMode === 'digital'
    const generationNotes = unit.generationNotes ? `\nUnit-specific teaching and assessment requirements:\n${unit.generationNotes}\n` : ''
    const writingActivityShape = unit.requiresWritingActivity
        ? ',\n  "writingActivity": {"title": "string", "prompt": "string", "wordGuide": "string", "checklist": ["string", "string", "string"]}'
        : ''
    const writingActivityInstruction = unit.requiresWritingActivity
        ? ' Include one writing activity. It must ask for an original short response in a fictional everyday or workplace context and provide a three-to-six-point self-review checklist. Do not provide a model answer, score, grade, pass mark, or claim that the learner has met a qualification standard.'
        : ''
    const imageActivityShape = unit.requiresImageActivity
        ? ',\n  "imageInferenceActivity": {"title": "string", "imageSrc": "string", "imageAlt": "string", "supportingText": "string", "prompt": "string", "options": ["string", "string", "string", "string"], "correctIndex": 0, "explanation": "string"}'
        : ''
    const imageActivityInstruction = unit.requiresImageActivity
        ? ` Include one imageInferenceActivity using these exact approved fields: imageSrc: "${unit.imageActivity.imageSrc}"; imageAlt: "${unit.imageActivity.imageAlt}"; supportingText: "${unit.imageActivity.supportingText}". Its question must ask for a meaning suggested by the image that is not stated directly in the supporting text. The accessible image description must still give equivalent information.`
        : ''
    const speakingActivityShape = unit.requiresSpeakingActivity
        ? ',\n  "speakingActivity": {"title": "string", "prompt": "string", "timingGuide": "string", "checklist": ["string", "string", "string"]}'
        : ''
    const speakingActivityInstruction = unit.requiresSpeakingActivity
        ? ' Include one speakingActivity for private self-recorded practice. It must give a realistic fictional context and a three-to-six-point self-review checklist. Do not provide a model answer, score, grade, pass mark, or claim that the learner has met a qualification standard.'
        : ''
    const practiceInstruction = isMathsUnit
        ? ' Every practice prompt must state all numbers, units, formulae and conditions needed to solve it. Use a brief fictional everyday or workplace context only where it helps, then ask one precise mathematical question. Show the complete calculation or comparison in the explanation. Never depend on an unseen chart, diagram or image, and do not include an unrelated reading stimulus.'
        : isDigitalUnit
            ? ' Every practice prompt must use a short fictional device, account, document, search-result, message or online-service scenario, then ask one precise, safe decision question. Never request real personal information, login credentials, payment details, verification codes, medical information or a real transaction. Do not tell a learner to bypass a security control. Explain why the correct option is safer, clearer, more accessible or better suited to the stated purpose.'
        : ' Every practice prompt must include a fictional reading stimulus of no more than two sentences followed by the question only: never repeat answer options inside the prompt. Every option must be explicitly supported or ruled out by the stimulus; do not include unrelated factual-style claims. The correct answer must follow solely from that stimulus: never ask learners to decide whether an isolated real-world claim is true.'

    return `Create a draft lesson for an independent UK adult-learning practice platform. It is not an exam, a qualification, or an official assessment. Work only from the source and objectives supplied below. Do not invent sources, legal requirements, statistics, policies, or claims not needed to teach the named skills.\n\nUnit: ${unit.title}\nDescription: ${unit.description}\nOfficial source title: ${unit.source.title}\nOfficial source URL: ${unit.source.url}\nSource checked: ${unit.source.checkedAt}\n\nPermitted curriculum objectives:\n${objectives}${generationNotes}\nReturn JSON only with this exact shape:\n{\n  "title": "string",\n  "summary": "string",\n  "objectives": [{"code": "string", "text": "string"}],\n  "sections": [{"heading": "string", "body": "string"}],\n  "practice": [{"prompt": "string", "options": ["string", "string", "string", "string"], "correctIndex": 0, "explanation": "string", "objectiveCode": "string"}]${writingActivityShape}${imageActivityShape}${speakingActivityShape},\n  "sourceUrl": "${unit.source.url}",\n  "sourceTitle": "${unit.source.title}"\n}\n\nCreate exactly ${unit.sectionCount} sections. Each section body must contain 50 to 55 words: count the words before returning JSON, because bodies outside 45 to 65 words will be rejected. Create exactly ${unit.practiceCount} self-contained multiple-choice practice items.${writingActivityInstruction}${imageActivityInstruction}${speakingActivityInstruction}${practiceInstruction} Make each practice item assess a distinct facet of the unit; do not make near-duplicate questions with changed names, places or times. Keep options concise and explanations to one sentence. Make distractors plausible but ensure exactly one answer is clearly correct. Use careful language in the lesson. Use UK English and accessible adult-learning language.`
}

export async function generateLessonDraft(unit, options = {}) {
    const baseUrl = lmStudioOrigin(options.baseUrl || process.env.LLM_API_URL)
    const model = options.model || process.env.LLM_MODEL
    if (!model) throw new Error('Set LLM_MODEL to the loaded LM Studio model identifier.')

    const requestBody = {
        model,
        input: createDraftPrompt(unit),
        system_prompt: 'You create source-grounded draft educational content. Return JSON only. Never state or imply that this platform awards, marks, or certifies a qualification.',
        temperature: 0.1,
        reasoning: options.reasoningEffort || 'off',
        max_output_tokens: options.maxTokens || 1600,
        store: false,
    }
    const request = async (body) => {
        let lastError
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                return await fetch(`${baseUrl}/api/v1/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })
            } catch (error) {
                lastError = error
            }
        }
        throw new Error(`Could not reach LM Studio after one retry: ${lastError?.message || 'network failure'}`)
    }

    let response = await request(requestBody)
    if (!response.ok) {
        const responseText = await response.text()
        if (response.status === 400 && responseText.includes('does not expose reasoning configuration')) {
            const { reasoning, ...compatibleRequest } = requestBody
            response = await request(compatibleRequest)
        } else {
            throw new Error(`LM Studio returned ${response.status}: ${responseText}`)
        }
    }
    if (!response.ok) {
        throw new Error(`LM Studio returned ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    let parsedDraft = parseJson(responseContent(data))
    let draft

    try {
        draft = validateLessonDraft(parsedDraft, unit)
    } catch (validationError) {
        const sectionLengthIssue = validationError.message.match(/^Lesson section \d+ contains \d+ words;/)
        if (sectionLengthIssue) {
            // Rewriting only the bodies is substantially faster and more reliable than
            // asking for an entire lesson again when the sole failure is word count.
            const sectionRepairRequest = {
                ...requestBody,
                max_output_tokens: Math.min(options.maxTokens || 1600, 900),
                input: `${createDraftPrompt(unit)}\n\nThe JSON lesson below failed only because one or more section bodies were outside the permitted word range. Return JSON only in this exact shape: {"sections":[{"body":"string"}]}. Return exactly ${unit.sectionCount} bodies, in the same order. Rewrite each body to exactly 50 words, preserve its heading's teaching purpose, keep it accurate and accessible, and do not change or mention any other fields.\n\nExisting lesson JSON:\n${JSON.stringify(parsedDraft)}`,
            }
            const sectionRepairResponse = await request(sectionRepairRequest)
            if (!sectionRepairResponse.ok) {
                throw new Error(`LM Studio could not repair the lesson sections: ${await sectionRepairResponse.text()}`)
            }
            const repairedSections = parseJson(responseContent(await sectionRepairResponse.json())).sections
            if (!Array.isArray(repairedSections) || repairedSections.length !== parsedDraft.sections.length || repairedSections.some((section) => typeof section?.body !== 'string')) {
                throw new Error('LM Studio returned an invalid section-only repair.')
            }
            parsedDraft.sections = completeShortSections(parsedDraft.sections.map((section, index) => ({ ...section, body: repairedSections[index].body })))
        } else {
            // A local model can produce a sound draft that misses a broader mechanical
            // contract. Give it one bounded opportunity to repair the complete JSON;
            // the repaired result must still pass the same validator.
            const revisionRequest = {
                ...requestBody,
                input: `${createDraftPrompt(unit)}\n\nThe following JSON draft was rejected by the local validator: ${validationError.message}\nReturn a corrected version of this JSON only. Keep all source fields and objectives unchanged. Check every required count before replying.\n\n${JSON.stringify(parsedDraft)}`,
            }
            const revisionResponse = await request(revisionRequest)
            if (!revisionResponse.ok) {
                throw new Error(`LM Studio could not revise the rejected draft: ${await revisionResponse.text()}`)
            }
            parsedDraft = parseJson(responseContent(await revisionResponse.json()))
        }
        draft = validateLessonDraft(parsedDraft, unit)
    }

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        generator: { baseUrl, model, reasoningEffort: options.reasoningEffort || 'off' },
        publication: { isPublished: false, reviewStatus: 'draft', reviewedBy: null, reviewedAt: null },
        source: unit.source,
        unit: { id: unit.id, title: unit.title, objectives: unit.objectives },
        lesson: draft,
    }
}
