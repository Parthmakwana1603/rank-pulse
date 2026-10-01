// Live end-to-end tests: the real Express app against a real Supabase project, plus the frontend's
// own response mappers over the real responses (the frontend ↔ backend contract).
//
// Runs only with LIVE_SUPABASE_TESTS=true and SUPABASE_URL / SUPABASE_ANON_KEY in backend/.env
// (or the environment). The project needs all migrations applied and "Confirm email" turned off.
// It signs up throwaway users (rp-test-…@example.com) and deletes the projects it creates.
//
//   npm run test:live
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import * as map from '../../src/lib/api/mappers';

function readDotEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(join(import.meta.dirname, '..', '.env'), 'utf8')
        .split(/\r?\n/)
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])
    );
  } catch {
    return {};
  }
}

const fileEnv = readDotEnv();
const live = (process.env.LIVE_SUPABASE_TESTS ?? fileEnv.LIVE_SUPABASE_TESTS) === 'true';
const url = process.env.TEST_SUPABASE_URL ?? fileEnv.SUPABASE_URL;
const anonKey = process.env.TEST_SUPABASE_ANON_KEY ?? fileEnv.SUPABASE_ANON_KEY;
const PASSWORD = 'Test-password-123';

interface TestUser {
  email: string;
  token: string;
  client: SupabaseClient;
}

