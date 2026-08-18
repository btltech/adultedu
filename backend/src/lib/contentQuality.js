export const REVIEW_STATUSES = ['draft', 'in_review', 'approved', 'legacy']
export const CONTENT_RISKS = ['standard', 'time_sensitive', 'regulated']

const REQUIRED_PUBLICATION_FIELDS = [
    ['sourceUrl', 'a primary source URL'],
    ['sourceTitle', 'a source title'],
    ['sourceCheckedAt', 'a source check date'],
    ['curriculumObjective', 'a curriculum objective'],
    ['reviewedBy', 'a reviewer'],
    ['reviewedAt', 'a review date'],
]

export const CONTENT_FIELD_NAMES = new Set([
    'topicId', 'lessonId', 'ukLevelId', 'type', 'prompt', 'options', 'answer',
    'explanation', 'difficulty', 'tags', 'imageUrl', 'assets', 'sourceMeta',
])

export function toDate(value) {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export function publicationReadinessIssues(question, now = new Date(), { allowLegacy = false } = {}) {
    const issues = []

    for (const [field, label] of REQUIRED_PUBLICATION_FIELDS) {
        // Historical public content has no claim of a named human review.
        // Source and curriculum provenance still remain mandatory.
        if (allowLegacy && question.reviewStatus === 'legacy' && ['reviewedBy', 'reviewedAt'].includes(field)) continue
        if (!question[field] || (typeof question[field] === 'string' && !question[field].trim())) {
            issues.push(`Add ${label} before publishing.`)
        }
    }

    if (!question.sourceUrl || !/^https:\/\//i.test(question.sourceUrl)) {
        issues.push('Use an HTTPS source URL before publishing.')
    }

    // `legacy` means content that was already public before the governance
    // workflow existed. It is not a claim of human approval; it simply keeps
    // the publication gate from rewriting the history of the live bank.
    if (question.reviewStatus !== 'approved' && !(allowLegacy && question.reviewStatus === 'legacy')) {
        issues.push('Set reviewStatus to approved before publishing (or legacy for existing public content).')
    }

    const sourceCheckedAt = toDate(question.sourceCheckedAt)
    const reviewedAt = toDate(question.reviewedAt)
    const reviewDueAt = toDate(question.reviewDueAt)

    if (sourceCheckedAt && sourceCheckedAt > now) {
        issues.push('The source check date cannot be in the future.')
    }
    if (reviewedAt && reviewedAt > now) {
        issues.push('The review date cannot be in the future.')
    }

    if (['time_sensitive', 'regulated'].includes(question.contentRisk)) {
        if (!reviewDueAt) {
            issues.push('Set a future review due date for time-sensitive or regulated content.')
        } else if (reviewDueAt <= now) {
            issues.push('The review due date has passed; re-check the source before publishing.')
        }
    }

    return [...new Set(issues)]
}

export function hasLiveContentChange(body) {
    return Object.keys(body).some((field) => CONTENT_FIELD_NAMES.has(field))
}

export function reviewDataFromBody(body) {
    const fields = [
        'sourceUrl', 'sourceTitle', 'sourceCheckedAt', 'curriculumObjective',
        'contentRisk', 'reviewStatus', 'reviewedBy', 'reviewedAt', 'reviewDueAt',
    ]
    const data = {}

    for (const field of fields) {
        if (body[field] === undefined) continue
        if (['sourceCheckedAt', 'reviewedAt', 'reviewDueAt'].includes(field)) {
            data[field] = body[field] === null ? null : new Date(body[field])
        } else {
            data[field] = body[field]
        }
    }

    return data
}
