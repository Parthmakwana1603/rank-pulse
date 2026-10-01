// HTTP-level tests: routing, auth, validation, ownership, error format and CORS.
// Supabase is replaced by mocks of the auth service and repositories.
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const USER = { id: '11111111-1111-4111-8111-111111111111', email: 'me@example.com' };
const OTHER = '22222222-2222-4222-8222-222222222222';
const PROJECT = '33333333-3333-4333-8333-333333333333';

vi.mock('../src/services/auth.service.js', async () => {
  const { unauthorized } = await import('../src/utils/http-error.js');
  return {
    verifyAccessToken: vi.fn(async (token: string) => {
      if (token === 'good-token') return USER;
      throw unauthorized('Your session has expired. Please sign in again.');
    }),
  };
});

const projectRow = (overrides = {}) => ({
  id: PROJECT,
  user_id: USER.id,
  name: 'example.com',
  website_url: 'https://example.com',
  favicon: 'E',
  industry: null,
  target_country: null,
  status: 'active',
  health_score: 0,
  authority_score: 0,
  last_audit_at: null,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  project_keywords: [{ count: 2 }],
  ...overrides,
});

vi.mock('../src/repositories/projects.repository.js', () => ({
  listProjects: vi.fn(),
  findProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));
vi.mock('../src/repositories/keywords.repository.js', () => ({
  listKeywords: vi.fn(async () => []),
  insertKeywords: vi.fn(),
  deleteKeyword: vi.fn(),
  countKeywords: vi.fn(async () => 0),
}));
vi.mock('../src/repositories/feed.repository.js', () => ({
  insertActivity: vi.fn(),
  insertNotification: vi.fn(),
  listActivities: vi.fn(async () => []),
  listNotifications: vi.fn(async () => []),
  countUnread: vi.fn(async () => 0),
  markNotificationsRead: vi.fn(async () => 0),
  listPreferences: vi.fn(async () => []),
  upsertPreference: vi.fn(),
}));

const projectsRepo = await import('../src/repositories/projects.repository.js');
const keywordsRepo = await import('../src/repositories/keywords.repository.js');
const { HttpError } = await import('../src/utils/http-error.js');
const { createApp } = await import('../src/app.js');
const app = createApp();
const auth = { Authorization: 'Bearer good-token' };

beforeEach(() => {
  vi.mocked(projectsRepo.findProject).mockResolvedValue(projectRow() as never);
  vi.mocked(projectsRepo.listProjects).mockResolvedValue([projectRow()] as never);
});

describe('public endpoints', () => {
  it('GET /api/health works without a token', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, message: expect.any(String) });
  });

  it('sets security headers and hides Express', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('authentication', () => {
  it('rejects requests without a bearer token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Please sign in to continue.' });
  });

  it('rejects invalid or expired tokens', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/);
  });

  it('accepts a valid token and returns the user’s projects', async () => {
    const res = await request(app).get('/api/projects').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      expect.objectContaining({ id: PROJECT, name: 'example.com', keywordCount: 2, healthScore: null, authorityScore: null }),
    ]);
  });
});

describe('validation', () => {
  it('requires a projectId on project-scoped endpoints', async () => {
    const res = await request(app).get('/api/keywords').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/^projectId:/);
  });

  it('rejects malformed ids', async () => {
    const res = await request(app).get('/api/keywords?projectId=123').set(auth);
    expect(res.status).toBe(400);
    const res2 = await request(app).delete('/api/projects/not-a-uuid').set(auth);
    expect(res2.status).toBe(400);
  });

  it('validates project creation and reports field errors', async () => {
    const res = await request(app).post('/api/projects').set(auth).send({ websiteUrl: 'not a url' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, message: expect.stringContaining('valid URL'), details: expect.any(Array) });
  });

  it('rejects invalid JSON bodies', async () => {
    const res = await request(app).post('/api/projects').set(auth).set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JSON/);
  });

  it('rejects unknown fields when updating a project', async () => {
    const res = await request(app).patch(`/api/projects/${PROJECT}`).set(auth).send({ user_id: OTHER });
    expect(res.status).toBe(400);
  });
});

