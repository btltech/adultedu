import { Router } from 'express'
import prisma from '../lib/db.js'
import { requireAuth } from '../middleware/auth.js'
import {
    emptyLearnerExport,
    LEARNER_EXPORT_FORMAT,
    LEARNER_EXPORT_VERSION,
    mergeLearnerData,
    sanitizeLearnerExport,
} from '../lib/learnerState.js'

const router = Router()

function parseStoredState(row) {
    if (!row?.data) return emptyLearnerExport()
    try {
        return sanitizeLearnerExport(JSON.parse(row.data))
    } catch {
        return emptyLearnerExport()
    }
}

function attemptToExport(attempt) {
    let answer = attempt.userAnswer
    try { answer = JSON.parse(attempt.userAnswer) } catch { /* retain safe string */ }

    return {
        id: attempt.id,
        quizId: attempt.question.topicId,
        questionId: attempt.questionId,
        topicId: attempt.question.topicId,
        trackId: attempt.question.topic.trackId,
        trackSlug: attempt.question.topic.track.slug,
        trackTitle: attempt.question.topic.track.title,
        topicTitle: attempt.question.topic.title,
        answer,
        isCorrect: attempt.isCorrect,
        explanation: '',
        correctAnswer: null,
        timeSpentSec: attempt.timeSpentSec,
        createdAt: attempt.createdAt.toISOString(),
        updatedAt: attempt.createdAt.toISOString(),
    }
}

async function getCloudExport(client, userId) {
    const [state, attempts] = await Promise.all([
        client.learnerState.findUnique({ where: { userId } }),
        client.attempt.findMany({
            where: { userId },
            include: {
                question: {
                    select: {
                        topicId: true,
                        topic: {
                            select: {
                                id: true,
                                title: true,
                                trackId: true,
                                track: { select: { slug: true, title: true } },
                            },
                        },
                    },
                },
            },
        }),
    ])

    const stored = parseStoredState(state)
    return sanitizeLearnerExport({
        ...stored,
        data: {
            ...stored.data,
            quizAttempts: attempts.map(attemptToExport),
        },
    })
}

router.get('/learner-state', requireAuth, async (req, res, next) => {
    try {
        const result = await getCloudExport(prisma, req.user.id)
        res.json({ ...result, userId: req.user.id })
    } catch (error) {
        next(error)
    }
})