describe.skipIf(!live || !url || !anonKey)('live: Express API + Supabase', () => {
  let app: Express;
  let jobs: { idle: () => Promise<void> };
  let alice: TestUser;
  let bob: TestUser;
  const created: { token: string; id: string }[] = [];

  const as = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });
  const get = (u: TestUser, path: string) => request(app).get(`/api${path}`).set(as(u));
  const send = (u: TestUser, method: 'post' | 'patch' | 'put' | 'delete', path: string, body?: object) =>
    request(app)[method](`/api${path}`).set(as(u)).send(body);

  async function signUp(name: string): Promise<TestUser> {
    const client = createClient(url!, anonKey!, { auth: { persistSession: false } });
    const email = `rp-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
    const { data, error } = await client.auth.signUp({ email, password: PASSWORD, options: { data: { name } } });
    if (error || !data.session) throw new Error(`Sign-up failed (is "Confirm email" off?): ${error?.message ?? 'no session returned'}`);
    return { email, token: data.session.access_token, client };
  }

  async function newProject(u: TestUser, websiteUrl: string, trackingKeywords: string[] = []) {
    const res = await send(u, 'post', '/projects', { websiteUrl, trackingKeywords }).expect(201);
    created.push({ token: u.token, id: res.body.data.id });
    return res.body.data.id as string;
  }

  beforeAll(async () => {
    vi.stubEnv('SUPABASE_URL', url!);
    vi.stubEnv('SUPABASE_ANON_KEY', anonKey!);
    vi.stubEnv('RATE_LIMIT_MAX', '10000');
    app = (await import('../src/app.js')).createApp();
    jobs = (await import('../src/services/jobs/job-runner.js')).jobs;
    alice = await signUp('Alice Tester');
    bob = await signUp('Bob Tester');
  }, 60_000);

  afterAll(async () => {
    await jobs?.idle();
    for (const p of created) {
      await request(app).delete(`/api/projects/${p.id}`).set({ Authorization: `Bearer ${p.token}` });
    }
  }, 60_000);

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('auth: health is public, protected routes need a valid Supabase token', async () => {
    await request(app).get('/api/health').expect(200, { success: true, data: { status: 'ok' } });
    await request(app).get('/api/projects').expect(401);
    const forged = await request(app).get('/api/projects').set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.x');
    expect(forged.status).toBe(401);
    const signedIn = await alice.client.auth.signInWithPassword({ email: alice.email, password: PASSWORD });
    expect(signedIn.data.session?.access_token).toBeTruthy();
  });

  it('profile: created on sign-up, editable, plan/role not editable', async () => {
    const res = await get(alice, '/profile').expect(200);
    expect(res.body.data).toMatchObject({ name: 'Alice Tester', email: alice.email, plan: 'free', role: 'owner', avatarUrl: null });
    await send(alice, 'patch', '/profile', { company: 'Acme', jobTitle: 'SEO Lead' }).expect(200);
    await send(alice, 'patch', '/profile', { plan: 'enterprise' }).expect(400);
    expect((await get(alice, '/profile')).body.data).toMatchObject({ company: 'Acme', jobTitle: 'SEO Lead', plan: 'free' });
  });

  // ── Projects ──────────────────────────────────────────────────────────────

  it('projects: create, validate, update, list (and the frontend mapper reads them)', async () => {
    const id = await newProject(alice, 'example.com', ['seo audit', 'SEO Audit ', 'rank tracker']);
    await send(alice, 'post', '/projects', { websiteUrl: 'https://EXAMPLE.com/' }).expect(409);
    const bad = await send(alice, 'post', '/projects', { websiteUrl: 'not a url' }).expect(400);
    expect(bad.body.message).toMatch(/^websiteUrl:/);
    await send(alice, 'patch', `/projects/${id}`, { status: 'paused', name: 'Example Inc' }).expect(200);

    const list = (await get(alice, '/projects').expect(200)).body.data;
    const item = map.toProjects(list).find((p) => p.id === id)!;
    expect(item).toMatchObject({ name: 'Example Inc', status: 'paused', keywords: 2, health: null, lastAudit: 'not run yet', traffic: '—' });
    await send(alice, 'patch', `/projects/${id}`, { status: 'active' }).expect(200);
    await get(alice, '/projects/not-a-uuid').expect(400);
  });

  it('projects: CSV import creates valid rows and reports skipped ones', async () => {
    const csv = 'website_url,name,country,keywords\nexample.org,Example Org,us,a;b\nnot a url,,,\nexample.org,Dup,,\n';
    const res = await request(app).post('/api/projects/import').set(as(alice)).attach('file', Buffer.from(csv), { filename: 'p.csv', contentType: 'text/csv' }).expect(200);
    expect(res.body.data.created).toHaveLength(1);
    expect(res.body.data.skipped.map((s: { row: number }) => s.row)).toEqual([3, 4]);
    created.push({ token: alice.token, id: res.body.data.created[0].id });
  });

  // ── Per-project data ──────────────────────────────────────────────────────

  it('keywords: add, de-duplicate, list, summary, delete', async () => {
    const pid = await newProject(alice, 'keywords-test.example.com', ['seo audit']);
    expect((await send(alice, 'post', '/keywords', { projectId: pid, keywords: ['seo audit', 'Backlink Checker'], device: 'mobile' }).expect(201)).body.data).toEqual({ added: 2, skipped: 0 });
    expect((await send(alice, 'post', '/keywords', { projectId: pid, keywords: ['seo audit'] }).expect(201)).body.data).toEqual({ added: 0, skipped: 1 });

    const list = (await get(alice, `/keywords?projectId=${pid}`).expect(200)).body.data;
    expect(list).toHaveLength(3);
    const rows = map.toKeywords(list);
    expect(rows.every((r) => r.rank === null && r.cpc === '—' && r.id)).toBe(true);
    expect(map.toKeywordSummary((await get(alice, `/keywords/summary?projectId=${pid}`).expect(200)).body.data)[0]).toEqual({
      label: 'Tracked Keywords',
      value: '3',
      change: null,
    });
    await send(alice, 'delete', `/keywords/${list[0].id}`).expect(204);
    expect((await get(alice, `/keywords?projectId=${pid}`)).body.data).toHaveLength(2);
    await get(alice, '/keywords').expect(400);
  });

  it('backlinks: add, duplicate, disavow, analytics, delete', async () => {
    const pid = await newProject(alice, 'links-test.example.com', ['link building']);
    const add = (body: object) => send(alice, 'post', '/backlinks', { projectId: pid, ...body });
    const first = (await add({ sourceUrl: 'https://news.site/a', targetPage: '/', anchorText: 'links-test', domainAuthority: 70 }).expect(201)).body.data;
    await add({ sourceUrl: 'https://news.site/b', targetPage: 'https://links-test.example.com/blog', anchorText: 'link building', linkType: 'nofollow' }).expect(201);
    await add({ sourceUrl: 'https://news.site/a', targetPage: '/' }).expect(409);
    await add({ sourceUrl: 'https://spam.site/x', targetPage: '/', disavow: true }).expect(201);
    await add({ sourceUrl: 'https://x.site/', targetPage: '/', domainAuthority: 101 }).expect(400);

    const rows = map.toBacklinks((await get(alice, `/backlinks?projectId=${pid}`).expect(200)).body.data);
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.source === 'spam.site')?.disavowed).toBe(true);
    expect(rows.find((r) => r.target === '/blog')?.type).toBe('Nofollow');

    expect((await get(alice, `/backlinks/stats?projectId=${pid}`)).body.data).toEqual({ total: 2, referringDomains: 1, newLast30Days: 2, disavowed: 1 });
    const anchors = map.toAnchorDistribution((await get(alice, `/backlinks/anchor-distribution?projectId=${pid}`)).body.data);
    expect(anchors.map((a) => a.name).sort()).toEqual(['Branded', 'Exact Match']);
    expect(map.toFollowNofollow((await get(alice, `/backlinks/follow-nofollow?projectId=${pid}`)).body.data).map((t) => t.value)).toEqual([50, 50]);
    expect((await get(alice, `/backlinks/top-domains?projectId=${pid}`)).body.data[0]).toEqual({ domain: 'news.site', backlinks: 2, authority: 70 });
    expect(map.toBacklinkGrowth((await get(alice, `/backlinks/growth?projectId=${pid}`)).body.data)).toHaveLength(6);

    await send(alice, 'delete', `/backlinks/${first.id}`).expect(204);
    expect((await get(alice, `/backlinks/stats?projectId=${pid}`)).body.data.total).toBe(1);
  });

  it('competitors: add, reject own domain and duplicates, list with own site, delete', async () => {
    const pid = await newProject(alice, 'comp-test.example.com');
    const rival = (await send(alice, 'post', '/competitors', { projectId: pid, domain: 'https://www.Rival.com/path', targetCountry: 'gb' }).expect(201)).body.data;
    expect(rival).toMatchObject({ domain: 'rival.com', displayName: 'rival.com', targetCountry: 'GB', trackingScope: 'organic' });
    await send(alice, 'post', '/competitors', { projectId: pid, domain: 'rival.com' }).expect(409);
    await send(alice, 'post', '/competitors', { projectId: pid, domain: 'comp-test.example.com' }).expect(400);

    const cards = map.toCompetitors((await get(alice, `/competitors?projectId=${pid}`).expect(200)).body.data);
    expect(cards.map((c) => [c.name, c.isYou])).toEqual([
      ['comp-test.example.com', true],
      ['rival.com', false],
    ]);
    expect(map.toComparison((await get(alice, `/competitors/keyword-comparison?projectId=${pid}`)).body.data).series).toHaveLength(2);
    expect((await get(alice, `/competitors/gap-analysis?projectId=${pid}`)).body.data).toEqual({ unique: null, shared: null, missed: null });
    await send(alice, 'delete', `/competitors/${rival.id}`).expect(204);
  });

  it('content: create, duplicate path, update, stats, delete', async () => {
    const pid = await newProject(alice, 'content-test.example.com');
    const item = (
      await send(alice, 'post', '/content', { projectId: pid, title: 'SEO Guide', urlPath: 'blog/seo-guide', targetKeywords: ['SEO', 'seo', 'guide'] }).expect(201)
    ).body.data;
    expect(item).toMatchObject({ urlPath: '/blog/seo-guide', status: 'draft', contentType: 'blog', targetKeywords: ['seo', 'guide'] });
    await send(alice, 'post', '/content', { projectId: pid, title: 'Again', urlPath: '/blog/seo-guide' }).expect(409);
    await send(alice, 'patch', `/content/${item.id}`, { status: 'published', title: 'The SEO Guide' }).expect(200);

    const rows = map.toContent((await get(alice, `/content?projectId=${pid}`).expect(200)).body.data);
    expect(rows[0]).toMatchObject({ title: 'The SEO Guide', status: 'Published', type: 'Blog', traffic: null, score: 0 });
    expect((await get(alice, `/content/stats?projectId=${pid}`)).body.data).toEqual({ total: 1, published: 1, needsUpdate: 0, drafts: 0 });
    await send(alice, 'delete', `/content/${item.id}`).expect(204);
  });

  it('site audit: real crawl job, status, issues, history, mark fixed, notification', async () => {
    const pid = await newProject(alice, 'https://example.com/audit-test');
    const run = (await send(alice, 'post', '/audit/runs', { projectId: pid, crawlDepth: 'quick', maxPages: 5 }).expect(202)).body.data;
    expect(run).toMatchObject({ status: 'pending', maxPages: 5 });
    await send(alice, 'post', '/audit/runs', { projectId: pid, crawlDepth: 'quick', maxPages: 5 }).expect(409);
    await jobs.idle();

    const done = (await get(alice, `/audit/runs/${run.id}`).expect(200)).body.data;
    expect(done.status, done.errorMessage ?? '').toBe('completed');
    expect(done.pagesCrawled).toBeGreaterThan(0);
    expect(done.healthScore).toBeGreaterThanOrEqual(0);

    const overview = map.toAuditOverview((await get(alice, `/audit/latest?projectId=${pid}`)).body.data);
    expect(overview).toMatchObject({ health: done.healthScore, runningId: null });
    expect(map.toAuditHistory((await get(alice, `/audit/history?projectId=${pid}`)).body.data)).toHaveLength(1);

    const checks = map.toAuditChecks((await get(alice, `/audit/checks?projectId=${pid}`).expect(200)).body.data);
    expect(checks.length).toBeGreaterThan(0);
    const issue = map.toIssueDetail((await get(alice, `/audit/issues/${checks[0].id}`).expect(200)).body.data);
    expect(issue.affectedPages.length).toBeGreaterThan(0);
    expect(issue.recommendations.length).toBeGreaterThan(0);
    expect((await send(alice, 'patch', `/audit/issues/${issue.id}`, { status: 'fixed' }).expect(200)).body.data.status).toBe('fixed');

    const project = map.toProjects((await get(alice, '/projects')).body.data).find((p) => p.id === pid)!;
    expect(project.health).toBe(done.healthScore);
    const notes = map.toNotifications((await get(alice, '/notifications')).body.data);
    expect(notes.items.some((n) => n.title.startsWith('Site audit complete'))).toBe(true);
    await send(alice, 'post', '/notifications/read-all').expect(204);
    expect((await get(alice, '/notifications')).body.data.unreadCount).toBe(0);
  }, 120_000);

  it('dashboard + activities reflect the project data', async () => {
    const pid = await newProject(alice, 'dash-test.example.com', ['one', 'two']);
    await send(alice, 'post', '/backlinks', { projectId: pid, sourceUrl: 'https://ref.site/', targetPage: '/' }).expect(201);
    await send(alice, 'post', '/competitors', { projectId: pid, domain: 'other.com' }).expect(201);

    const summary = map.toDashboard((await get(alice, `/dashboard/summary?projectId=${pid}`).expect(200)).body.data);
    const kpi = (id: string) => summary.kpis.find((k) => k.id === id)?.value;
    expect([kpi('tracked-keywords'), kpi('backlinks'), kpi('competitors'), kpi('site-health')]).toEqual(['2', '1', '1', '—']);
    expect(summary.trafficTrend).toEqual([]);
    expect(summary.competitors.map((c) => c.name)).toEqual(['dash-test.example.com', 'other.com']);

    const feed = map.toActivities((await get(alice, `/activities?projectId=${pid}`).expect(200)).body.data);
    expect(feed.map((a) => a.type)).toEqual(expect.arrayContaining(['project', 'backlink', 'competitor']));
    expect(feed.every((a) => /ago$/.test(a.time))).toBe(true);
  });

  it('reports: generate PDF/CSV/XLSX files in Storage and download them', async () => {
    const pid = await newProject(alice, 'report-test.example.com', ['seo']);
    const templates = map.toTemplates((await get(alice, '/reports/templates').expect(200)).body.data);
    expect(templates.map((t) => t.key)).toContain('executive-summary');

    const ids: string[] = [];
    for (const format of ['pdf', 'csv', 'xlsx']) {
      const res = await send(alice, 'post', '/reports', { projectId: pid, template: 'executive-summary', format, sections: ['KPIs', 'Keywords', 'Traffic'] }).expect(202);
      ids.push(res.body.data.id);
    }
    await jobs.idle();
    const reports = map.toReports((await get(alice, `/reports?projectId=${pid}`).expect(200)).body.data);
    expect(reports.map((r) => r.status)).toEqual(['Ready', 'Ready', 'Ready']);
    for (const id of ids) {
      const link = (await get(alice, `/reports/${id}/download`).expect(200)).body.data;
      const file = await fetch(link.url);
      expect(file.status).toBe(200);
      expect((await file.arrayBuffer()).byteLength).toBeGreaterThan(100);
    }
    await send(alice, 'post', '/reports', { projectId: pid, template: 'nope', sections: ['KPIs'] }).expect(400);
  }, 120_000);

  it('settings: notification preferences persist; integrations and billing are honest', async () => {
    const prefs = (await get(alice, '/settings/notifications').expect(200)).body.data;
    expect(prefs).toHaveLength(7);
    await send(alice, 'put', '/settings/notifications/report_ready', { email: false, push: true }).expect(200);
    await send(alice, 'put', '/settings/notifications/bogus', { email: false, push: true }).expect(400);
    const after = map.toNotificationSettings((await get(alice, '/settings/notifications')).body.data);
    expect(after.find((p) => p.key === 'report_ready')).toMatchObject({ email: false, push: true, label: 'Report ready' });
    expect((await get(bob, '/settings/notifications')).body.data.find((p: { key: string }) => p.key === 'report_ready')).toMatchObject({ email: true, push: false });

    expect(map.toIntegrations((await get(alice, '/settings/integrations')).body.data).every((i) => i.connected === false && i.available === false)).toBe(true);
    const billing = map.toBilling((await get(alice, '/settings/billing')).body.data);
    expect(billing).toMatchObject({ name: 'Free Plan', price: null, billingAvailable: false });
  });

  it('avatar: upload to Storage, signed URL, remove', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const res = await request(app).post('/api/profile/avatar').set(as(alice)).attach('avatar', png, { filename: 'a.png', contentType: 'image/png' }).expect(200);
    expect(res.body.data.avatarUrl).toMatch(/^https?:\/\//);
    expect((await fetch(res.body.data.avatarUrl)).status).toBe(200);
    await request(app).post('/api/profile/avatar').set(as(alice)).attach('avatar', Buffer.from('not an image'), { filename: 'a.png', contentType: 'image/png' }).expect(400);
    expect((await send(alice, 'delete', '/profile/avatar').expect(200)).body.data.avatarUrl).toBeNull();
  });

  // ── Isolation ─────────────────────────────────────────────────────────────

  it("isolation: Bob can't read or change any of Alice's data", async () => {
    const pid = await newProject(alice, 'private.example.com', ['secret keyword']);
    const kw = (await get(alice, `/keywords?projectId=${pid}`)).body.data[0];
    const bl = (await send(alice, 'post', '/backlinks', { projectId: pid, sourceUrl: 'https://a.site/', targetPage: '/' })).body.data;
    const cp = (await send(alice, 'post', '/competitors', { projectId: pid, domain: 'c.com' })).body.data;
    const ct = (await send(alice, 'post', '/content', { projectId: pid, title: 'T', urlPath: '/t' })).body.data;
    const rp = (await send(alice, 'post', '/reports', { projectId: pid, template: 'keyword-performance', format: 'csv', sections: ['Keywords'] })).body.data;
    await jobs.idle();

    expect((await get(bob, '/projects').expect(200)).body.data).toEqual([]);
    for (const path of [
      `/projects/${pid}`,
      `/dashboard/summary?projectId=${pid}`,
      `/keywords?projectId=${pid}`,
      `/backlinks?projectId=${pid}`,
      `/competitors?projectId=${pid}`,
      `/content?projectId=${pid}`,
      `/reports?projectId=${pid}`,
      `/audit/checks?projectId=${pid}`,
      `/ai-seo/metrics?projectId=${pid}`,
      `/reports/${rp.id}`,
      `/reports/${rp.id}/download`,
    ]) {
      expect((await get(bob, path)).status, path).toBe(404);
    }
    expect((await get(bob, `/activities?projectId=${pid}`)).body.data).toEqual([]);
    expect((await send(bob, 'patch', `/projects/${pid}`, { name: 'hacked' })).status).toBe(404);
    expect((await send(bob, 'post', '/keywords', { projectId: pid, keywords: ['x'] })).status).toBe(404);
    expect((await send(bob, 'post', '/audit/runs', { projectId: pid, crawlDepth: 'quick' })).status).toBe(404);
    expect((await send(bob, 'patch', `/content/${ct.id}`, { title: 'x' })).status).toBe(404);
    for (const path of [`/keywords/${kw.id}`, `/backlinks/${bl.id}`, `/competitors/${cp.id}`, `/content/${ct.id}`, `/projects/${pid}`]) {
      expect((await send(bob, 'delete', path)).status, path).toBe(404);
    }

    // Going around the API with Bob's token is blocked by row-level security.
    for (const table of ['projects', 'project_keywords', 'backlinks', 'competitors', 'content_pages', 'reports', 'activities']) {
      const { data, error } = await bob.client.from(table).select('id');
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
    const storage = await bob.client.storage.from('reports').list(alice.email);
    expect(storage.data ?? []).toEqual([]);

    // Alice still has everything.
    expect((await get(alice, `/keywords?projectId=${pid}`)).body.data).toHaveLength(1);
    expect((await get(alice, `/content?projectId=${pid}`)).body.data[0].title).toBe('T');
  }, 60_000);

  it('project scoping: data of one project never shows up in another', async () => {
    const a = await newProject(alice, 'scope-a.example.com', ['only in a']);
    const b = await newProject(alice, 'scope-b.example.com', ['only in b']);
    await send(alice, 'post', '/content', { projectId: a, title: 'A page', urlPath: '/a' }).expect(201);
    const kwB = (await get(alice, `/keywords?projectId=${b}`)).body.data.map((k: { keyword: string }) => k.keyword);
    expect(kwB).toEqual(['only in b']);
    expect((await get(alice, `/content?projectId=${b}`)).body.data).toEqual([]);
    expect((await get(alice, `/dashboard/summary?projectId=${b}`)).body.data.project.name).toBe('scope-b.example.com');
  });

  it('persistence: a new session sees the same data; deleting removes everything', async () => {
    const pid = await newProject(alice, 'persist.example.com', ['k']);
    const fresh = await alice.client.auth.signInWithPassword({ email: alice.email, password: PASSWORD });
    const again: TestUser = { ...alice, token: fresh.data.session!.access_token };
    expect((await get(again, '/projects')).body.data.some((p: { id: string }) => p.id === pid)).toBe(true);
    await send(again, 'delete', `/projects/${pid}`).expect(204);
    await get(again, `/keywords?projectId=${pid}`).expect(404);
  });
});
