const request = require('supertest');
const { app, models, resetDb, seedRoles, createUser, loginAs, auth } = require('../helpers/db');

describe('C04: only one default address per user', () => {
  beforeEach(async () => {
    await resetDb();
    await seedRoles();
  });

  async function create() {
    const user = await createUser();
    const token = await loginAs(user.email);
    return { user, token };
  }

  function address(overrides = {}) {
    return {
      firstName: 'A',
      lastName: 'B',
      line1: '1 Main St',
      city: 'Portland',
      country: 'US',
      ...overrides,
    };
  }

  it('demotes the previous default when a new default address is added', async () => {
    const { token, user } = await create();

    const first = await request(app).post('/api/v1/users/me/addresses').set(auth(token)).send(address());
    expect(first.status).toBe(201);
    expect(first.body.data.isDefault).toBe(true);

    const second = await request(app).post('/api/v1/users/me/addresses').set(auth(token)).send(address({ isDefault: true }));
    expect(second.status).toBe(201);
    expect(second.body.data.isDefault).toBe(true);

    const active = await models.Address.count({ where: { userId: user.id, isDefault: true } });
    expect(active).toBe(1);
  });

  it('keeps an existing default untouched when adding a non-default address', async () => {
    const { token, user } = await create();

    await request(app).post('/api/v1/users/me/addresses').set(auth(token)).send(address());
    const extra = await request(app).post('/api/v1/users/me/addresses').set(auth(token)).send(address({ isDefault: false }));

    expect(extra.body.data.isDefault).toBe(false);
    const active = await models.Address.count({ where: { userId: user.id, isDefault: true } });
    expect(active).toBe(1);
  });
});