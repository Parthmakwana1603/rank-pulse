import { ApiError } from './errors';

// Set VITE_API_URL (e.g. https://api.example.com/api/v1) to call a custom REST backend.
export const baseUrl: string | undefined = import.meta.env.VITE_API_URL || undefined;

/** Response envelope defined in BACKEND_SPECIFICATION.md §23. */
interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export async function httpRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl!.replace(/\/$/, '')}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
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
    throw new ApiError(parsed?.message ?? `Request failed (${res.status})`, res.status);
  }
  return parsed.data;
}
