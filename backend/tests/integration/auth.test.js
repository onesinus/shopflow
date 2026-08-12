const crypto = require('crypto');
const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser } = require('../helpers/db');

describe('POST /api/v1/auth', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  describe('register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'reg@example.com', firstName: 'Reg', lastName: 'User', password: 'Password123!' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('reg@example.com');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('rejects a missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ firstName: 'A', lastName: 'B', password: 'Password123!' });

      expect(res.status).toBe(422);
    });

    it('rejects malformed addresses such as "a@b"', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'a@b', firstName: 'A', lastName: 'B', password: 'Password123!' });

      expect(res.status).toBe(422);
    });
  });

  describe('login', () => {
    it('logs in and returns an access token', async () => {
      await createUser({ email: 'login@example.com' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.refreshToken).toBeTruthy();
    });

    it('blocks disabled accounts', async () => {
      await createUser({ email: 'off@example.com', status: 'disabled' });
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'off@example.com', password: 'Password123!' });

      expect(res.status).toBe(403);
    });

    it('does not reveal whether an email is registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'whatever' });

      expect(res.status).toBe(401);
    });
  });

  describe('email verification', () => {
    it('registers new accounts as unverified', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'unverified@example.com', firstName: 'N', lastName: 'U', password: 'Password123!' });

      expect(res.status).toBe(201);
      expect(res.body.data.emailVerified).toBe(false);
    });

    it('verifies an email with a valid token', async () => {
      const user = await createUser({ email: 'verify@example.com', emailVerifiedAt: null });
      const raw = crypto.randomBytes(32).toString('hex');
      await models.EmailVerification.create({
        userId: user.id,
        tokenHash: crypto.createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(app).get(`/api/v1/auth/verify/${raw}`);
      expect(res.status).toBe(200);

      await user.reload();
      expect(user.emailVerifiedAt).toBeTruthy();
    });

    it('rejects an expired verification token', async () => {
      const user = await createUser({ email: 'verify2@example.com', emailVerifiedAt: null });
      const raw = crypto.randomBytes(32).toString('hex');
      await models.EmailVerification.create({
        userId: user.id,
        tokenHash: crypto.createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() - 1000),
      });

      const res = await request(app).get(`/api/v1/auth/verify/${raw}`);
      expect(res.status).toBe(400);
    });

    it('resends a verification email', async () => {
      const user = await createUser({ email: 'verify3@example.com', emailVerifiedAt: null });

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'verify3@example.com' });

      expect(res.status).toBe(200);
      const count = await models.EmailVerification.count({ where: { userId: user.id } });
      expect(count).toBe(1);
    });
  });

  describe('password reset', () => {
    it('resets the password with a valid token', async () => {
      const user = await createUser({ email: 'reset@example.com' });

      const raw = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      await models.PasswordReset.create({
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: raw, password: 'NewPassword1' });

      expect(res.status).toBe(200);
    });

    it('rejects an already-used token', async () => {
      const user = await createUser({ email: 'reset2@example.com' });
      const raw = crypto.randomBytes(32).toString('hex');
      await models.PasswordReset.create({
        userId: user.id,
        tokenHash: crypto.createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: raw, password: 'NewPassword1' });

      expect(res.status).toBe(400);
    });
  });
});