router.post('/learner-state/merge', requireAuth, async (req, res, next) => {
    try {
        const local = sanitizeLearnerExport(req.body)

        const result = await prisma.$transaction(async (tx) => {
            const lessonIds = [...new Set(local.data.lessonProgress.map((entry) => entry.lessonId))]
            const canonicalLessons = lessonIds.length > 0 ? await tx.lesson.findMany({
                where: { id: { in: lessonIds } },
                select: {
                    id: true, title: true,
                    topic: { select: { id: true, title: true, track: { select: { id: true, slug: true, title: true } } } },
                },
            }) : []
            const lessonById = new Map(canonicalLessons.map((lesson) => [lesson.id, lesson]))

            const importedTrackIds = [...new Set(local.data.pathwayProgress.map((entry) => entry.trackId))]
            const validTracks = importedTrackIds.length > 0 ? await tx.track.findMany({ where: { id: { in: importedTrackIds } }, select: { id: true, slug: true, title: true } }) : []
            const trackById = new Map(validTracks.map((track) => [track.id, track]))

            const validatedLocal = {
                ...local,
                data: {
                    ...local.data,
                    lessonProgress: local.data.lessonProgress
                        .filter((entry) => lessonById.has(entry.lessonId))
                        .map((entry) => {
                            const lesson = lessonById.get(entry.lessonId)
                            return {
                                ...entry,
                                lessonTitle: lesson.title,
                                topicId: lesson.topic.id,
                                topicTitle: lesson.topic.title,
                                trackId: lesson.topic.track.id,
                                trackSlug: lesson.topic.track.slug,
                                trackTitle: lesson.topic.track.title,
                            }
                        }),
                    pathwayProgress: local.data.pathwayProgress
                        .filter((entry) => trackById.has(entry.trackId))
                        .map((entry) => ({ ...entry, trackSlug: trackById.get(entry.trackId).slug, trackTitle: trackById.get(entry.trackId).title })),
                    bookmarks: local.data.bookmarks.filter((entry) => entry.type !== 'lesson' || lessonById.has(entry.itemId)),
                },
            }
            const cloud = await getCloudExport(tx, req.user.id)
            const merged = mergeLearnerData(validatedLocal, cloud)

            const questionIds = [...new Set(validatedLocal.data.quizAttempts.map((attempt) => attempt.questionId))]
            const questions = questionIds.length > 0 ? await tx.question.findMany({
                where: { id: { in: questionIds }, isPublished: true },
                select: { id: true, topic: { select: { trackId: true } } },
            }) : []
            const validQuestions = new Map(questions.map((question) => [question.id, question]))

            const newAttempts = validatedLocal.data.quizAttempts
                .filter((attempt) => validQuestions.has(attempt.questionId))
                .map((attempt) => ({
                    id: attempt.id,
                    userId: req.user.id,
                    questionId: attempt.questionId,
                    isCorrect: attempt.isCorrect,
                    userAnswer: JSON.stringify(attempt.answer ?? null).slice(0, 20_000),
                    timeSpentSec: attempt.timeSpentSec,
                    createdAt: new Date(attempt.createdAt),
                }))

            if (newAttempts.length > 0) {
                await tx.attempt.createMany({ data: newAttempts, skipDuplicates: true })
            }

            const enrollmentTrackIds = [...new Set(questions.map((question) => question.topic.trackId))]
            if (req.user.role !== 'admin' && enrollmentTrackIds.length > 0) {
                await tx.enrollment.createMany({
                    data: enrollmentTrackIds.map((trackId) => ({ userId: req.user.id, trackId })),
                    skipDuplicates: true,
                })
            }

            const snapshot = {
                ...merged,
                // Attempts are normalized in the Attempt table and are not
                // duplicated into the learner-state JSON snapshot.
                data: { ...merged.data, quizAttempts: [] },
            }
            await tx.learnerState.upsert({
                where: { userId: req.user.id },
                update: { schemaVersion: LEARNER_EXPORT_VERSION, data: JSON.stringify(snapshot) },
                create: { userId: req.user.id, schemaVersion: LEARNER_EXPORT_VERSION, data: JSON.stringify(snapshot) },
            })

            return getCloudExport(tx, req.user.id)
        })

        res.json({ ...result, format: LEARNER_EXPORT_FORMAT, version: LEARNER_EXPORT_VERSION, userId: req.user.id })
    } catch (error) {
        next(error)
    }
})

router.patch('/learner-state/preferences', requireAuth, async (req, res, next) => {
    try {
        const input = req.body?.preferences && typeof req.body.preferences === 'object' ? req.body.preferences : {}
        const allowed = Object.entries(input)
            .filter(([key, value]) => key.length <= 100 && ['string', 'boolean', 'number'].includes(typeof value))
            .slice(0, 100)
            .map(([key, value]) => ({ key, value, updatedAt: new Date().toISOString() }))

        const result = await prisma.$transaction(async (tx) => {
            const cloud = await getCloudExport(tx, req.user.id)
            const preferences = new Map(cloud.data.preferences.map((entry) => [entry.key, entry]))
            allowed.forEach((entry) => preferences.set(entry.key, entry))
            const snapshot = {
                ...cloud,
                data: { ...cloud.data, preferences: [...preferences.values()], quizAttempts: [], syncMetadata: [] },
            }
            await tx.learnerState.upsert({
                where: { userId: req.user.id },
                update: { schemaVersion: LEARNER_EXPORT_VERSION, data: JSON.stringify(snapshot) },
                create: { userId: req.user.id, schemaVersion: LEARNER_EXPORT_VERSION, data: JSON.stringify(snapshot) },
            })
            return getCloudExport(tx, req.user.id)
        })

        res.json({ ...result, userId: req.user.id })
    } catch (error) {
        next(error)
    }
})

export default router
