import * as contentRepo from '../repositories/content.repository.js';
import type { Ctx } from '../utils/context.js';
import { latestAudits, latestChecks, auditHistory, type AuditIssueDto } from './audits.service.js';
import { backlinkAnalytics, type BacklinkAnalytics } from './backlinks.service.js';
import { listCompetitors, type CompetitorDto } from './competitors.service.js';
import { listKeywords, type KeywordDto } from './keywords.service.js';
import { requireProject } from './projects.service.js';

export type KpiKey =
  | 'site-health'
  | 'open-issues'
  | 'pages-crawled'
  | 'tracked-keywords'
  | 'backlinks'
  | 'referring-domains'
  | 'competitors'
  | 'content-pages';

export interface KpiDto {
  key: KpiKey;
  value: number | null;
  /** The same metric one step earlier (previous audit), when known. */
  previous: number | null;
  history: number[];
}

export interface DashboardSummaryDto {
  project: { id: string; name: string; websiteUrl: string; lastAuditAt: string | null };
  kpis: KpiDto[];
  keywords: KeywordDto[];
  auditIssues: AuditIssueDto[];
  backlinks: Omit<BacklinkAnalytics, 'growth'>;
  competitors: CompetitorDto[];
  /**
   * Sections that need a data provider (analytics, rank tracking, Core Web Vitals, AI search).
   * null means "not connected", which the frontend shows as an empty state.
   */
  traffic: null;
  coreWebVitals: null;
  aiSeo: null;
}

export async function dashboardSummary(ctx: Ctx, projectId: string): Promise<DashboardSummaryDto> {
  const project = await requireProject(ctx, projectId);
  const [audits, history, issues, keywords, backlinks, competitors, content] = await Promise.all([
    latestAudits(ctx, projectId),
    auditHistory(ctx, projectId),
    latestChecks(ctx, projectId),
    listKeywords(ctx, projectId),
    backlinkAnalytics(ctx, projectId),
    listCompetitors(ctx, projectId),
    contentRepo.listContent(ctx.db, projectId),
  ]);
  const last = audits.lastCompleted;
  const prev = audits.previousCompleted;
  const openIssues = last ? issues.filter((i) => i.status === 'open').reduce((n, i) => n + i.occurrences, 0) : null;

  const kpis: KpiDto[] = [
    { key: 'site-health', value: last?.healthScore ?? null, previous: prev?.healthScore ?? null, history: history.map((h) => h.healthScore ?? 0) },
    { key: 'open-issues', value: openIssues, previous: prev ? prev.errors + prev.warnings + prev.notices : null, history: history.map((h) => h.errors + h.warnings + h.notices) },
    { key: 'pages-crawled', value: last?.pagesCrawled ?? null, previous: prev?.pagesCrawled ?? null, history: history.map((h) => h.pagesCrawled) },
    { key: 'tracked-keywords', value: keywords.length, previous: null, history: [] },
    { key: 'backlinks', value: backlinks.stats.total, previous: null, history: [] },
    { key: 'referring-domains', value: backlinks.stats.referringDomains, previous: null, history: [] },
    { key: 'competitors', value: competitors.filter((c) => !c.isYou).length, previous: null, history: [] },
    { key: 'content-pages', value: content.length, previous: null, history: [] },
  ];

  return {
    project: { id: project.id, name: project.name, websiteUrl: project.website_url, lastAuditAt: project.last_audit_at },
    kpis,
    keywords: keywords.slice(0, 10),
    auditIssues: issues,
    backlinks: { stats: backlinks.stats, anchors: backlinks.anchors, linkTypes: backlinks.linkTypes, topDomains: backlinks.topDomains },
    competitors,
    traffic: null,
    coreWebVitals: null,
    aiSeo: null,
  };
}
