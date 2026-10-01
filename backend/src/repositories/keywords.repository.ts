import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export interface KeywordRow {
  id: string;
  project_id: string;
  keyword: string;
  search_engine: 'google' | 'bing' | 'yahoo';
  device: 'desktop' | 'mobile';
  created_at: string;
}

export async function listKeywords(db: SupabaseClient, projectId: string): Promise<KeywordRow[]> {
  return unwrap(
    await db
      .from('project_keywords')
      .select('id, project_id, keyword, search_engine, device, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .order('keyword', { ascending: true })
  ) as KeywordRow[];
}

/** Inserts keywords, silently skipping ones already tracked with the same engine and device. */
export async function insertKeywords(
  db: SupabaseClient,
  rows: Pick<KeywordRow, 'project_id' | 'keyword' | 'search_engine' | 'device'>[]
): Promise<KeywordRow[]> {
  return unwrap(
    await db
      .from('project_keywords')
      .upsert(rows, { onConflict: 'project_id,keyword,search_engine,device', ignoreDuplicates: true })
      .select('id, project_id, keyword, search_engine, device, created_at')
  ) as KeywordRow[];
}

export async function deleteKeyword(db: SupabaseClient, id: string): Promise<boolean> {
  const rows = unwrap(await db.from('project_keywords').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}

export async function countKeywords(db: SupabaseClient, projectId?: string): Promise<number> {
  let query = db.from('project_keywords').select('id', { count: 'exact', head: true });
  if (projectId) query = query.eq('project_id', projectId);
  const { count, error } = await query;
  unwrap({ data: null, error });
  return count ?? 0;
}