describe('ownership', () => {
  it('returns 404 for a project owned by someone else', async () => {
    vi.mocked(projectsRepo.findProject).mockResolvedValue(projectRow({ user_id: OTHER }) as never);
    const res = await request(app).get(`/api/keywords?projectId=${PROJECT}`).set(auth);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Project not found.');
  });

  it('returns 404 for a project that does not exist', async () => {
    vi.mocked(projectsRepo.findProject).mockResolvedValue(null);
    const res = await request(app).get(`/api/dashboard/summary?projectId=${PROJECT}`).set(auth);
    expect(res.status).toBe(404);
  });

  it('never lets the client choose the owner', async () => {
    vi.mocked(projectsRepo.createProject).mockResolvedValue({ id: PROJECT });
    await request(app).post('/api/projects').set(auth).send({ websiteUrl: 'example.com', userId: OTHER }).expect(201);
    expect(projectsRepo.createProject).toHaveBeenCalledWith(expect.anything(), {
      name: 'example.com',
      websiteUrl: 'https://example.com',
      industry: undefined,
      targetCountry: undefined,
      trackingKeywords: [],
    });
  });
});

describe('writes and errors', () => {
  it('creates a project with normalised input', async () => {
    vi.mocked(projectsRepo.createProject).mockResolvedValue({ id: PROJECT });
    const res = await request(app)
      .post('/api/projects')
      .set(auth)
      .send({ websiteUrl: 'www.Example.com/shop/', targetCountry: 'gb', trackingKeywords: ['SEO ', 'seo', ''] });
    expect(res.status).toBe(201);
    expect(projectsRepo.createProject).toHaveBeenLastCalledWith(expect.anything(), {
      name: 'example.com',
      websiteUrl: 'https://www.example.com/shop',
      industry: undefined,
      targetCountry: 'GB',
      trackingKeywords: ['seo'],
    });
  });

  it('turns database conflicts into 409 with a readable message', async () => {
    vi.mocked(projectsRepo.createProject).mockRejectedValue(new HttpError(409, 'You already have a project for this website.'));
    const res = await request(app).post('/api/projects').set(auth).send({ websiteUrl: 'example.com' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, message: 'You already have a project for this website.' });
  });

  it('hides internal error details', async () => {
    vi.mocked(projectsRepo.listProjects).mockRejectedValue(new Error('connection string postgres://secret'));
    const res = await request(app).get('/api/projects').set(auth);
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('adds keywords and reports skipped duplicates', async () => {
    vi.mocked(keywordsRepo.insertKeywords).mockResolvedValue([
      { id: 'k1', project_id: PROJECT, keyword: 'seo audit', search_engine: 'google', device: 'mobile', created_at: '' },
    ]);
    const res = await request(app)
      .post('/api/keywords')
      .set(auth)
      .send({ projectId: PROJECT, keywords: ['SEO audit', 'seo audit ', 'rank tracker'], device: 'mobile' });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ added: 1, skipped: 1 });
    expect(keywordsRepo.insertKeywords).toHaveBeenCalledWith(expect.anything(), [
      { project_id: PROJECT, keyword: 'seo audit', search_engine: 'google', device: 'mobile' },
      { project_id: PROJECT, keyword: 'rank tracker', search_engine: 'google', device: 'mobile' },
    ]);
  });

  it('returns 204 when deleting', async () => {
    vi.mocked(projectsRepo.deleteProject).mockResolvedValue(true);
    const res = await request(app).delete(`/api/projects/${PROJECT}`).set(auth);
    expect(res.status).toBe(204);
  });
});

describe('CORS', () => {
  it('allows the configured frontend origin', async () => {
    const res = await request(app).options('/api/projects').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/);
  });

  it('does not allow other origins', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
