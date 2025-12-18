import { z } from 'zod'

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.safeParse(req.body)
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation Error',
                message: parsed.error.issues[0].message, // Return the first error message
                details: parsed.error.issues
            })
        }
        // Replace body with parsed data (strips unknown fields if schema is strict, or just ensures types)
        req.body = parsed.data
        next()
    } catch (error) {
        next(error)
    }
}

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
})

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
})

const optionArraySchema = z.array(z.string().min(1)).min(2, 'Provide at least two options for MCQ')
const trueFalseAnswerSchema = z.union([
    z.boolean(),
    z.enum(['true', 'false']),
    z.literal(0),
    z.literal(1),
    z.enum(['0', '1']),
])

const questionBaseSchema = z.object({
    topicId: z.string().uuid(),
    ukLevelId: z.string().uuid(),
    type: z.enum(['mcq', 'true_false', 'short_answer', 'multi_step', 'scenario', 'ordering', 'slider', 'image_label']).default('mcq'),
    prompt: z.string().min(5, 'Prompt is required'),
    options: z.any().optional(),
    answer: z.any().optional(),
    explanation: z.string().min(5, 'Explanation is required'),
    difficulty: z.number().min(1).max(5).optional(),
    isPublished: z.boolean().optional(),
    tags: z.any().optional(),
    imageUrl: z.string().nullable().optional(),
    assets: z.any().nullable().optional(),
    sourceMeta: z.any().optional()
})

