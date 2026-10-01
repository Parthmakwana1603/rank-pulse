// Projects: form validation and create/update/delete/import (POST/PATCH/DELETE /projects).
import * as seo from '@/lib/seo-data';
import type { ProjectItem } from '@/lib/seo-data';
import { ApiError } from './errors';
import { apiSend, apiUpload, dataMode } from './client';
import type { ImportResultDto, ProjectDto } from './types';

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

/** Request body of POST /projects. */
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

/** Validates and normalises the New Project form, mirroring the API's and database's rules. */
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

export async function createProject(input: NewProjectInput): Promise<void> {
  if (dataMode === 'api') {
    await apiSend<ProjectDto>('POST', '/projects', input);
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
    health: null,
    authority: null,
    lastAudit: 'not run yet',
    trend: [],
  });
}

/** Deletes a project by id (API projects) or by name (demo projects without an id). */
export async function deleteProject(project: Pick<ProjectItem, 'id' | 'name'>): Promise<void> {
  if (dataMode === 'api') {
    await apiSend('DELETE', `/projects/${encodeURIComponent(project.id!)}`);
    return;
  }
  const index = seo.projectList.findIndex((p) => (project.id ? p.id === project.id : p.name === project.name));
  if (index !== -1) seo.projectList.splice(index, 1);
}

export interface ProjectPatch {
  name?: string;
  status?: 'active' | 'paused';
}

export async function updateProject({ id, ...patch }: ProjectPatch & { id: string }): Promise<void> {
  await apiSend<ProjectDto>('PATCH', `/projects/${encodeURIComponent(id)}`, patch);
}

/** Uploads a CSV of projects (header row with website_url; optional name, industry, country, keywords). */
export function importProjects(file: File): Promise<ImportResultDto> {
  return apiUpload<ImportResultDto>('/projects/import', 'file', file);
}
