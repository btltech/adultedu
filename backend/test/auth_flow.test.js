import request from 'supertest';
import app from '../src/index.js';
import { expect } from 'chai';
import prisma from '../src/lib/db.js';

describe('Auth Flow Integration', () => {
    let csrfToken;
    let csrfCookie;
    let sessionCookie;
    const testUser = {
        email: `test_${Date.now()}@example.com`,
        password: 'Password123!',
    };

    // Clean up before/after
    after(async () => {
        await prisma.user.deleteMany({
            where: { email: testUser.email }
        });
    });

    it('should get CSRF token', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).to.equal(200);

        // Extract XSRF-TOKEN from cookies
        const cookies = res.headers['set-cookie'];
        const xsrfCookie = cookies.find(c => c.startsWith('XSRF-TOKEN='));
        expect(xsrfCookie).to.exist;

        csrfCookie = xsrfCookie;
        csrfToken = xsrfCookie.split(';')[0].split('=')[1];
    });

    it('should signup a new user', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .set('Cookie', [csrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send(testUser);

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('user');
        expect(res.headers['set-cookie']).to.exist;
    });

    it('should login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Cookie', [csrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send(testUser);

        expect(res.status).to.equal(200);
        expect(res.headers['set-cookie']).to.exist;
        sessionCookie = res.headers['set-cookie'].find(c => c.startsWith('session='));
    });

    it('should fail login with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Cookie', [csrfCookie])
            .set('X-CSRF-Token', csrfToken)
            .send({ ...testUser, password: 'WrongPassword' });

        expect(res.status).to.equal(401);
    });

    it('should return current user from /auth/me', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', [csrfCookie, sessionCookie]);

        expect(res.status).to.equal(200);
        expect(res.body).to.have.nested.property('user.email', testUser.email);
    });
});
