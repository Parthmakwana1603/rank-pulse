import type { z } from 'zod';
import * as repo from '../repositories/keywords.repository.js';
import type { Ctx } from '../utils/context.js';
import { notFound } from '../utils/http-error.js';
import type { addKeywordsSchema } from '../validators/resources.js';
import { recordActivity } from './feed.service.js';
import { requireProject } from './projects.service.js';

/**
 * Ranking metrics (volume, difficulty, CPC, position, intent, SERP feature, history) need a
 * rank-tracking data provider, which isn't connected yet (see BACKEND_BLOCKERS.md). They are
 * returned as null / [] so the frontend can show "—" instead of invented numbers.
 */
export interface KeywordDto {
  id: string;
  keyword: string;
  searchEngine: 'google' | 'bing' | 'yahoo';
  device: 'desktop' | 'mobile';
  createdAt: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  rank: number | null;
  previousRank: number | null;
  rankingUrl: string | null;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | null;
  serpFeature: string | null;
  rankHistory: number[];
}

export interface KeywordSummaryDto {
  tracked: number;
  addedLast30Days: number;
  top10: number | null;
  top3: number | null;
  lost: number | null;
  averagePosition: number | null;
}

export async function listKeywords(ctx: Ctx, projectId: string): Promise<KeywordDto[]> {
  await requireProject(ctx, projectId);
  const rows = await repo.listKeywords(ctx.db, projectId);
  return rows.map((r) => ({
    id: r.id,
    keyword: r.keyword,
    searchEngine: r.search_engine,
    device: r.device,
    createdAt: r.created_at,
    volume: null,
    difficulty: null,
    cpc: null,
    rank: null,
    previousRank: null,
    rankingUrl: null,
    intent: null,
    serpFeature: null,
    rankHistory: [],
  }));
}

export async function keywordSummary(ctx: Ctx, projectId: string): Promise<KeywordSummaryDto> {
  await requireProject(ctx, projectId);
  const rows = await repo.listKeywords(ctx.db, projectId);
  const since = Date.now() - 30 * 86_400_000;
  return {
    tracked: rows.length,
    addedLast30Days: rows.filter((r) => Date.parse(r.created_at) >= since).length,
    top10: null,
    top3: null,
    lost: null,
    averagePosition: null,
  };
}

export async function addKeywords(ctx: Ctx, input: z.output<typeof addKeywordsSchema>) {
  const project = await requireProject(ctx, input.projectId);
  const inserted = await repo.insertKeywords(
    ctx.db,
    input.keywords.map((keyword) => ({
      project_id: input.projectId,
      keyword,
      search_engine: input.searchEngine,
      device: input.device,
    }))
  );
  const skipped = input.keywords.length - inserted.length;
  if (inserted.length > 0) {
    await recordActivity(ctx, {
      projectId: input.projectId,
      type: 'keyword',
      title: `${inserted.length} keyword${inserted.length === 1 ? '' : 's'} added`,
      description: `${inserted
        .slice(0, 3)
        .map((k) => `"${k.keyword}"`)
        .join(', ')}${inserted.length > 3 ? '…' : ''} on ${project.name}`,
    });
  }
  return { added: inserted.length, skipped };
}

export async function deleteKeyword(ctx: Ctx, id: string) {
  if (!(await repo.deleteKeyword(ctx.db, id))) throw notFound('Keyword not found.');
}
