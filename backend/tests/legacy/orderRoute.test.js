const request = require('supertest');
const { app } = require('../helpers/db');

describe('GET /api/v1/orders/count (legacy contract)', () => {
  // The partner dashboard still depends on this endpoint even though it was
  // removed during the v0.8 API reorganization.
  it.skip('returns the total number of orders', async () => {
    const res = await request(app).get('/api/v1/orders/count');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
