// Projects: POST/DELETE /projects and the Supabase implementation of GET /projects.
import { formatDistanceToNowStrict } from 'date-fns';
import type { PostgrestError } from '@supabase/supabase-js';
import * as seo from '@/lib/seo-data';
import type { ProjectItem } from '@/lib/seo-data';
import { supabase } from '@/lib/supabase';
import { ApiError } from './errors';
import { baseUrl, httpRequest } from './http';

export const industries = [
  { value: 'saas', label: 'SaaS' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'finance', label: 'Finance' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
] as const;

export const countries = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IN', label: 'India' },
] as const;

/** Request body of POST /projects (BACKEND_SPECIFICATION.md). */
export interface NewProjectInput {
  name: string;
  websiteUrl: string;
  industry?: string;
  targetCountry?: string;
  trackingKeywords: string[];
}

export interface NewProjectForm {
  name: string;
  websiteUrl: string;
  industry: string;
  targetCountry: string;
  keywords: string;
}

export type NewProjectErrors = Partial<Record<keyof NewProjectForm, string>>;

/** Validates and normalises the New Project form, mirroring the database constraints. */
export function validateNewProject(form: NewProjectForm):
  | { ok: true; input: NewProjectInput }
  | { ok: false; errors: NewProjectErrors } {
  const errors: NewProjectErrors = {};

  let websiteUrl = '';
  let hostname = '';
  const rawUrl = form.websiteUrl.trim();
  if (!rawUrl) {
    errors.websiteUrl = 'Enter the website URL.';
  } else {
    try {
      const url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
      if (!url.hostname.includes('.') || !/^https?:$/.test(url.protocol)) throw new Error('bad url');
      hostname = url.hostname.replace(/^www\./, '');
      websiteUrl = url.pathname === '/' ? url.origin : `${url.origin}${url.pathname.replace(/\/$/, '')}`;
    } catch {
      errors.websiteUrl = 'Enter a valid URL, like https://example.com.';
    }
  }

  const name = form.name.trim() || hostname;
  if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  const trackingKeywords = [
    ...new Set(
      form.keywords
        .split(/[,\n]/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
  if (trackingKeywords.length > 100) errors.keywords = 'You can track at most 100 keywords per project.';
  if (trackingKeywords.some((k) => k.length > 200)) errors.keywords = 'Each keyword must be 200 characters or fewer.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: {
      name,
      websiteUrl,
      industry: form.industry || undefined,
      targetCountry: form.targetCountry || undefined,
      trackingKeywords,
    },
  };
}

// ── Supabase ───────────────────────────────────────────────────────────────

interface ProjectRow {
  id: string;
  name: string;
  website_url: string;
  favicon: string | null;
  status: ProjectItem['status'];
  health_score: number;
  authority_score: number;
  traffic_value: string | null;
  last_audit_at: string | null;
  project_keywords?: { count: number }[];
}

const projectColumns =
  'id, name, website_url, favicon, status, health_score, authority_score, traffic_value, last_audit_at, project_keywords(count)';

export function toProjectItem(row: ProjectRow): ProjectItem {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.website_url,
    favicon: row.favicon || row.name.charAt(0).toUpperCase(),
    status: row.status,
    traffic: row.traffic_value ?? '—',
    keywords: row.project_keywords?.[0]?.count ?? 0,
    health: row.health_score,
    authority: row.authority_score,
    lastAudit: row.last_audit_at
      ? formatDistanceToNowStrict(new Date(row.last_audit_at), { addSuffix: true })
      : 'not run yet',
    // Traffic history arrives with the traffic_data table in a later phase.
    trend: [],
  };
}

/** Turns a Postgres/PostgREST error into a message a user can act on. */
export function toApiError(error: Pick<PostgrestError, 'code' | 'message'>): ApiError {
  switch (error.code) {
    case '23505':
      return new ApiError('You already have a project for this website.', 409);
    case '23514':
      return new ApiError('Some project details are invalid. Check the URL, name and country.', 400);
    case '22023':
      return new ApiError(error.message, 400);
    case '42501':
      return new ApiError("You don't have permission to do that. Try signing in again.", 403);
    default:
      return new ApiError(error.message || 'Something went wrong. Please try again.');
  }
}

async function fetchProjectsFromSupabase(): Promise<ProjectItem[]> {
  const { data, error } = await supabase!
    .from('projects')
    .select(projectColumns)
    .order('created_at', { ascending: true });
  if (error) throw toApiError(error);
  return (data as ProjectRow[]).map(toProjectItem);
}

/** GET handlers served by Supabase so far; other paths fall back to the REST API or mock data. */
export const supabaseRoutes: Record<string, () => Promise<unknown>> = {
  '/projects': fetchProjectsFromSupabase,
};

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createProject(input: NewProjectInput): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('create_project', {
      p_name: input.name,
      p_website_url: input.websiteUrl,
      p_industry: input.industry ?? null,
      p_target_country: input.targetCountry ?? null,
      p_tracking_keywords: input.trackingKeywords,
    });
    if (error) throw toApiError(error);
    return;
  }
  if (baseUrl) {
    await httpRequest('POST', '/projects', input);
    return;
  }
  // Demo mode: keep it in memory for this browser session.
  const exists = seo.projectList.some(
    (p) => (p.websiteUrl ?? `https://${p.name}`).toLowerCase() === input.websiteUrl.toLowerCase()
  );
  if (exists) throw new ApiError('You already have a project for this website.', 409);
  seo.projectList.push({
    id: crypto.randomUUID(),
    name: input.name,
    websiteUrl: input.websiteUrl,
    favicon: input.name.charAt(0).toUpperCase(),
    status: 'active',
    traffic: '—',
    keywords: input.trackingKeywords.length,
    health: 0,
    authority: 0,
    lastAudit: 'not run yet',
    trend: [],
  });
}

/** Deletes a project by id (backend projects) or by name (demo projects). */
export async function deleteProject(project: Pick<ProjectItem, 'id' | 'name'>): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('projects').delete().eq('id', project.id!);
    if (error) throw toApiError(error);
    return;
  }
  if (baseUrl) {
    await httpRequest('DELETE', `/projects/${encodeURIComponent(project.id ?? project.name)}`);
    return;
  }
  const index = seo.projectList.findIndex((p) => (project.id ? p.id === project.id : p.name === project.name));
  if (index !== -1) seo.projectList.splice(index, 1);
}

function hoursAgo(label: string) {
  const match = /(\d+)\s*([hd])/.exec(label);
  if (!match) return null;
  const hours = Number(match[1]) * (match[2] === 'd' ? 24 : 1);
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

/** Copies the demo projects into the signed-in user's Supabase account. */
export async function addSampleProjects(): Promise<void> {
  if (!supabase) return;
  const { data: existing, error: readError } = await supabase.from('projects').select('website_url');
  if (readError) throw toApiError(readError);
  const taken = new Set((existing ?? []).map((row) => String(row.website_url).toLowerCase()));
  const rows = seo.projectList
    .filter((p) => !taken.has(`https://${p.name}`.toLowerCase()))
    .map((p) => ({
      name: p.name,
      website_url: `https://${p.name}`,
      favicon: p.favicon,
      status: p.status,
      health_score: p.health,
      authority_score: p.authority,
      traffic_value: p.traffic,
      last_audit_at: hoursAgo(p.lastAudit),
    }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('projects').insert(rows);
  if (error) throw toApiError(error);
}
