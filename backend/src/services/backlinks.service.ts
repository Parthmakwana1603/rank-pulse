import type { z } from 'zod';
import * as keywordsRepo from '../repositories/keywords.repository.js';
import * as repo from '../repositories/backlinks.repository.js';
import type { BacklinkRow, LinkType } from '../repositories/backlinks.repository.js';
import type { Ctx } from '../utils/context.js';
import { conflict, notFound } from '../utils/http-error.js';
import type { addBacklinkSchema } from '../validators/resources.js';
import { recordActivity } from './feed.service.js';
import { requireProject } from './projects.service.js';

export interface BacklinkDto {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetPage: string;
  anchorText: string;
  linkType: LinkType;
  domainAuthority: number | null;
  notes: string | null;
  disavowed: boolean;
  firstSeenAt: string;
}

export type AnchorCategory = 'branded' | 'exact' | 'partial' | 'naked-url' | 'generic';

export interface BacklinkStatsDto {
  total: number;
  referringDomains: number;
  newLast30Days: number;
  disavowed: number;
}

export interface BacklinkAnalytics {
  stats: BacklinkStatsDto;
  growth: { month: string; new: number; lost: number }[];
  anchors: { category: AnchorCategory; count: number }[];
  linkTypes: { type: LinkType; count: number }[];
  topDomains: { domain: string; backlinks: number; authority: number | null }[];
}

const toDto = (r: BacklinkRow): BacklinkDto => ({
  id: r.id,
  sourceUrl: r.source_url,
  sourceDomain: r.source_domain,
  targetPage: r.target_page,
  anchorText: r.anchor_text,
  linkType: r.link_type,
  domainAuthority: r.domain_authority,
  notes: r.notes,
  disavowed: r.disavowed,
  firstSeenAt: r.first_seen_at,
});

export async function listBacklinks(ctx: Ctx, projectId: string): Promise<BacklinkDto[]> {
  await requireProject(ctx, projectId);
  return (await repo.listBacklinks(ctx.db, projectId)).map(toDto);
}

export async function addBacklink(ctx: Ctx, input: z.output<typeof addBacklinkSchema>): Promise<BacklinkDto> {
  const project = await requireProject(ctx, input.projectId);
  const existing = await repo.findBacklink(ctx.db, input.projectId, input.sourceUrl, input.targetPage);
  const now = new Date().toISOString();

  if (existing) {
    if (!input.disavow) throw conflict('This backlink is already recorded.');
    if (existing.disavowed) throw conflict('This backlink is already disavowed.');
    const row = await repo.updateBacklink(ctx.db, existing.id, { disavowed: true, disavowed_at: now });
    await recordActivity(ctx, { projectId: project.id, type: 'backlink', title: 'Backlink disavowed', description: existing.source_url });
    return toDto(row);
  }

  const row = await repo.insertBacklink(ctx.db, {
    project_id: input.projectId,
    source_url: input.sourceUrl,
    source_domain: new URL(input.sourceUrl).hostname.replace(/^www\./, ''),
    target_page: input.targetPage,
    anchor_text: input.anchorText,
    link_type: input.linkType,
    domain_authority: input.domainAuthority ?? null,
    notes: input.notes ?? null,
    disavowed: input.disavow,
    disavowed_at: input.disavow ? now : null,
  });
  await recordActivity(ctx, {
    projectId: project.id,
    type: 'backlink',
    title: input.disavow ? 'Backlink disavowed' : 'Backlink added',
    description: `${row.source_domain} → ${row.target_page}`,
  });
  return toDto(row);
}

export async function deleteBacklink(ctx: Ctx, id: string) {
  if (!(await repo.deleteBacklink(ctx.db, id))) throw notFound('Backlink not found.');
}

// ── Analytics (pure, so they can be unit-tested) ───────────────────────────

const GENERIC_ANCHORS = new Set([
  'click here', 'here', 'this', 'link', 'website', 'this website', 'read more', 'learn more', 'more', 'source',
  'visit', 'visit site', 'homepage', 'this page', 'this article', 'check it out', 'go', 'see more',
]);

