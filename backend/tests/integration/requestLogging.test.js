const logger = require('../../src/logger');
const { app, request } = require('../helpers/db');

describe('request logging & correlation IDs', () => {
  let infoSpy;
  let warnSpy;

  beforeEach(() => {
    infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('exposes a requestId header on every response', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('honours an inbound x-request-id header', async () => {
    const res = await request(app).get('/health').set('X-Request-Id', 'trace-abc-123');
    expect(res.headers['x-request-id']).toBe('trace-abc-123');
  });

  it('returns the requestId in the error envelope', async () => {
    const res = await request(app).get('/api/v1/nope-not-a-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('logs access entries with method, path, status, duration and requestId', async () => {
    const reqId = 'trace-access-456';
    const res = await request(app).get('/health').set('X-Request-Id', reqId);

    expect(res.headers['x-request-id']).toBe(reqId);
    const entry = infoSpy.mock.calls
      .map((call) => call[0])
      .find((msg) => typeof msg === 'string' && /^GET \/health/.test(msg));

    expect(entry).toBeTruthy();
    expect(entry).toMatch(/\b200\b/);
    expect(entry).toMatch(/requestId=trace-access-456\b/);
  });

  it('shares the same id across access and error logs for a request', async () => {
    const reqId = 'trace-error-789';
    await request(app).get('/api/v1/nope-not-a-route-xyz').set('X-Request-Id', reqId);

    const access = infoSpy.mock.calls
      .map((call) => call[0])
      .find((msg) => typeof msg === 'string' && /^GET \/api\/v1\//.test(msg));
    const warnCall = warnSpy.mock.calls.find(
      ([msg]) => typeof msg === 'string' && /-> 404/.test(msg)
    );

    expect(access).toMatch(new RegExp(`requestId=${reqId}\\b`));
    expect(warnCall[1].requestId).toBe(reqId);
  });
});