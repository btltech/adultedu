import request from 'supertest';
import app from '../src/index.js';
import { expect } from 'chai';

const API_PREFIX = '/api/v1';

describe('Tracks API Integration', () => {
    it('should fetch tracks', async () => {
        const res = await request(app).get(`${API_PREFIX}/tracks`);
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array');
    });
});
