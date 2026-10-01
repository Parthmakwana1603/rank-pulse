import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

/** Anonymous client, used only to verify access tokens. */
export const anonClient: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: noSession });

/**
 * A client that acts as the signed-in user: every query carries their access token, so the
 * database's row-level security decides what they can read and write.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
