export const LEARNER_EXPORT_FORMAT = 'adultedu-learning-data'
export const LEARNER_EXPORT_VERSION = 1

const MAX_COLLECTION_LENGTH = 10_000
const MAX_TEXT_LENGTH = 2_000

function text(value, max = MAX_TEXT_LENGTH) {
    return typeof value === 'string' ? value.slice(0, max) : ''
}

function isoDate(value, fallback = new Date()) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString()
}

function array(value) {
    return Array.isArray(value) ? value.slice(0, MAX_COLLECTION_LENGTH) : []
}

function record(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function baseProgress(entry) {
    return {
        trackId: text(entry.trackId, 100),
        trackSlug: text(entry.trackSlug, 160),
        trackTitle: text(entry.trackTitle, 300),
        topicId: text(entry.topicId, 100),
        topicTitle: text(entry.topicTitle, 300),
        updatedAt: isoDate(entry.updatedAt || entry.createdAt),
    }
}

export function sanitizeLearnerExport(payload) {
    if (!payload || typeof payload !== 'object') throw Object.assign(new Error('Learning data must be an object.'), { statusCode: 400 })
    if (payload.format !== LEARNER_EXPORT_FORMAT || payload.version !== LEARNER_EXPORT_VERSION) {
        throw Object.assign(new Error('Unsupported AdultEdu learning-data format.'), { statusCode: 400 })
    }

    const data = record(payload.data)
    return {
        format: LEARNER_EXPORT_FORMAT,
        version: LEARNER_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
            learner: data.learner ? {
                id: 'current',
                localLearnerId: text(data.learner.localLearnerId, 120),
                schemaVersion: 1,
                createdAt: isoDate(data.learner.createdAt),
                updatedAt: isoDate(data.learner.updatedAt),
            } : null,
            lessonProgress: array(data.lessonProgress).map((entry) => ({
                ...baseProgress(record(entry)),
                lessonId: text(entry.lessonId, 100),
                lessonTitle: text(entry.lessonTitle, 300),
                completed: !!entry.completed,
                startedAt: isoDate(entry.startedAt || entry.updatedAt),
                completedAt: entry.completed ? isoDate(entry.completedAt || entry.updatedAt) : null,
                totalLessons: Math.max(0, Math.min(10_000, Number(entry.totalLessons) || 0)),
            })).filter((entry) => entry.lessonId && entry.trackId),
            pathwayProgress: array(data.pathwayProgress).map((entry) => ({
                ...baseProgress(record(entry)),
                currentLessonId: text(entry.currentLessonId, 100),
                currentLessonTitle: text(entry.currentLessonTitle, 300),
                lastRoute: text(entry.lastRoute, 500),
                completedLessonIds: [...new Set(array(entry.completedLessonIds).map((id) => text(id, 100)).filter(Boolean))],
                totalLessons: Math.max(0, Math.min(10_000, Number(entry.totalLessons) || 0)),
                quizAttemptCount: Math.max(0, Math.min(1_000_000, Number(entry.quizAttemptCount) || 0)),
                createdAt: isoDate(entry.createdAt || entry.updatedAt),
            })).filter((entry) => entry.trackId),
            quizAttempts: array(data.quizAttempts).map((entry) => ({
                id: text(entry.id, 120),
                quizId: text(entry.quizId || entry.topicId, 100),
                questionId: text(entry.questionId, 100),
                topicId: text(entry.topicId, 100),
                trackId: text(entry.trackId, 100),
                trackSlug: text(entry.trackSlug, 160),
                trackTitle: text(entry.trackTitle, 300),
                topicTitle: text(entry.topicTitle, 300),
                answer: entry.answer,
                isCorrect: !!entry.isCorrect,
                explanation: text(entry.explanation, 5_000),
                correctAnswer: entry.correctAnswer,
                timeSpentSec: Math.max(0, Math.min(86_400, Number(entry.timeSpentSec) || 0)) || null,
                createdAt: isoDate(entry.createdAt),
                updatedAt: isoDate(entry.updatedAt || entry.createdAt),
            })).filter((entry) => entry.id && entry.questionId),
            bookmarks: array(data.bookmarks).map((entry) => ({
                itemId: text(entry.itemId, 100),
                type: text(entry.type, 50),
                title: text(entry.title, 300),
                subtitle: text(entry.subtitle, 300),
                route: text(entry.route, 500),
                trackId: text(entry.trackId, 100),
                deletedAt: entry.deletedAt ? isoDate(entry.deletedAt) : null,
                createdAt: isoDate(entry.createdAt),
                updatedAt: isoDate(entry.updatedAt || entry.createdAt),
            })).filter((entry) => entry.itemId && entry.route.startsWith('/')),
            preferences: array(data.preferences).map((entry) => ({
                key: text(entry.key, 100),
                value: typeof entry.value === 'string' || typeof entry.value === 'boolean' || typeof entry.value === 'number' ? entry.value : null,
                updatedAt: isoDate(entry.updatedAt),
            })).filter((entry) => entry.key && entry.value !== null),
            activity: array(data.activity).map((entry) => ({
                id: text(entry.id, 120),
                type: text(entry.type, 80),
                metadata: record(entry.metadata),
                occurredAt: isoDate(entry.occurredAt),
            })).filter((entry) => entry.id && entry.type),
            syncMetadata: [],
        },
    }
}

