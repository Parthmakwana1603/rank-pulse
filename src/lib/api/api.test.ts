import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UseQueryResult } from '@tanstack/react-query';
import { mockRoutes } from './mock';
import { combine, endpoints } from './queries';
import * as map from './mappers';
import * as seo from '@/lib/seo-data';

const SUPABASE = { url: 'https://example.supabase.co', key: 'anon-key-for-tests' };

/** Loads a fresh copy of the client with the given env (and optionally a signed-in session). */
async function loadClient(opts: { apiUrl?: string; supabase?: boolean; token?: string } = {}) {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', opts.apiUrl ?? '');
  vi.stubEnv('VITE_SUPABASE_URL', opts.supabase ? SUPABASE.url : '');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', opts.supabase ? SUPABASE.key : '');
  if (opts.token) {
    vi.doMock('@/lib/supabase', () => ({
      supabase: { auth: { getSession: async () => ({ data: { session: { access_token: opts.token } } }) } },
    }));
  }
  return import('./client');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.doUnmock('@/lib/supabase');
});

describe('demo mode (no Supabase)', () => {
  it('has demo data for every endpoint the hooks call', () => {
    const paths = Object.values(endpoints).map((e) => e.path);
    expect(paths.length).toBeGreaterThan(25);
    for (const path of paths) expect(mockRoutes, path).toHaveProperty([path]);
  });

  it('serves demo data with ids for a known path', async () => {
    const { apiGet, dataMode } = await loadClient();
    expect(dataMode).toBe('demo');
    const rows = await apiGet<seo.KeywordFull[]>('/keywords');
    expect(rows.map((r) => r.keyword)).toEqual(seo.keywordFullTable.map((k) => k.keyword));
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it('returns a copy, so callers cannot mutate the shared demo data', async () => {
    const { apiGet } = await loadClient();
    const rows = await apiGet<seo.KeywordFull[]>('/keywords');
    rows[0].keyword = 'changed';
    expect(seo.keywordFullTable[0].keyword).not.toBe('changed');
  });

  it('rejects unknown paths with a 404 ApiError', async () => {
    const { apiGet, ApiError } = await loadClient();
    const err = await apiGet<never>('/nope').catch((e: InstanceType<typeof ApiError>) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });

  it('refuses writes with an explanation instead of pretending to save', async () => {
    const { apiSend } = await loadClient();
    await expect(apiSend('POST', '/keywords', {})).rejects.toMatchObject({ message: expect.stringContaining('demo mode') });
  });
});

describe('API mode (Supabase + VITE_API_URL)', () => {
  const respond = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it('requests base URL + path with query parameters and unwraps the envelope', async () => {
    const fetchMock = respond(200, { success: true, data: [{ id: 1 }] });
    vi.stubGlobal('fetch', fetchMock);
    const { apiGet, dataMode } = await loadClient({ apiUrl: 'https://api.example.com/api/', supabase: true });
    expect(dataMode).toBe('api');
    await expect(apiGet('/keywords', { query: { projectId: 'p 1', empty: undefined } })).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/keywords?projectId=p+1', expect.anything());
  });

  it('sends the Supabase access token as a bearer token and no cookies', async () => {
    const fetchMock = respond(200, { success: true, data: {} });
    vi.stubGlobal('fetch', fetchMock);
    const { apiSend } = await loadClient({ apiUrl: 'https://api.example.com/api', supabase: true, token: 'jwt-123' });
    await apiSend('POST', '/keywords', { projectId: 'p1' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: 'Bearer jwt-123', 'Content-Type': 'application/json' });
    expect(init.credentials).toBe('omit');
    expect(init.body).toBe(JSON.stringify({ projectId: 'p1' }));
  });

  it('fetches scoped endpoints with the project id and maps the response', async () => {
    const fetchMock = respond(200, { success: true, data: { tracked: 4, addedLast30Days: 1, top10: null, top3: null, lost: null, averagePosition: null } });
    vi.stubGlobal('fetch', fetchMock);
    const { fetchEndpoint } = await loadClient({ apiUrl: 'https://api.example.com/api', supabase: true });
    const cards = await fetchEndpoint(endpoints.keywordSummary, 'proj-1');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/keywords/summary?projectId=proj-1');
    expect(cards[0]).toEqual({ label: 'Tracked Keywords', value: '4', change: null });
    expect(cards[2].value).toBe('—');
  });

  it('explains a missing API URL instead of showing sample data', async () => {
    const { apiGet } = await loadClient({ supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: expect.stringContaining('VITE_API_URL') });
  });

  it('surfaces the server message on an error status', async () => {
    vi.stubGlobal('fetch', respond(403, { success: false, message: 'Forbidden project' }));
    const { apiGet } = await loadClient({ apiUrl: 'https://api.example.com', supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Forbidden project', status: 403 });
  });

  it('also reads { error: { message } } error bodies', async () => {
    vi.stubGlobal('fetch', respond(409, { success: false, error: { code: 'CONFLICT', message: 'Already tracked' } }));
    const { apiGet } = await loadClient({ apiUrl: 'https://api.example.com', supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Already tracked', status: 409 });
  });

  it('treats success: false as an error even with a 200', async () => {
    vi.stubGlobal('fetch', respond(200, { success: false, message: 'Nope' }));
    const { apiGet } = await loadClient({ apiUrl: 'https://api.example.com', supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Nope' });
  });

  it('handles a non-JSON error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 })));
    const { apiGet } = await loadClient({ apiUrl: 'https://api.example.com', supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Request failed (502)', status: 502 });
  });

  it('explains an expired session on a bare 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const { apiGet } = await loadClient({ apiUrl: 'https://api.example.com', supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: expect.stringContaining('sign in again'), status: 401 });
  });

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { apiGet } = await loadClient({ apiUrl: 'https://api.example.com', supabase: true });
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: expect.stringContaining('Could not reach') });
  });
});

describe('mappers', () => {
  it('turn a dashboard summary into screen data without inventing numbers', () => {
    const summary = map.toDashboard({
      project: { id: 'p', name: 'x.com', websiteUrl: 'https://x.com', lastAuditAt: null },
      kpis: [
        { key: 'site-health', value: 80, previous: 64, history: [64, 80] },
        { key: 'backlinks', value: null, previous: null, history: [] },
      ],
      keywords: [],
      auditIssues: [
        { id: 'i1', auditId: 'a', checkKey: 'missing_title', type: 'error', title: 'Missing Meta Title', description: '', occurrences: 2, pages: 2, status: 'open', fixedAt: null },
        { id: 'i2', auditId: 'a', checkKey: 'thin_content', type: 'notice', title: 'Thin Content', description: '', occurrences: 1, pages: 1, status: 'fixed', fixedAt: null },
      ],
      backlinks: {
        stats: { total: 3, referringDomains: 2, newLast30Days: 1, disavowed: 0 },
        anchors: [{ category: 'branded', count: 1 }, { category: 'generic', count: 3 }],
        linkTypes: [{ type: 'follow', count: 3 }],
        topDomains: [],
      },
      competitors: [],
      traffic: null,
      coreWebVitals: null,
      aiSeo: null,
    });
    expect(summary.kpis[0]).toMatchObject({ label: 'Site Health', value: '80%', change: 25, trend: [64, 80] });
    expect(summary.kpis[1]).toMatchObject({ value: '—', change: null });
    expect(summary.trafficTrend).toEqual([]);
    expect(summary.auditIssues).toEqual([{ id: 'i1', type: 'error', title: 'Missing Meta Title', count: 2 }]);
    expect(summary.anchorTextDistribution.map((a) => [a.name, a.value])).toEqual([
      ['Branded', 25],
      ['Generic', 75],
    ]);
  });

  it('label report statuses and file sizes', () => {
    const report = map.toReport({
      id: 'r',
      projectId: 'p',
      name: 'Technical Audit — x.com',
      template: 'technical-audit',
      format: 'pdf',
      dateRangeDays: 30,
      sections: ['Site Audit'],
      status: 'completed',
      fileSize: 2_400_000,
      errorMessage: null,
      createdAt: '2026-09-30T10:00:00Z',
      completedAt: '2026-09-30T10:00:05Z',
    });
    expect(report).toMatchObject({ type: 'Audit', status: 'Ready', size: '2.3 MB', date: 'Sep 30, 2026' });
  });
});

describe('combine', () => {
  const result = (partial: Partial<UseQueryResult<unknown, Error>>) =>
    ({ data: undefined, error: null, refetch: vi.fn(), ...partial }) as unknown as UseQueryResult<unknown, Error>;

  it('has data only once every query has data', () => {
    expect(combine({ a: result({ data: 1 }), b: result({}) })).toMatchObject({ data: undefined, isPending: true });
    expect(combine({ a: result({ data: 1 }), b: result({ data: 2 }) })).toMatchObject({
      data: { a: 1, b: 2 },
      isPending: false,
      error: null,
    });
  });

  it('reports the first error and stops being pending', () => {
    const boom = new Error('boom');
    expect(combine({ a: result({ data: 1 }), b: result({ error: boom }) })).toMatchObject({
      data: undefined,
      error: boom,
      isPending: false,
    });
  });

  it('refetch only retries the queries that failed or have no data', () => {
    const ok = result({ data: 1 });
    const failed = result({ error: new Error('x') });
    combine({ ok, failed }).refetch();
    expect(ok.refetch).not.toHaveBeenCalled();
    expect(failed.refetch).toHaveBeenCalled();
  });
});
