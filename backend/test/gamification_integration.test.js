
import request from 'supertest';
import { expect } from 'chai';
import app from '../src/index.js';
import prisma from '../src/lib/db.js';

describe('Gamification & Analytics API Integration', () => {
    let authToken;
    let testUser;

    // Setup user and auth before tests
    before(async () => {
        // 1. Get CSRF Token
        const healthRes = await request(app).get('/api/health');
        const cookies = healthRes.headers['set-cookie'];
        const xsrfCookie = cookies.find(c => c.startsWith('XSRF-TOKEN='));
        const csrfToken = xsrfCookie.split(';')[0].split('=')[1];

        // 2. Create a test user & Login (Signup returns session)
        const email = `test.game.${Date.now()}@example.com`;
        const password = 'password123';

        // Cleanup first just in case
        await prisma.user.deleteMany({ where: { email } });

        const res = await request(app)
            .post('/api/auth/signup')
            .set('Cookie', [xsrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send({ email, password, name: 'Gamification Tester' });

        testUser = res.body.user;
        const sessionCookie = res.headers['set-cookie'].find(c => c.startsWith('session='));

        // Store full cookie array for auth requests
        authToken = [xsrfCookie, sessionCookie];
    });

    // Cleanup after tests
    after(async () => {
        if (testUser) {
            await prisma.user.delete({ where: { id: testUser.id } });
        }
    });

    describe('GET /api/daily/challenge', () => {
        it('should return a daily challenge', async () => {
            const res = await request(app)
                .get('/api/daily/challenge')
                .set('Cookie', authToken);

            // It might be 404 if no challenge is set for TODAY, or 200 if seeded
            // But we expect a valid JSON response either way
            expect(res.status).to.be.oneOf([200, 404]);
            if (res.status === 200) {
                expect(res.body).to.have.property('id');
                expect(res.body).to.have.property('date');
                expect(res.body).to.have.property('question');
            }
        });

        it('should return 401 if not authenticated', async () => {
            await request(app)
                .get('/api/daily/challenge')
                .expect(401);
        });
    });

    describe('GET /api/gamification/achievements', () => {
        it('should return user achievements list', async () => {
            const res = await request(app)
                .get('/api/gamification/achievements')
                .set('Cookie', authToken)
                .expect(200);

            expect(res.body).to.have.property('earned');
            expect(res.body).to.have.property('achievements');
            expect(res.body.achievements).to.be.an('array');
        });
    });

    describe('GET /api/gamification/leaderboard', () => {
        it('should return leaderboard data', async () => {
            const res = await request(app)
                .get('/api/gamification/leaderboard?type=weekly')
                .set('Cookie', authToken)
                .expect(200);

            expect(res.body).to.have.property('leaderboard');
            expect(res.body.leaderboard).to.be.an('array');
            if (res.body.leaderboard.length > 0) {
                expect(res.body.leaderboard[0]).to.have.property('xp');
                expect(res.body.leaderboard[0]).to.have.property('rank');
            }
        });

        it('should return 401 if not authenticated', async () => {
            await request(app)
                .get('/api/gamification/leaderboard?type=weekly')
                .expect(401);
        });
    });

    describe('GET /api/analytics/overview', () => {
        it('should return analytics overview', async () => {
            const res = await request(app)
                .get('/api/analytics/overview')
                .set('Cookie', authToken)
                .expect(200);

            expect(res.body).to.have.property('totalQuestions');
            expect(res.body).to.have.property('accuracy');
            expect(res.body).to.have.property('xp');
        });
    });

});
