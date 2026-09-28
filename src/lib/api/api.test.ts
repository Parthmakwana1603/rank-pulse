import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UseQueryResult } from '@tanstack/react-query';
import { mockRoutes } from './mock';
import { combine } from './queries';
import queriesSource from './queries.ts?raw';
import * as seo from '@/lib/seo-data';

async function loadClient(apiUrl?: string) {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', apiUrl ?? '');
  return import('./client');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('mock mode (no VITE_API_URL)', () => {
  it('has a mock route for every endpoint the hooks call', () => {
    const paths = [...queriesSource.matchAll(/useApi<[^>]+>\(\s*'([^']+)'/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) expect(mockRoutes, path).toHaveProperty([path]);
  });

  it('serves mock data for a known path', async () => {
    const { apiGet } = await loadClient();
    await expect(apiGet('/keywords')).resolves.toEqual(seo.keywordFullTable);
  });

  it('returns a copy, so callers cannot mutate the shared mock data', async () => {
    const { apiGet } = await loadClient();
    const rows = await apiGet<typeof seo.keywordFullTable>('/keywords');
    rows[0].keyword = 'changed';
    expect(seo.keywordFullTable[0].keyword).not.toBe('changed');
  });

  it('rejects unknown paths with a 404 ApiError', async () => {
    const { apiGet, ApiError } = await loadClient();
    const err = await apiGet<never>('/nope').catch((e: InstanceType<typeof ApiError>) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
  });
});

describe('HTTP mode (VITE_API_URL set)', () => {
  const respond = (status: number, body: unknown) =>
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it('requests base URL + path and unwraps the envelope', async () => {
    const fetchMock = respond(200, { success: true, data: [{ id: 1 }] });
    vi.stubGlobal('fetch', fetchMock);
    const { apiGet } = await loadClient('https://api.example.com/api/v1/');
    await expect(apiGet('/projects')).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/api/v1/projects', expect.anything());
  });

  it('surfaces the server message on an error status', async () => {
    vi.stubGlobal('fetch', respond(403, { success: false, message: 'Forbidden project' }));
    const { apiGet } = await loadClient('https://api.example.com');
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Forbidden project', status: 403 });
  });

  it('treats success: false as an error even with a 200', async () => {
    vi.stubGlobal('fetch', respond(200, { success: false, message: 'Nope' }));
    const { apiGet } = await loadClient('https://api.example.com');
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Nope' });
  });

  it('handles a non-JSON error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 })));
    const { apiGet } = await loadClient('https://api.example.com');
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: 'Request failed (502)', status: 502 });
  });

  it('reports network failures in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { apiGet } = await loadClient('https://api.example.com');
    await expect(apiGet('/projects')).rejects.toMatchObject({ message: expect.stringContaining('Could not reach') });
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
