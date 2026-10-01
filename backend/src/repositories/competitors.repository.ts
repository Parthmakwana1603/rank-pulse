import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export interface CompetitorRow {
  id: string;
  project_id: string;
  domain: string;
  display_name: string;
  target_country: string | null;
  tracking_scope: 'organic' | 'paid' | 'all';
  created_at: string;
}

export async function listCompetitors(db: SupabaseClient, projectId: string): Promise<CompetitorRow[]> {
  return unwrap(
    await db.from('competitors').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
  ) as CompetitorRow[];
}

export async function insertCompetitor(
  db: SupabaseClient,
  row: Omit<CompetitorRow, 'id' | 'created_at'>
): Promise<CompetitorRow> {
  return unwrap(
    await db.from('competitors').insert(row).select('*').single(),
    'You already track this competitor.'
  ) as CompetitorRow;
}

export async function deleteCompetitor(db: SupabaseClient, id: string): Promise<boolean> {
  const rows = unwrap(await db.from('competitors').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}
