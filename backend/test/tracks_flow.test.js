import request from 'supertest';
import app from '../src/index.js';
import { expect } from 'chai';

describe('Tracks API Integration', () => {
    it('should fetch tracks', async () => {
        const res = await request(app).get('/api/tracks');
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('array');
    });
});
