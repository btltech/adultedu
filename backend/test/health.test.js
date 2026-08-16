import request from 'supertest';
import app from '../src/index.js';
import { expect } from 'chai';

const API_PREFIX = '/api/v1';

describe('API Health Check', () => {
    it('should return 200 OK', async () => {
        const res = await request(app).get(`${API_PREFIX}/health`);
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('status');
    });
});