export function classifyAnchor(anchor: string, brandTerms: string[], keywords: string[]): AnchorCategory {
  const text = anchor.trim().toLowerCase();
  if (!text || GENERIC_ANCHORS.has(text)) return 'generic';
  if (/^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/.test(text)) return 'naked-url';
  if (brandTerms.some((b) => b && text.includes(b))) return 'branded';
  if (keywords.includes(text)) return 'exact';
  if (keywords.some((k) => text.includes(k) || k.split(/\s+/).filter((w) => w.length > 3).some((w) => text.includes(w)))) {
    return 'partial';
  }
  return 'generic';
}

/** Brand words for anchor classification: the project name and its domain without the TLD. */
export function brandTermsFor(project: { name: string; website_url: string }) {
  const host = new URL(project.website_url).hostname.replace(/^www\./, '');
  const base = host.split('.')[0];
  return [...new Set([project.name.toLowerCase(), host, base, base.replace(/-/g, ' ')])].filter((t) => t.length >= 3);
}

function monthKey(iso: string) {
  return iso.slice(0, 7); // "YYYY-MM"
}

export function computeAnalytics(
  rows: BacklinkRow[],
  brandTerms: string[],
  keywords: string[],
  now = new Date()
): BacklinkAnalytics {
  const active = rows.filter((r) => !r.disavowed);
  const since = now.getTime() - 30 * 86_400_000;

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const growth = months.map((month) => ({
    month,
    new: rows.filter((r) => monthKey(r.first_seen_at) === month).length,
    lost: rows.filter((r) => r.disavowed_at && monthKey(r.disavowed_at) === month).length,
  }));

  const anchorCounts = new Map<AnchorCategory, number>();
  for (const r of active) {
    const c = classifyAnchor(r.anchor_text, brandTerms, keywords);
    anchorCounts.set(c, (anchorCounts.get(c) ?? 0) + 1);
  }
  const typeCounts = new Map<LinkType, number>();
  for (const r of active) typeCounts.set(r.link_type, (typeCounts.get(r.link_type) ?? 0) + 1);

  const domains = new Map<string, { backlinks: number; authority: number | null }>();
  for (const r of active) {
    const d = domains.get(r.source_domain) ?? { backlinks: 0, authority: null };
    d.backlinks++;
    if (r.domain_authority !== null) d.authority = Math.max(d.authority ?? 0, r.domain_authority);
    domains.set(r.source_domain, d);
  }

  return {
    stats: {
      total: active.length,
      referringDomains: domains.size,
      newLast30Days: active.filter((r) => Date.parse(r.first_seen_at) >= since).length,
      disavowed: rows.length - active.length,
    },
    growth,
    anchors: (['branded', 'exact', 'partial', 'naked-url', 'generic'] as const)
      .map((category) => ({ category, count: anchorCounts.get(category) ?? 0 }))
      .filter((a) => a.count > 0),
    linkTypes: (['follow', 'nofollow', 'ugc', 'sponsored'] as const)
      .map((type) => ({ type, count: typeCounts.get(type) ?? 0 }))
      .filter((t) => t.count > 0),
    topDomains: [...domains.entries()]
      .map(([domain, d]) => ({ domain, ...d }))
      .sort((a, b) => b.backlinks - a.backlinks || (b.authority ?? -1) - (a.authority ?? -1) || a.domain.localeCompare(b.domain))
      .slice(0, 5),
  };
}

export async function backlinkAnalytics(ctx: Ctx, projectId: string): Promise<BacklinkAnalytics> {
  const project = await requireProject(ctx, projectId);
  const [rows, keywordRows] = await Promise.all([
    repo.listBacklinks(ctx.db, projectId),
    keywordsRepo.listKeywords(ctx.db, projectId),
  ]);
  return computeAnalytics(rows, brandTermsFor(project), keywordRows.map((k) => k.keyword));
}
