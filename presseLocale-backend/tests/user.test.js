// File: user-backend/tests/user.test.js

const request = require('supertest');
const app = require('../app'); // ton Express

describe('User API', () => {
  it('inscription réussie', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ email: 'test@example.com', password: 'azerty1', bio: 'demo' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.message).toMatch(/Inscription réussie/);
  });
});
