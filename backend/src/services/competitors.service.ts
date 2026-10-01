import type { z } from 'zod';
import * as backlinksRepo from '../repositories/backlinks.repository.js';
import * as repo from '../repositories/competitors.repository.js';
import type { CompetitorRow } from '../repositories/competitors.repository.js';
import type { Ctx } from '../utils/context.js';
import { badRequest, notFound } from '../utils/http-error.js';
import type { addCompetitorSchema } from '../validators/resources.js';
import { recordActivity } from './feed.service.js';
import { requireProject } from './projects.service.js';

/**
 * Traffic, keyword, authority and traffic-value metrics for any domain need an SEO data provider
 * (not connected yet, see BACKEND_BLOCKERS.md), so they are null. The own-site row reports the
 * backlinks recorded in RankPulse.
 */
export interface CompetitorDto {
  id: string;
  domain: string;
  displayName: string;
  targetCountry: string | null;
  trackingScope: CompetitorRow['tracking_scope'] | null;
  isYou: boolean;
  organicTraffic: number | null;
  keywords: number | null;
  backlinks: number | null;
  authority: number | null;
  trafficValue: number | null;
  createdAt: string;
}

export interface KeywordComparisonDto {
  competitors: { id: string; displayName: string; isYou: boolean }[];
  rows: { keyword: string; positions: Record<string, number | null> }[];
}

export interface GapDto {
  unique: number | null;
  shared: number | null;
  missed: number | null;
}

const toDto = (r: CompetitorRow): CompetitorDto => ({
  id: r.id,
  domain: r.domain,
  displayName: r.display_name,
  targetCountry: r.target_country,
  trackingScope: r.tracking_scope,
  isYou: false,
  organicTraffic: null,
  keywords: null,
  backlinks: null,
  authority: null,
  trafficValue: null,
  createdAt: r.created_at,
});

export async function listCompetitors(ctx: Ctx, projectId: string): Promise<CompetitorDto[]> {
  const project = await requireProject(ctx, projectId);
  const [rows, backlinks] = await Promise.all([
    repo.listCompetitors(ctx.db, projectId),
    backlinksRepo.listBacklinks(ctx.db, projectId),
  ]);
  const own: CompetitorDto = {
    id: project.id,
    domain: new URL(project.website_url).hostname.replace(/^www\./, ''),
    displayName: project.name,
    targetCountry: project.target_country,
    trackingScope: null,
    isYou: true,
    organicTraffic: null,
    keywords: null,
    backlinks: backlinks.filter((b) => !b.disavowed).length,
    authority: project.authority_score > 0 ? project.authority_score : null,
    trafficValue: null,
    createdAt: project.created_at,
  };
  return [own, ...rows.map(toDto)];
}

export async function addCompetitor(ctx: Ctx, input: z.output<typeof addCompetitorSchema>): Promise<CompetitorDto> {
  const project = await requireProject(ctx, input.projectId);
  const ownDomain = new URL(project.website_url).hostname.replace(/^www\./, '');
  if (input.domain === ownDomain) throw badRequest("That's your own website. Enter a competitor's domain.");
  const row = await repo.insertCompetitor(ctx.db, {
    project_id: input.projectId,
    domain: input.domain,
    display_name: input.displayName ?? input.domain,
    target_country: input.targetCountry ?? null,
    tracking_scope: input.trackingScope,
  });
  await recordActivity(ctx, { projectId: project.id, type: 'competitor', title: 'Competitor added', description: row.domain });
  return toDto(row);
}

export async function deleteCompetitor(ctx: Ctx, id: string) {
  if (!(await repo.deleteCompetitor(ctx.db, id))) throw notFound('Competitor not found.');
}

/** Positions per keyword need rank data from a provider; until then there are no rows. */
export async function keywordComparison(ctx: Ctx, projectId: string): Promise<KeywordComparisonDto> {
  const list = await listCompetitors(ctx, projectId);
  return { competitors: list.map((c) => ({ id: c.id, displayName: c.displayName, isYou: c.isYou })), rows: [] };
}

export async function keywordGap(ctx: Ctx, projectId: string): Promise<GapDto> {
  await requireProject(ctx, projectId);
  return { unique: null, shared: null, missed: null };
}
