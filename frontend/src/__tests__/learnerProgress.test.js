import { beforeEach, describe, expect, it } from 'vitest'
import {
    LocalLearnerProgressStore,
    mergeLearnerExports,
    resetLearnerProgressForTests,
} from '../lib/learnerProgress'

function emptyExport(data = {}) {
    return {
        format: 'adultedu-learning-data',
        version: 1,
        exportedAt: '2026-08-21T00:00:00.000Z',
        data: {
            learner: null,
            lessonProgress: [],
            pathwayProgress: [],
            quizAttempts: [],
            bookmarks: [],
            preferences: [],
            activity: [],
            syncMetadata: [],
            ...data,
        },
    }
}

describe('local-first learner progress', () => {
    beforeEach(async () => {
        await resetLearnerProgressForTests()
    })

    it('persists lesson completion and current position for a returning guest', async () => {
        const firstVisit = new LocalLearnerProgressStore()
        await firstVisit.completeLesson({
            lessonId: 'lesson-1',
            lessonTitle: 'Fractions',
            topicId: 'topic-1',
            topicTitle: 'Number',
            trackId: 'track-1',
            trackSlug: 'maths',
            trackTitle: 'Maths',
            totalLessons: 4,
        })

        const returnVisit = new LocalLearnerProgressStore()
        expect(await returnVisit.getLessonProgress('lesson-1')).toMatchObject({ completed: true })
        expect(await returnVisit.getPathwayProgress('track-1')).toMatchObject({
            currentLessonId: 'lesson-1',
            lastRoute: '/lesson/lesson-1',
            completedLessonIds: ['lesson-1'],
        })
    })

    it('restores a guest quiz attempt with its feedback', async () => {
        const store = new LocalLearnerProgressStore()
        await store.saveQuizAttempt({
            id: 'attempt_stable_1',
            quizId: 'topic-1',
            questionId: 'question-1',
            topicId: 'topic-1',
            trackId: 'track-1',
            answer: '2',
            isCorrect: true,
            explanation: 'Two halves make one whole.',
        })

        expect(await new LocalLearnerProgressStore().getQuizAttempts('topic-1')).toEqual([
            expect.objectContaining({ id: 'attempt_stable_1', isCorrect: true, answer: '2' }),
        ])
    })

    it('merges completion, attempts and bookmarks without losing either side', () => {
        const local = emptyExport({
            lessonProgress: [{ lessonId: 'lesson-a', trackId: 'track-1', completed: true, completedAt: '2026-08-20T00:00:00.000Z', updatedAt: '2026-08-20T00:00:00.000Z' }],
            quizAttempts: [{ id: 'attempt-local', questionId: 'question-a', createdAt: '2026-08-20T00:00:00.000Z' }],
            bookmarks: [{ itemId: 'lesson-a', route: '/lesson/lesson-a', updatedAt: '2026-08-20T00:00:00.000Z' }],
        })
        const cloud = emptyExport({
            lessonProgress: [
                { lessonId: 'lesson-a', trackId: 'track-1', completed: false, updatedAt: '2026-08-21T00:00:00.000Z' },
                { lessonId: 'lesson-b', trackId: 'track-1', completed: true, updatedAt: '2026-08-21T00:00:00.000Z' },
            ],
            quizAttempts: [{ id: 'attempt-cloud', questionId: 'question-b', createdAt: '2026-08-21T00:00:00.000Z' }],
        })

        const merged = mergeLearnerExports(local, cloud)
        expect(merged.data.lessonProgress).toEqual(expect.arrayContaining([
            expect.objectContaining({ lessonId: 'lesson-a', completed: true }),
            expect.objectContaining({ lessonId: 'lesson-b', completed: true }),
        ]))
        expect(merged.data.quizAttempts.map((attempt) => attempt.id)).toEqual(expect.arrayContaining(['attempt-local', 'attempt-cloud']))
        expect(merged.data.bookmarks).toHaveLength(1)
    })

    it('imports a backup through the same non-destructive merge rules', async () => {
        const store = new LocalLearnerProgressStore()
        await store.completeLesson({
            lessonId: 'lesson-a', topicId: 'topic-1', trackId: 'track-1',
            trackSlug: 'maths', totalLessons: 2,
        })

        await store.importData(emptyExport({
            lessonProgress: [
                { lessonId: 'lesson-a', trackId: 'track-1', completed: false, updatedAt: '2099-01-01T00:00:00.000Z' },
                { lessonId: 'lesson-b', trackId: 'track-1', completed: true, updatedAt: '2099-01-01T00:00:00.000Z' },
            ],
            quizAttempts: [{ id: 'imported-attempt', questionId: 'question-b', createdAt: '2099-01-01T00:00:00.000Z' }],
        }))

        const snapshot = await store.exportData()
        expect(snapshot.data.lessonProgress).toEqual(expect.arrayContaining([
            expect.objectContaining({ lessonId: 'lesson-a', completed: true }),
            expect.objectContaining({ lessonId: 'lesson-b', completed: true }),
        ]))
        expect(snapshot.data.quizAttempts).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'imported-attempt' }),
        ]))
    })

    it('drops external or malformed navigation targets from imported learning data', async () => {
        const store = new LocalLearnerProgressStore()
        await store.importData(emptyExport({
            pathwayProgress: [{
                trackId: 'track-1',
                trackSlug: 'maths',
                lastRoute: '//example.com/not-adultedu',
                updatedAt: '2026-08-21T00:00:00.000Z',
            }],
            bookmarks: [
                { itemId: 'unsafe', route: '//example.com/not-adultedu' },
                { itemId: 'safe', route: '/lesson/lesson-a?from=backup#activity' },
            ],
        }))

        const snapshot = await store.exportData()
        expect(snapshot.data.pathwayProgress[0].lastRoute).toBe('')
        expect(snapshot.data.bookmarks).toEqual([
            expect.objectContaining({ itemId: 'safe', route: '/lesson/lesson-a?from=backup#activity' }),
        ])
    })

    it('records backup and sync success while reporting restricted storage honestly', async () => {
        const store = new LocalLearnerProgressStore()
        await store.markBackupSucceeded()
        await store.markSynced('user-1')

        const status = await store.getStorageStatus()
        expect(status).toMatchObject({ persistent: false, backend: 'memory' })
        expect(status.lastSuccessfulBackupAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
        expect(status.lastSuccessfulSyncAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('clears account-bound learning after safe logout but retains device preferences', async () => {
        const store = new LocalLearnerProgressStore()
        const originalLearner = await store.getLearner()
        await store.savePreferences({ textScale: 'large' })
        await store.completeLesson({ lessonId: 'lesson-a', topicId: 'topic-1', trackId: 'track-1', trackSlug: 'maths' })
        await store.saveQuizAttempt({ id: 'attempt-a', questionId: 'question-a', topicId: 'topic-1', trackId: 'track-1' })
        await store.addBookmark({ itemId: 'lesson-a', route: '/lesson/lesson-a' })
        await store.markSynced('user-1')

        await store.clearAccountBoundLearningData()

        const snapshot = await store.exportData()
        expect(snapshot.data.learner.localLearnerId).not.toBe(originalLearner.localLearnerId)
        expect(snapshot.data.lessonProgress).toEqual([])
        expect(snapshot.data.pathwayProgress).toEqual([])
        expect(snapshot.data.quizAttempts).toEqual([])
        expect(snapshot.data.bookmarks).toEqual([])
        expect(snapshot.data.activity).toEqual([])
        expect(snapshot.data.syncMetadata).toEqual([])
        expect(snapshot.data.preferences).toEqual([
            expect.objectContaining({ key: 'textScale', value: 'large' }),
        ])
    })
})
