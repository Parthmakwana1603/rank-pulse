import { parse as parseCsv } from 'csv-parse/sync';
import * as repo from '../repositories/projects.repository.js';
import type { ProjectRow } from '../repositories/projects.repository.js';
import type { Ctx } from '../utils/context.js';
import { badRequest, HttpError, notFound } from '../utils/http-error.js';
import { newProjectSchema, type NewProjectInput, type ProjectPatch } from '../validators/projects.js';
import { recordActivity } from './feed.service.js';

export interface ProjectDto {
  id: string;
  name: string;
  websiteUrl: string;
  favicon: string;
  industry: string | null;
  targetCountry: string | null;
  status: ProjectRow['status'];
  keywordCount: number;
  /** Latest site-audit health (0–100); null until an audit has completed. */
  healthScore: number | null;
  /** Domain authority from a data provider; null when none is connected. */
  authorityScore: number | null;
  /** Organic traffic from an analytics integration; null when none is connected. */
  organicTraffic: number | null;
  lastAuditAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toProjectDto(row: ProjectRow): ProjectDto {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.website_url,
    favicon: row.favicon || row.name.charAt(0).toUpperCase(),
    industry: row.industry,
    targetCountry: row.target_country,
    status: row.status,
    keywordCount: row.project_keywords?.[0]?.count ?? 0,
    healthScore: row.last_audit_at ? row.health_score : null,
    authorityScore: row.authority_score > 0 ? row.authority_score : null,
    organicTraffic: null,
    lastAuditAt: row.last_audit_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Returns the project if it belongs to the caller; 404 otherwise (without revealing whether it exists). */
export async function requireProject(ctx: Ctx, projectId: string): Promise<ProjectRow> {
  const row = await repo.findProject(ctx.db, projectId);
  if (!row || row.user_id !== ctx.userId) throw notFound('Project not found.');
  return row;
}

export async function listProjects(ctx: Ctx): Promise<ProjectDto[]> {
  return (await repo.listProjects(ctx.db)).map(toProjectDto);
}

export async function getProject(ctx: Ctx, id: string): Promise<ProjectDto> {
  return toProjectDto(await requireProject(ctx, id));
}

export async function createProject(ctx: Ctx, input: NewProjectInput): Promise<ProjectDto> {
  const { id } = await repo.createProject(ctx.db, input);
  await recordActivity(ctx, {
    projectId: id,
    type: 'project',
    title: 'Project created',
    description: `${input.name} (${input.websiteUrl}) with ${input.trackingKeywords.length} tracked keyword${input.trackingKeywords.length === 1 ? '' : 's'}`,
  });
  return getProject(ctx, id);
}

export async function updateProject(ctx: Ctx, id: string, patch: ProjectPatch): Promise<ProjectDto> {
  await requireProject(ctx, id);
  await repo.updateProject(ctx.db, id, {
    ...(patch.name !== undefined && { name: patch.name }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.industry !== undefined && { industry: patch.industry }),
    ...(patch.targetCountry !== undefined && { target_country: patch.targetCountry }),
  });
  return getProject(ctx, id);
}

export async function deleteProject(ctx: Ctx, id: string): Promise<void> {
  await requireProject(ctx, id);
  if (!(await repo.deleteProject(ctx.db, id))) throw notFound('Project not found.');
}

// ── CSV import ─────────────────────────────────────────────────────────────

export const MAX_IMPORT_ROWS = 100;

export interface ImportResult {
  created: ProjectDto[];
  skipped: { row: number; website: string; reason: string }[];
}

const columnAliases: Record<string, keyof RawRow> = {
  website_url: 'websiteUrl',
  websiteurl: 'websiteUrl',
  website: 'websiteUrl',
  url: 'websiteUrl',
  name: 'name',
  project_name: 'name',
  industry: 'industry',
  target_country: 'targetCountry',
  country: 'targetCountry',
  keywords: 'keywords',
  tracking_keywords: 'keywords',
};

interface RawRow {
  websiteUrl?: string;
  name?: string;
  industry?: string;
  targetCountry?: string;
  keywords?: string;
}

/**
 * Parses an import CSV. The first row must be a header containing a website column
 * (website_url / website / url); name, industry, target_country (or country) and keywords
 * (separated by ";" or "|") are optional.
 */
export function parseImportCsv(csv: Buffer): RawRow[] {
  let records: Record<string, string>[];
  try {
    records = parseCsv(csv, {
      bom: true,
      columns: (header: string[]) =>
        header.map((h) => columnAliases[h.trim().toLowerCase().replace(/[\s-]+/g, '_')] ?? `_ignored_${h}`),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      max_record_size: 10_000,
    });
  } catch {
    throw badRequest('The file is not a valid CSV.');
  }
  if (records.length === 0) throw badRequest('The CSV has no rows. Add a header row and one project per line.');
  if (!('websiteUrl' in records[0])) {
    throw badRequest('The CSV needs a "website_url" (or "url") column.');
  }
  if (records.length > MAX_IMPORT_ROWS) throw badRequest(`Import at most ${MAX_IMPORT_ROWS} projects at a time.`);
  return records as RawRow[];
}

export async function importProjects(ctx: Ctx, csv: Buffer): Promise<ImportResult> {
  const rows = parseImportCsv(csv);
  const result: ImportResult = { created: [], skipped: [] };
  for (const [index, raw] of rows.entries()) {
    const rowNumber = index + 2; // 1-based, after the header
    const website = raw.websiteUrl ?? '';
    const parsed = newProjectSchema.safeParse({
      websiteUrl: website,
      name: raw.name || undefined,
      industry: raw.industry?.toLowerCase() || undefined,
      targetCountry: raw.targetCountry || undefined,
      trackingKeywords: (raw.keywords ?? '').split(/[;|]/),
    });
    if (!parsed.success) {
      result.skipped.push({ row: rowNumber, website, reason: parsed.error.issues[0].message });
      continue;
    }
    try {
      result.created.push(await createProject(ctx, parsed.data));
    } catch (err) {
      if (err instanceof HttpError && err.status < 500) {
        result.skipped.push({ row: rowNumber, website, reason: err.message });
      } else {
        throw err;
      }
    }
  }
  return result;
}
