import { supabase } from '@/lib/supabase';
import { ApiError } from './errors';
import { baseUrl, httpRequest } from './http';
import { mockRoutes } from './mock';
import { supabaseRoutes } from './projects';

export { ApiError };

async function mockGet<T>(path: string): Promise<T> {
  const handler = mockRoutes[path];
  if (!handler) throw new ApiError(`No mock data for ${path}`, 404);
  // Clone so callers can't mutate the shared mock data.
  return structuredClone(handler()) as T;
}

/**
 * Loads data for an API path. Sources, in order: Supabase (for paths it serves so far),
 * the REST API at VITE_API_URL, then the built-in mock data.
 */
export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const fromSupabase = supabase ? supabaseRoutes[path] : undefined;
  if (fromSupabase) return fromSupabase() as Promise<T>;
  return baseUrl ? httpRequest<T>('GET', path, undefined, signal) : mockGet<T>(path);
}
