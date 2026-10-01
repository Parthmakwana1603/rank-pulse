import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export type LinkType = 'follow' | 'nofollow' | 'ugc' | 'sponsored';

export interface BacklinkRow {
  id: string;
  project_id: string;
  source_url: string;
  source_domain: string;
  target_page: string;
  anchor_text: string;
  link_type: LinkType;
  domain_authority: number | null;
  notes: string | null;
  disavowed: boolean;
  disavowed_at: string | null;
  first_seen_at: string;
  created_at: string;
}

export async function listBacklinks(db: SupabaseClient, projectId: string): Promise<BacklinkRow[]> {
  return unwrap(
    await db.from('backlinks').select('*').eq('project_id', projectId).order('first_seen_at', { ascending: false })
  ) as BacklinkRow[];
}

export async function findBacklink(
  db: SupabaseClient,
  projectId: string,
  sourceUrl: string,
  targetPage: string
): Promise<BacklinkRow | null> {
  return unwrap(
    await db
      .from('backlinks')
      .select('*')
      .eq('project_id', projectId)
      .eq('source_url', sourceUrl)
      .eq('target_page', targetPage)
      .maybeSingle()
  ) as BacklinkRow | null;
}

export async function insertBacklink(
  db: SupabaseClient,
  row: Omit<BacklinkRow, 'id' | 'first_seen_at' | 'created_at'>
): Promise<BacklinkRow> {
  return unwrap(
    await db.from('backlinks').insert(row).select('*').single(),
    'This backlink is already recorded.'
  ) as BacklinkRow;
}

export async function updateBacklink(db: SupabaseClient, id: string, patch: Partial<BacklinkRow>): Promise<BacklinkRow> {
  return unwrap(await db.from('backlinks').update(patch).eq('id', id).select('*').single()) as BacklinkRow;
}

export async function deleteBacklink(db: SupabaseClient, id: string): Promise<boolean> {
  const rows = unwrap(await db.from('backlinks').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}
