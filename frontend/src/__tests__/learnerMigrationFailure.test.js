import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockApi = vi.hoisted(() => vi.fn())
vi.mock('../lib/api', () => ({ api: mockApi }))

import {
    localLearnerProgressStore,
    resetLearnerProgressForTests,
    syncLocalProgressToCloud,
} from '../lib/learnerProgress'

describe('failed guest-to-account migration', () => {
    beforeEach(async () => {
        mockApi.mockReset()
        await resetLearnerProgressForTests()
    })

    it('keeps valid local progress when the cloud write fails', async () => {
        await localLearnerProgressStore.completeLesson({
            lessonId: 'lesson-safe',
            lessonTitle: 'Safe progress',
            topicId: 'topic-1',
            trackId: 'track-1',
            trackSlug: 'maths',
            trackTitle: 'Maths',
            totalLessons: 3,
        })
        mockApi.mockRejectedValue(new Error('cloud unavailable'))

        await expect(syncLocalProgressToCloud()).rejects.toThrow('cloud unavailable')
        expect(await localLearnerProgressStore.getLessonProgress('lesson-safe')).toMatchObject({ completed: true })
    })
})
