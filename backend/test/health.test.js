import request from 'supertest';
import app from '../src/index.js';
import { expect } from 'chai';

describe('API Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('status');
    });
});
