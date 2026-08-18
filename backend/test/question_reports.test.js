import { expect } from 'chai'
import request from 'supertest'
import app from '../src/index.js'
import prisma from '../src/lib/db.js'

const API_PREFIX = '/api/v1'

describe('Question reports', () => {
    let csrfCookie
    let csrfToken
    let publishedQuestion
    let unpublishedQuestion
    const createdQuestionIds = []

    const postReport = (body) => request(app)
        .post(`${API_PREFIX}/question-reports`)
        .set('Cookie', [csrfCookie])
        .set('X-CSRF-Token', csrfToken)
        .send(body)

    before(async () => {
        const health = await request(app).get(`${API_PREFIX}/health`)
        csrfCookie = health.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        csrfToken = csrfCookie.split(';')[0].split('=')[1]

        const topic = await prisma.topic.findFirst({ select: { id: true } })
        const ukLevel = await prisma.ukLevel.findFirst({ select: { id: true } })

        const base = {
            topicId: topic.id,
            ukLevelId: ukLevel.id,
            type: 'mcq',
            prompt: 'Report fixture: which option is correct?',
            options: JSON.stringify(['First', 'Second']),
            answer: JSON.stringify(0),
            explanation: 'Fixture question used to exercise the learner reporting endpoint.',
            difficulty: 1,
        }

        publishedQuestion = await prisma.question.create({ data: { ...base, isPublished: true } })
        unpublishedQuestion = await prisma.question.create({
            data: { ...base, prompt: `${base.prompt} (draft)`, isPublished: false },
        })
        createdQuestionIds.push(publishedQuestion.id, unpublishedQuestion.id)
    })

    after(async () => {
        await prisma.questionReport.deleteMany({ where: { questionId: { in: createdQuestionIds } } })
        await prisma.question.deleteMany({ where: { id: { in: createdQuestionIds } } })
    })

    it('accepts an anonymous report against a published question', async () => {
        const res = await postReport({ questionId: publishedQuestion.id, reason: 'incorrect_answer' })

        expect(res.status).to.equal(201)
        expect(res.body.ok).to.equal(true)
        expect(res.body.status).to.equal('open')

        const stored = await prisma.questionReport.findUnique({ where: { id: res.body.reportId } })
        expect(stored.userId).to.equal(null)
    })

    it('rejects a reason outside the allowed set', async () => {
        const res = await postReport({ questionId: publishedQuestion.id, reason: 'because_i_said_so' })
        expect(res.status).to.equal(400)
    })

    it('rejects details longer than the documented limit', async () => {
        const res = await postReport({
            questionId: publishedQuestion.id,
            reason: 'other',
            details: 'x'.repeat(2001),
        })
        expect(res.status).to.equal(400)
    })

    it('does not disclose or accept reports for unpublished questions', async () => {
        const res = await postReport({ questionId: unpublishedQuestion.id, reason: 'typo_or_formatting' })
        expect(res.status).to.equal(404)
    })

    it('stores SQL NULL rather than the string "null" when no context is usable', async () => {
        const res = await postReport({
            questionId: publishedQuestion.id,
            reason: 'unclear_question',
            context: { notAnAllowedField: 'dropped' },
        })

        const stored = await prisma.questionReport.findUnique({ where: { id: res.body.reportId } })
        expect(stored.context).to.equal(null)

        const nullCount = await prisma.questionReport.count({
            where: { id: res.body.reportId, context: null },
        })
        expect(nullCount).to.equal(1)
    })

    it('keeps only allowlisted context fields', async () => {
        const res = await postReport({
            questionId: publishedQuestion.id,
            reason: 'out_of_date',
            context: { surface: 'practice', selectedAnswerIndex: 1, secret: 'must not persist' },
        })

        const stored = await prisma.questionReport.findUnique({ where: { id: res.body.reportId } })
        const context = JSON.parse(stored.context)
        expect(context).to.deep.equal({ surface: 'practice', selectedAnswerIndex: 1 })
    })

    it('never changes the reported question', async () => {
        const before = await prisma.question.findUnique({ where: { id: publishedQuestion.id } })
        await postReport({ questionId: publishedQuestion.id, reason: 'incorrect_answer', details: 'Option B also works.' })
        const after = await prisma.question.findUnique({ where: { id: publishedQuestion.id } })

        expect(after.isPublished).to.equal(true)
        expect(after.prompt).to.equal(before.prompt)
        expect(after.answer).to.equal(before.answer)
        expect(after.updatedAt.getTime()).to.equal(before.updatedAt.getTime())
    })
})