function newer(left, right) {
    if (!left) return right
    if (!right) return left
    return String(right.updatedAt || right.createdAt || right.occurredAt || '') > String(left.updatedAt || left.createdAt || left.occurredAt || '') ? right : left
}

function mergeByKey(left, right, key, resolver = newer) {
    const values = new Map(left.map((entry) => [entry[key], entry]))
    right.forEach((entry) => values.set(entry[key], resolver(values.get(entry[key]), entry)))
    return [...values.values()]
}

export function mergeLearnerData(localPayload, cloudPayload) {
    const local = sanitizeLearnerExport(localPayload)
    const cloud = sanitizeLearnerExport(cloudPayload)

    const lessons = mergeByKey(local.data.lessonProgress, cloud.data.lessonProgress, 'lessonId', (left, right) => {
        if (!left) return right
        const selected = newer(left, right)
        const completed = left.completed || right.completed
        return {
            ...selected,
            completed,
            completedAt: completed ? (left.completedAt || right.completedAt || selected.updatedAt) : null,
        }
    })

    const pathways = mergeByKey(local.data.pathwayProgress, cloud.data.pathwayProgress, 'trackId', (left, right) => {
        if (!left) return right
        const selected = newer(left, right)
        return {
            ...selected,
            completedLessonIds: [...new Set([...(left.completedLessonIds || []), ...(right.completedLessonIds || [])])],
            totalLessons: Math.max(left.totalLessons || 0, right.totalLessons || 0),
            quizAttemptCount: Math.max(left.quizAttemptCount || 0, right.quizAttemptCount || 0),
        }
    })

    return {
        format: LEARNER_EXPORT_FORMAT,
        version: LEARNER_EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        data: {
            learner: local.data.learner || cloud.data.learner,
            lessonProgress: lessons,
            pathwayProgress: pathways,
            quizAttempts: mergeByKey(local.data.quizAttempts, cloud.data.quizAttempts, 'id'),
            bookmarks: mergeByKey(local.data.bookmarks, cloud.data.bookmarks, 'itemId'),
            // Cloud is the explicit account preference and wins on conflicts.
            preferences: mergeByKey(local.data.preferences, cloud.data.preferences, 'key', (left, right) => right || left),
            activity: mergeByKey(local.data.activity, cloud.data.activity, 'id'),
            syncMetadata: [],
        },
    }
}

export function emptyLearnerExport() {
    return sanitizeLearnerExport({ format: LEARNER_EXPORT_FORMAT, version: LEARNER_EXPORT_VERSION, data: {} })
}
