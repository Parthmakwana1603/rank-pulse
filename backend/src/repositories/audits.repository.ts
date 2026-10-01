import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed';
export type IssueType = 'error' | 'warning' | 'notice';

export interface AuditRunRow {
  id: string;
  project_id: string;
  status: AuditStatus;
  phase: 'queued' | 'crawling' | 'analyzing' | 'done' | null;
  crawl_depth: 'quick' | 'standard' | 'full';
  max_pages: number;
  user_agent: 'desktop' | 'mobile' | 'googlebot';
  pages_crawled: number;
  health_score: number | null;
  errors: number;
  warnings: number;
  notices: number;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface AuditIssueRow {
  id: string;
  audit_id: string;
  project_id: string;
  check_key: string;
  type: IssueType;
  title: string;
  description: string;
  occurrences: number;
  pages: number;
  status: 'open' | 'fixed';
  fixed_at: string | null;
}

export interface AuditIssuePageRow {
  url: string;
  status_code: number | null;
  detail: string | null;
}

const ACTIVE = 'An audit is already running for this project. Wait for it to finish.';

export async function insertAuditRun(
  db: SupabaseClient,
  row: Pick<AuditRunRow, 'project_id' | 'crawl_depth' | 'max_pages' | 'user_agent'>
): Promise<AuditRunRow> {
  return unwrap(await db.from('audit_runs').insert({ ...row, phase: 'queued' }).select('*').single(), ACTIVE) as AuditRunRow;
}

export async function findAuditRun(db: SupabaseClient, id: string): Promise<AuditRunRow | null> {
  return unwrap(await db.from('audit_runs').select('*').eq('id', id).maybeSingle()) as AuditRunRow | null;
}

export async function updateAuditRun(db: SupabaseClient, id: string, patch: Partial<AuditRunRow>): Promise<void> {
  unwrap(await db.from('audit_runs').update(patch).eq('id', id));
}

export async function listAuditRuns(
  db: SupabaseClient,
  projectId: string,
  opts: { status?: AuditStatus; limit: number }
): Promise<AuditRunRow[]> {
  let query = db.from('audit_runs').select('*').eq('project_id', projectId);
  if (opts.status) query = query.eq('status', opts.status);
  return unwrap(await query.order('created_at', { ascending: false }).limit(opts.limit)) as AuditRunRow[];
}

export async function insertIssues(
  db: SupabaseClient,
  issues: Omit<AuditIssueRow, 'id' | 'status' | 'fixed_at'>[]
): Promise<AuditIssueRow[]> {
  if (issues.length === 0) return [];
  return unwrap(await db.from('audit_issues').insert(issues).select('*')) as AuditIssueRow[];
}

export async function insertIssuePages(
  db: SupabaseClient,
  pages: (AuditIssuePageRow & { issue_id: string; project_id: string })[]
): Promise<void> {
  // Insert in chunks to keep each request small.
  for (let i = 0; i < pages.length; i += 500) {
    unwrap(await db.from('audit_issue_pages').insert(pages.slice(i, i + 500)));
  }
}

export async function listIssues(db: SupabaseClient, auditId: string): Promise<AuditIssueRow[]> {
  return unwrap(
    await db.from('audit_issues').select('*').eq('audit_id', auditId).order('occurrences', { ascending: false })
  ) as AuditIssueRow[];
}

export async function findIssue(db: SupabaseClient, id: string): Promise<AuditIssueRow | null> {
  return unwrap(await db.from('audit_issues').select('*').eq('id', id).maybeSingle()) as AuditIssueRow | null;
}

export async function listIssuePages(db: SupabaseClient, issueId: string, limit: number): Promise<AuditIssuePageRow[]> {
  return unwrap(
    await db.from('audit_issue_pages').select('url, status_code, detail').eq('issue_id', issueId).order('url').limit(limit)
  ) as AuditIssuePageRow[];
}

export async function updateIssue(db: SupabaseClient, id: string, patch: Pick<AuditIssueRow, 'status' | 'fixed_at'>) {
  unwrap(await db.from('audit_issues').update(patch).eq('id', id));
}
