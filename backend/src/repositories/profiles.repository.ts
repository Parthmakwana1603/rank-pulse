import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'member' | 'viewer';
  plan: 'free' | 'pro' | 'enterprise';
  profile_image: string | null;
  company: string | null;
  job_title: string | null;
}

const columns = 'id, email, name, role, plan, profile_image, company, job_title';

export async function findProfile(db: SupabaseClient, id: string): Promise<ProfileRow | null> {
  return unwrap(await db.from('profiles').select(columns).eq('id', id).maybeSingle()) as ProfileRow | null;
}

/** Only these columns are writable by users (column grants in the migration). */
export async function updateProfile(
  db: SupabaseClient,
  id: string,
  patch: Partial<Pick<ProfileRow, 'name' | 'company' | 'job_title' | 'profile_image'>>
): Promise<ProfileRow | null> {
  return unwrap(await db.from('profiles').update(patch).eq('id', id).select(columns).maybeSingle()) as ProfileRow | null;
}
