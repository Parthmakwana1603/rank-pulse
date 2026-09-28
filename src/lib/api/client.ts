import { mockRoutes } from './mock';

// Set VITE_API_URL (e.g. https://api.example.com/api/v1) to call a real backend.
// Without it, requests are served from the in-memory mock data.
const baseUrl: string | undefined = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Response envelope defined in BACKEND_SPECIFICATION.md §23. */
interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

async function httpGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl!.replace(/\/$/, '')}${path}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  }

  let body: Envelope<T> | undefined;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    // Non-JSON body; fall through to the status check.
  }
  if (!res.ok || !body || body.success === false) {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status);
  }
  return body.data;
}

async function mockGet<T>(path: string): Promise<T> {
  const handler = mockRoutes[path];
  if (!handler) throw new ApiError(`No mock data for ${path}`, 404);
  // Clone so callers can't mutate the shared mock data.
  return structuredClone(handler()) as T;
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return baseUrl ? httpGet<T>(path, signal) : mockGet<T>(path);
}
