import { supabase } from '@/lib/supabase';
import { ApiError } from './errors';

// Base URL of the RankPulse API, e.g. http://localhost:5000/api (see backend/README.md).
export const baseUrl: string | undefined = import.meta.env.VITE_API_URL || undefined;

/** Response envelope of the API: { success, data } or { success: false, message }. */
interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
  /** Also accept { error: { message } } (BACKEND_SPECIFICATION.md §22). */
  error?: { message?: string };
}

export type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  /** JSON-serialisable value, or FormData for file uploads. */
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
}

/** The signed-in user's Supabase access token (refreshed by supabase-js when needed). */
async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function buildUrl(path: string, query?: Query) {
  const url = `${baseUrl!.replace(/\/$/, '')}${path}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function httpRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  { body, query, signal }: RequestOptions = {}
): Promise<T> {
  const token = await accessToken();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined || isForm ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      // Auth travels in the Authorization header; no cookies are needed (or sent).
      credentials: 'omit',
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  let parsed: Envelope<T> | undefined;
  try {
    parsed = (await res.json()) as Envelope<T>;
  } catch {
    // Non-JSON body; fall through to the status check.
  }
  if (!res.ok || !parsed || parsed.success === false) {
    const message =
      parsed?.message ??
      parsed?.error?.message ??
      (res.status === 401 ? 'Your session has expired. Please sign in again.' : `Request failed (${res.status})`);
    throw new ApiError(message, res.status);
  }
  return parsed.data;
}
