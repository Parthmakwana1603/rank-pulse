import { supabase } from '@/lib/supabase';
import { ApiError } from './errors';
import { baseUrl, httpRequest, type Query } from './http';
import { mockDynamic, mockRoutes } from './mock';

export { ApiError };

/**
 * Where data comes from:
 * - 'demo': no Supabase keys configured. Any login works and every screen shows the built-in
 *   sample data (src/lib/seo-data.ts); only projects can be created/deleted (in memory).
 * - 'api': real accounts (Supabase Auth) and real data from the RankPulse API at VITE_API_URL.
 */
export const dataMode: 'demo' | 'api' = supabase ? 'api' : 'demo';

export const DEMO_WRITE_MESSAGE =
  'This is demo mode, so changes can’t be saved. Connect Supabase and the RankPulse API to save your work.';
const MISSING_API_MESSAGE =
  'The API address isn’t configured. Set VITE_API_URL (see .env.example) and restart the app.';

async function mockGet<T>(path: string): Promise<T> {
  const handler = mockRoutes[path];
  const data = handler ? handler() : mockDynamic(path);
  if (data === undefined) throw new ApiError(`No mock data for ${path}`, 404);
  // Clone so callers can't mutate the shared mock data.
  return structuredClone(data) as T;
}

/** GET from the API (or the demo data). Returns the API's raw response. */
export function apiGet<T>(path: string, opts: { query?: Query; signal?: AbortSignal } = {}): Promise<T> {
  if (dataMode === 'demo') return mockGet<T>(path);
  if (!baseUrl) return Promise.reject(new ApiError(MISSING_API_MESSAGE));
  return httpRequest<T>('GET', path, opts);
}

/** A write to the API. In demo mode writes are rejected with an explanation. */
export function apiSend<T>(method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  if (dataMode === 'demo') return Promise.reject(new ApiError(DEMO_WRITE_MESSAGE, 400));
  if (!baseUrl) return Promise.reject(new ApiError(MISSING_API_MESSAGE));
  return httpRequest<T>(method, path, { body });
}

/** Uploads a file as multipart/form-data under `field`. */
export function apiUpload<T>(path: string, field: string, file: File): Promise<T> {
  if (dataMode === 'demo') return Promise.reject(new ApiError(DEMO_WRITE_MESSAGE, 400));
  if (!baseUrl) return Promise.reject(new ApiError(MISSING_API_MESSAGE));
  const form = new FormData();
  form.append(field, file);
  return httpRequest<T>('POST', path, { body: form });
}

/**
 * A GET endpoint: its path, whether it needs ?projectId=, and how to turn the API response into
 * the shape the screens render. Demo data is already in that shape.
 */
export interface Endpoint<Raw, View> {
  path: string;
  scoped: boolean;
  map: (raw: Raw) => View;
}

export async function fetchEndpoint<Raw, View>(
  endpoint: Endpoint<Raw, View>,
  projectId: string | undefined,
  signal?: AbortSignal
): Promise<View> {
  if (dataMode === 'demo') return mockGet<View>(endpoint.path);
  const raw = await apiGet<Raw>(endpoint.path, { query: endpoint.scoped ? { projectId } : undefined, signal });
  return endpoint.map(raw);
}
