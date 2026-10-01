import type { z } from 'zod';
import * as repo from '../repositories/content.repository.js';
import type { ContentRow } from '../repositories/content.repository.js';
import type { Ctx } from '../utils/context.js';
import { notFound } from '../utils/http-error.js';
import type { createContentSchema, updateContentSchema } from '../validators/resources.js';
import { recordActivity } from './feed.service.js';
import { requireProject } from './projects.service.js';

/** traffic/keywords/score need analytics and rank data (not connected yet), so they are null. */
export interface ContentDto {
  id: string;
  projectId: string;
  title: string;
  urlPath: string;
  contentType: ContentRow['content_type'];
  status: ContentRow['status'];
  primaryKeyword: string | null;
  targetKeywords: string[];
  metaDescription: string | null;
  traffic: number | null;
  rankingKeywords: number | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStatsDto {
  total: number;
  published: number;
  needsUpdate: number;
  drafts: number;
}

const toDto = (r: ContentRow): ContentDto => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  urlPath: r.url_path,
  contentType: r.content_type,
  status: r.status,
  primaryKeyword: r.primary_keyword,
  targetKeywords: r.target_keywords,
  metaDescription: r.meta_description,
  traffic: null,
  rankingKeywords: null,
  score: null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listContent(ctx: Ctx, projectId: string): Promise<ContentDto[]> {
  await requireProject(ctx, projectId);
  return (await repo.listContent(ctx.db, projectId)).map(toDto);
}

export async function contentStats(ctx: Ctx, projectId: string): Promise<ContentStatsDto> {
  await requireProject(ctx, projectId);
  const rows = await repo.listContent(ctx.db, projectId);
  return {
    total: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    needsUpdate: rows.filter((r) => r.status === 'needs-update' || r.status === 'outdated').length,
    drafts: rows.filter((r) => r.status === 'draft').length,
  };
}

export async function createContent(ctx: Ctx, input: z.output<typeof createContentSchema>): Promise<ContentDto> {
  const project = await requireProject(ctx, input.projectId);
  const row = await repo.insertContent(ctx.db, {
    project_id: input.projectId,
    title: input.title,
    url_path: input.urlPath,
    content_type: input.contentType,
    status: input.status,
    primary_keyword: input.primaryKeyword ?? null,
    target_keywords: input.targetKeywords,
    meta_description: input.metaDescription ?? null,
  });
  await recordActivity(ctx, { projectId: project.id, type: 'content', title: 'Content added', description: `${row.title} (${row.url_path})` });
  return toDto(row);
}

export async function updateContent(ctx: Ctx, id: string, patch: z.output<typeof updateContentSchema>): Promise<ContentDto> {
  const row = await repo.updateContent(ctx.db, id, {
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.urlPath !== undefined && { url_path: patch.urlPath }),
    ...(patch.contentType !== undefined && { content_type: patch.contentType }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.primaryKeyword !== undefined && { primary_keyword: patch.primaryKeyword }),
    ...(patch.targetKeywords !== undefined && { target_keywords: patch.targetKeywords }),
    ...(patch.metaDescription !== undefined && { meta_description: patch.metaDescription }),
  });
  if (!row) throw notFound('Content not found.');
  return toDto(row);
}

export async function deleteContent(ctx: Ctx, id: string) {
  if (!(await repo.deleteContent(ctx.db, id))) throw notFound('Content not found.');
}
