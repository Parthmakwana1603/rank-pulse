import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export type ReportFormat = 'pdf' | 'csv' | 'xlsx';

export interface ReportRow {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  template: string;
  format: ReportFormat;
  date_range_days: 7 | 30 | 90;
  sections: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  file_path: string | null;
  file_size: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function insertReport(
  db: SupabaseClient,
  row: Pick<ReportRow, 'project_id' | 'name' | 'template' | 'format' | 'date_range_days' | 'sections'>
): Promise<ReportRow> {
  return unwrap(await db.from('reports').insert(row).select('*').single()) as ReportRow;
}

export async function findReport(db: SupabaseClient, id: string): Promise<ReportRow | null> {
  return unwrap(await db.from('reports').select('*').eq('id', id).maybeSingle()) as ReportRow | null;
}

export async function listReports(db: SupabaseClient, projectId: string, limit: number): Promise<ReportRow[]> {
  return unwrap(
    await db.from('reports').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(limit)
  ) as ReportRow[];
}

export async function updateReport(db: SupabaseClient, id: string, patch: Partial<ReportRow>): Promise<void> {
  unwrap(await db.from('reports').update(patch).eq('id', id));
}

export async function countReportsSince(db: SupabaseClient, since: string): Promise<number> {
  const { count, error } = await db.from('reports').select('id', { count: 'exact', head: true }).gte('created_at', since);
  unwrap({ data: null, error });
  return count ?? 0;
}
