import { anonClient } from '../config/supabase.js';
import { HttpError, unauthorized } from '../utils/http-error.js';

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Verifies a Supabase access token with Supabase Auth and returns the user it belongs to.
 * Asking Supabase (rather than only checking the signature) also rejects tokens of users who
 * have signed out everywhere or been deleted.
 */
export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const { data, error } = await anonClient.auth.getUser(token);
  if (error) {
    const status = (error as { status?: number }).status;
    if (status && status < 500) throw unauthorized('Your session has expired. Please sign in again.');
    throw new HttpError(503, 'Could not verify your session right now. Please try again.');
  }
  if (!data.user) throw unauthorized('Your session has expired. Please sign in again.');
  return { id: data.user.id, email: data.user.email ?? '' };
}
