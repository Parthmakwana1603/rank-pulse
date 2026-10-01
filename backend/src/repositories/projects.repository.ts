import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  favicon: string | null;
  industry: string | null;
  target_country: string | null;
  status: 'active' | 'paused' | 'warning';
  health_score: number;
  authority_score: number;
  last_audit_at: string | null;
  created_at: string;
  updated_at: string;
  project_keywords?: { count: number }[];
}

const columns =
  'id, user_id, name, website_url, favicon, industry, target_country, status, health_score, authority_score, last_audit_at, created_at, updated_at, project_keywords(count)';

const DUPLICATE = 'You already have a project for this website.';

export async function listProjects(db: SupabaseClient): Promise<ProjectRow[]> {
  return unwrap(await db.from('projects').select(columns).order('created_at', { ascending: true })) as ProjectRow[];
}

export async function findProject(db: SupabaseClient, id: string): Promise<ProjectRow | null> {
  return unwrap(await db.from('projects').select(columns).eq('id', id).maybeSingle()) as ProjectRow | null;
}

export async function createProject(
  db: SupabaseClient,
  input: { name: string; websiteUrl: string; industry?: string; targetCountry?: string; trackingKeywords: string[] }
): Promise<{ id: string }> {
  // create_project() inserts the project and its keywords in one transaction (see migrations).
  const row = unwrap(
    await db
      .rpc('create_project', {
        p_name: input.name,
        p_website_url: input.websiteUrl,
        p_industry: input.industry ?? null,
        p_target_country: input.targetCountry ?? null,
        p_tracking_keywords: input.trackingKeywords,
      })
      .single(),
    DUPLICATE
  ) as { id: string };
  return { id: row.id };
}

export async function updateProject(
  db: SupabaseClient,
  id: string,
  patch: Partial<Pick<ProjectRow, 'name' | 'status' | 'industry' | 'target_country' | 'health_score' | 'last_audit_at'>>
): Promise<boolean> {
  const rows = unwrap(await db.from('projects').update(patch).eq('id', id).select('id'), DUPLICATE) as unknown[];
  return rows.length > 0;
}

export async function deleteProject(db: SupabaseClient, id: string): Promise<boolean> {
  const rows = unwrap(await db.from('projects').delete().eq('id', id).select('id')) as unknown[];
  return rows.length > 0;
}
