import bcrypt from 'bcryptjs'
import { expect } from 'chai'
import request from 'supertest'
import app from '../src/index.js'
import prisma from '../src/lib/db.js'

const API_PREFIX = '/api/v1'

describe('Admin content publication gate', () => {
    const admin = {
        email: `content.gate.${Date.now()}@example.com`,
        password: 'Password123!',
    }
    let csrfCookie
    let csrfToken
    let sessionCookie
    let topic
    let ukLevel
    const createdQuestionIds = []

    before(async () => {
        const health = await request(app).get(`${API_PREFIX}/health`)
        csrfCookie = health.headers['set-cookie'].find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        csrfToken = csrfCookie.split(';')[0].split('=')[1]

        const passwordHash = await bcrypt.hash(admin.password, 10)
        await prisma.user.create({
            data: { email: admin.email, passwordHash, role: 'admin' },
        })

        const login = await request(app)
            .post(`${API_PREFIX}/auth/login`)
            .set('Cookie', [csrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send(admin)
        sessionCookie = login.headers['set-cookie'].find((cookie) => cookie.startsWith('session='))

        topic = await prisma.topic.findFirst({ select: { id: true } })
        ukLevel = await prisma.ukLevel.findFirst({ select: { id: true } })
    })

    after(async () => {
        if (createdQuestionIds.length) {
            await prisma.question.deleteMany({ where: { id: { in: createdQuestionIds } } })
        }
        await prisma.user.deleteMany({ where: { email: admin.email } })
    })

    const requestQuestion = (body) => request(app)
        .post(`${API_PREFIX}/admin/questions`)
        .set('Cookie', [csrfCookie, sessionCookie])
        .set('X-CSRF-Token', csrfToken)
        .send({
            topicId: topic.id,
            ukLevelId: ukLevel.id,
            type: 'mcq',
            prompt: 'Which source is required before this question can be published?',
            options: ['A primary source', 'No source'],
            answer: 0,
            explanation: 'Published learner content must be traceable to a reviewed source.',
            difficulty: 1,
            ...body,
        })

    it('rejects publishing without a completed review record', async () => {
        const res = await requestQuestion({ isPublished: true })
        expect(res.status).to.equal(422)
        expect(res.body.error).to.equal('Content review required')
        expect(res.body.details).to.include('Add a primary source URL before publishing.')
    })

    it('allows a reviewed, sourced question to be published', async () => {
        const now = new Date().toISOString()
        const res = await requestQuestion({
            isPublished: true,
            sourceUrl: 'https://www.gov.uk/',
            sourceTitle: 'GOV.UK',
            sourceCheckedAt: now,
            curriculumObjective: 'Use authoritative sources for learner-facing information.',
            reviewStatus: 'approved',
            reviewedBy: 'Automated test reviewer',
            reviewedAt: now,
        })

        expect(res.status).to.equal(201)
        expect(res.body.isPublished).to.equal(true)
        expect(res.body.reviewStatus).to.equal('approved')
        createdQuestionIds.push(res.body.id)
    })
})
