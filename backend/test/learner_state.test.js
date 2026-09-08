import { expect } from 'chai'
import request from 'supertest'
import app from '../src/index.js'
import prisma from '../src/lib/db.js'

const API_PREFIX = '/api/v1'

describe('gateless learner state', () => {
    const email = `learner_state_${Date.now()}@example.com`
    let csrfCookie
    let csrfToken
    let sessionCookie
    let question
    let lesson
    let fixtureIds = null

    before(async () => {
        const health = await request(app).get(`${API_PREFIX}/health`)
        csrfCookie = health.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        csrfToken = csrfCookie.split(';')[0].split('=')[1]

        const signup = await request(app)
            .post(`${API_PREFIX}/auth/signup`)
            .set('Cookie', [csrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send({ email, password: 'Password123!' })
        sessionCookie = signup.headers['set-cookie'].find((cookie) => cookie.startsWith('session='))

        question = await prisma.question.findFirst({
            where: { isPublished: true },
            include: { topic: { include: { track: true } } },
        })
        lesson = await prisma.lesson.findFirst({ where: { isPublished: true } })

        // The seed creates frameworks, tracks and topics but no lessons or
        // questions, so this suite cannot rely on finding published content.
        // Build the minimum it needs instead of depending on whatever content
        // happens to exist in a given environment.
        if (!question || !lesson) {
            const topic = await prisma.topic.findFirst({ include: { track: true } })
            if (!topic) throw new Error('learner state tests need at least one seeded topic')

            const createdQuestion = question ? null : await prisma.question.create({
                data: {
                    topicId: topic.id,
                    ukLevelId: topic.ukLevelId,
                    type: 'mcq',
                    prompt: 'Which option is correct in this learner-state fixture question?',
                    options: JSON.stringify(['First option', 'Second option', 'Third option', 'Fourth option']),
                    answer: JSON.stringify(0),
                    explanation: 'The first option is correct because this fixture defines it as the answer.',
                    isPublished: true,
                },
            })

            const createdLesson = lesson ? null : await prisma.lesson.create({
                data: {
                    topicId: topic.id,
                    title: 'Learner state fixture lesson',
                    summary: 'A published lesson used only by the learner state tests.',
                    contentBlocks: JSON.stringify([{ type: 'paragraph', content: 'Fixture content.' }]),
                    estMinutes: 3,
                    isPublished: true,
                    sortOrder: 9999,
                },
            })

            fixtureIds = { questionId: createdQuestion?.id || null, lessonId: createdLesson?.id || null }

            if (createdQuestion) {
                question = await prisma.question.findUnique({
                    where: { id: createdQuestion.id },
                    include: { topic: { include: { track: true } } },
                })
            }
            if (createdLesson) lesson = createdLesson
        }
    })

    after(async () => {
        await prisma.user.deleteMany({ where: { email } })

        // Remove only what this suite created, leaving real content untouched.
        if (fixtureIds?.questionId) {
            await prisma.attempt.deleteMany({ where: { questionId: fixtureIds.questionId } })
            await prisma.question.delete({ where: { id: fixtureIds.questionId } }).catch(() => {})
        }
        if (fixtureIds?.lessonId) {
            await prisma.lesson.delete({ where: { id: fixtureIds.lessonId } }).catch(() => {})
        }
    })

    it('serves ordinary topic practice without authentication', async () => {
        const response = await request(app).get(`${API_PREFIX}/practice/${question.topicId}?limit=3`)
        expect(response.status).to.equal(200)
        expect(response.body.questions).to.be.an('array').that.is.not.empty
    })

    it('scores an ordinary answer without authentication', async () => {
        const answer = JSON.parse(question.answer)
        const response = await request(app)
            .post(`${API_PREFIX}/practice/submit`)
            .set('Cookie', [csrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send({ questionId: question.id, answer, attemptId: 'attempt_guest_score_1' })

        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('isCorrect')
        expect(response.body).to.have.property('explanation')
        expect(await prisma.attempt.count({ where: { id: 'attempt_guest_score_1' } })).to.equal(0)
    })

    it('transactionally unions guest state with existing account attempts and is idempotent', async () => {
        const existingCloudAttempt = await request(app)
            .post(`${API_PREFIX}/practice/submit`)
            .set('Cookie', [csrfCookie, sessionCookie])
            .set('X-CSRF-Token', csrfToken)
            .send({ questionId: question.id, answer: JSON.parse(question.answer), attemptId: 'attempt_existing_cloud_1' })
        expect(existingCloudAttempt.status).to.equal(200)

        const payload = {
            format: 'adultedu-learning-data',
            version: 1,
            data: {
                learner: { localLearnerId: 'learner_local_test', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
                lessonProgress: [{
                    lessonId: lesson.id,
                    lessonTitle: lesson.title,
                    topicId: lesson.topicId,
                    trackId: question.topic.trackId,
                    trackSlug: question.topic.track.slug,
                    trackTitle: question.topic.track.title,
                    completed: true,
                    updatedAt: new Date().toISOString(),
                }],
                pathwayProgress: [],
                quizAttempts: [{
                    id: 'attempt_migrated_stable_1',
                    quizId: question.topicId,
                    questionId: question.id,
                    topicId: question.topicId,
                    trackId: question.topic.trackId,
                    answer: JSON.parse(question.answer),
                    isCorrect: true,
                    createdAt: new Date().toISOString(),
                }],
                bookmarks: [], preferences: [], activity: [], syncMetadata: [],
            },
        }

        const merge = () => request(app)
            .post(`${API_PREFIX}/learner-state/merge`)
            .set('Cookie', [csrfCookie, sessionCookie])
            .set('X-CSRF-Token', csrfToken)
            .send(payload)

        const first = await merge()
        const second = await merge()
        const refreshed = await request(app)
            .get(`${API_PREFIX}/learner-state`)
            .set('Cookie', [csrfCookie, sessionCookie])
        expect(first.status).to.equal(200)
        expect(second.status).to.equal(200)
        expect(refreshed.status).to.equal(200)
        expect(second.body.data.lessonProgress.some((entry) => entry.lessonId === lesson.id && entry.completed)).to.equal(true)
        expect(refreshed.body.data.quizAttempts.map((entry) => entry.id)).to.include.members(['attempt_existing_cloud_1', 'attempt_migrated_stable_1'])

        const user = await prisma.user.findUnique({ where: { email } })
        expect(await prisma.attempt.count({ where: { id: 'attempt_existing_cloud_1', userId: user.id } })).to.equal(1)
        expect(await prisma.attempt.count({ where: { id: 'attempt_migrated_stable_1', userId: user.id } })).to.equal(1)
        expect(await prisma.enrollment.count({ where: { userId: user.id, trackId: question.topic.trackId } })).to.equal(1)
    })
})