const validateQuestionFields = (val, ctx, { requireAnswer = false, requireOptionsForMcq = false } = {}) => {
    const type = val.type || 'mcq'

    // Validate options for MCQ and Scenario (if they behave like MCQ)
    let hasOptions = false;
    if (val.options !== undefined && val.options !== null) {
        // If it's a string (JSON), try to parse it first if coming from DB, but usually API sends strict JSON?
        // Zod validation runs on parsed body, so options should be array or undefined.
        // But schema says z.any().optional().
        if (Array.isArray(val.options)) {
            if (type === 'slider') {
                // Slider options are numeric config: [min, max, step, unit?]
                const min = Number(val.options[0])
                const max = Number(val.options[1])
                const step = Number(val.options[2])
                if (!Number.isFinite(min) || !Number.isFinite(max)) {
                    ctx.addIssue({ code: 'custom', message: 'Slider options must include numeric min and max' })
                } else if (max <= min) {
                    ctx.addIssue({ code: 'custom', message: 'Slider max must be greater than min' })
                }
                if (!Number.isFinite(step) || step <= 0) {
                    ctx.addIssue({ code: 'custom', message: 'Slider step must be a positive number' })
                }
                hasOptions = true
            } else if (type === 'multi_step' && val.options.length < 2) {
                // Scaffolded multi_step can use assets.steps and does not need MCQ options.
                hasOptions = false
            } else {
                const optsCheck = optionArraySchema.safeParse(val.options)
                if (!optsCheck.success) {
                    ctx.addIssue({
                        code: 'custom',
                        message: optsCheck.error.issues[0].message
                    })
                } else {
                    hasOptions = true;
                }
            }
        }
    }

    if (type === 'mcq' && !hasOptions && requireOptionsForMcq) {
        ctx.addIssue({
            code: 'custom',
            message: 'Options are required for MCQ questions'
        })
    }

    if (type === 'ordering' && !hasOptions) {
        ctx.addIssue({ code: 'custom', message: 'Options are required for ordering questions' })
    }

    if (type === 'image_label' && !hasOptions && !val.assets) {
        ctx.addIssue({ code: 'custom', message: 'Provide label options or assets for image labeling questions' })
    }

    // Validate answer presence
    if (requireAnswer && val.answer === undefined) {
        ctx.addIssue({
            code: 'custom',
            message: 'Answer is required'
        })
    }

    // Type-specific answer validation
    if (val.answer !== undefined) {
        if (type === 'true_false') {
            const tf = trueFalseAnswerSchema.safeParse(val.answer)
            if (!tf.success) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Answer must be true, false, "true", or "false" for true/false questions'
                })
            }
        }
        if (type === 'short_answer') {
            if (typeof val.answer !== 'string' || val.answer.trim().length === 0) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Answer must be a non-empty string for short answers'
                })
            }
        }
        if (type === 'multi_step') {
            // Either scaffolded (assets.steps + "Completed") or MCQ-style (options + index)
            if (val.assets && typeof val.assets === 'object' && Array.isArray(val.assets.steps)) {
                if (typeof val.answer !== 'string' || val.answer.trim().length === 0) {
                    ctx.addIssue({ code: 'custom', message: 'Scaffolded multi_step requires a string answer (e.g. \"Completed\")' })
                }
            }
        }
        if (type === 'scenario') {
            // Scenario can be MCQ-like (index) or Open (rubric)
            if (hasOptions) {
                // Should be index
            } else {
                // Should have rubric
                if (typeof val.answer !== 'object' || val.answer === null || !val.answer.rubric) {
                    // Allow simple string answer too if it's just a simple scenario?
                    // Enforce rubric for open ended
                    ctx.addIssue({
                        code: 'custom',
                        message: 'Scenario answers must be an index (if options provided) or include a rubric object'
                    })
                }
            }
        }

        if (type === 'ordering') {
            if (!Array.isArray(val.answer) || val.answer.length < 2) {
                ctx.addIssue({ code: 'custom', message: 'Ordering answer must be an array describing the correct order' })
            }
        }

        if (type === 'slider') {
            const num = typeof val.answer === 'number' ? val.answer : Number(String(val.answer ?? '').trim())
            if (!Number.isFinite(num)) {
                ctx.addIssue({ code: 'custom', message: 'Slider answer must be a number' })
            }
        }

        if (type === 'image_label') {
            if (typeof val.answer !== 'object' || val.answer === null || Array.isArray(val.answer)) {
                ctx.addIssue({ code: 'custom', message: 'Image label answer must be an object mapping targetId -> label' })
            }
            if (val.assets && typeof val.assets === 'object' && val.assets !== null) {
                if (!Array.isArray(val.assets.targets) || val.assets.targets.length === 0) {
                    ctx.addIssue({ code: 'custom', message: 'Image label assets.targets must be a non-empty array' })
                }
            }
        }
    }

    // Validate SourceMeta strings
    if (val.sourceMeta !== undefined && val.sourceMeta !== null) {
        const hints = val.sourceMeta.hints
        if (hints && (!Array.isArray(hints) || !hints.every(h => typeof h === 'string'))) {
            ctx.addIssue({ code: 'custom', message: 'sourceMeta.hints must be an array of strings' })
        }
        const steps = val.sourceMeta.solutionSteps
        if (steps && (!Array.isArray(steps) || !steps.every(s => typeof s === 'string'))) {
            ctx.addIssue({ code: 'custom', message: 'sourceMeta.solutionSteps must be an array of strings' })
        }
    }

    // Index validation (MCQ logic)
    // If we have options, and answer is provided, check if it's a valid index
    if (hasOptions && val.answer !== undefined) {
        let indexVal = null;
        if (typeof val.answer === 'number') indexVal = val.answer;
        else if (typeof val.answer === 'string' && /^\d+$/.test(val.answer)) {
            indexVal = parseInt(val.answer, 10);
        }

        if (indexVal !== null) {
            if (indexVal < 0 || indexVal >= val.options.length) {
                ctx.addIssue({
                    code: 'custom',
                    message: `Answer index ${indexVal} is out of range for ${val.options.length} options`
                })
            }
        }
    }
}

export const questionCreateSchema = questionBaseSchema.superRefine((val, ctx) => {
    validateQuestionFields(val, ctx, { requireAnswer: true, requireOptionsForMcq: val.type === 'mcq' || !val.type })
})

export const questionUpdateSchema = questionBaseSchema.partial().superRefine((val, ctx) => {
    validateQuestionFields(val, ctx, { requireAnswer: false, requireOptionsForMcq: false })
})
