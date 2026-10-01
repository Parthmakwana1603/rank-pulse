import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export interface ContentRow {
  id: string;
  project_id: string;
  title: string;
  url_path: string;
  content_type: 'blog' | 'landing' | 'tool' | 'guide';
  status: 'draft' | 'published' | 'needs-update' | 'outdated';
  primary_keyword: string | null;
  target_keywords: string[];
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

const DUPLICATE = 'This project already has content at that URL.';

export async function listContent(db: SupabaseClient, projectId: string): Promise<ContentRow[]> {
  return unwrap(
    await db.from('content_pages').select('*').eq('project_id', projectId).order('updated_at', { ascending: false })
  ) as ContentRow[];
}

export async function findContent(db: SupabaseClient, id: string): Promise<ContentRow | null> {
  return unwrap(await db.from('content_pages').select('*').eq('id', id).maybeSingle()) as ContentRow | null;
}

export async function insertContent(
  db: SupabaseClient,
  row: Omit<ContentRow, 'id' | 'created_at' | 'updated_at'>
): Promise<ContentRow> {
  return unwrap(await db.from('content_pages').insert(row).select('*').single(), DUPLICATE) as ContentRow;
}

export async function updateContent(
  db: SupabaseClient,
  id: string,
  patch: Partial<Omit<ContentRow, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<ContentRow | null> {
  return unwrap(
    await db.from('content_pages').update(patch).eq('id', id).select('*').maybeSingle(),
    DUPLICATE
  ) as ContentRow | null;
}

export async function deleteContent(db: SupabaseClient, id: string): Promise<boolean> {
  const rows = unwrap(await db.from('content_pages').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}
