import type { z } from 'zod';
import * as projectsRepo from '../repositories/projects.repository.js';
import * as repo from '../repositories/audits.repository.js';
import type { AuditIssueRow, AuditRunRow } from '../repositories/audits.repository.js';
import type { Ctx } from '../utils/context.js';
import { notFound } from '../utils/http-error.js';
import { errorFields, logger } from '../utils/logger.js';
import type { startAuditSchema } from '../validators/resources.js';
import { analyzeCrawl, checkDefinitions } from './crawler/checks.js';
import { crawlSite, type CrawlResult } from './crawler/crawl.js';
import { notify, recordActivity } from './feed.service.js';
import { jobs } from './jobs/job-runner.js';
import { requireProject } from './projects.service.js';

/** A crawl stops taking new pages after this long; a run still "active" after STALE_AFTER_MS failed. */
const CRAWL_TIME_BUDGET_MS = 8 * 60_000;
const STALE_AFTER_MS = 20 * 60_000;

export interface AuditRunDto {
  id: string;
  projectId: string;
  status: AuditRunRow['status'];
  phase: AuditRunRow['phase'];
  crawlDepth: AuditRunRow['crawl_depth'];
  maxPages: number;
  userAgent: AuditRunRow['user_agent'];
  pagesCrawled: number;
  healthScore: number | null;
  errors: number;
  warnings: number;
  notices: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface AuditIssueDto {
  id: string;
  auditId: string;
  checkKey: string;
  type: AuditIssueRow['type'];
  title: string;
  description: string;
  occurrences: number;
  pages: number;
  status: AuditIssueRow['status'];
  fixedAt: string | null;
}

export interface AuditIssueDetailDto extends AuditIssueDto {
  affectedPages: { url: string; statusCode: number | null; detail: string | null }[];
  recommendations: string[];
}

const toRunDto = (r: AuditRunRow): AuditRunDto => ({
  id: r.id,
  projectId: r.project_id,
  status: r.status,
  phase: r.phase,
  crawlDepth: r.crawl_depth,
  maxPages: r.max_pages,
  userAgent: r.user_agent,
  pagesCrawled: r.pages_crawled,
  healthScore: r.health_score,
  errors: r.errors,
  warnings: r.warnings,
  notices: r.notices,
  errorMessage: r.error_message,
  createdAt: r.created_at,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

const toIssueDto = (r: AuditIssueRow): AuditIssueDto => ({
  id: r.id,
  auditId: r.audit_id,
  checkKey: r.check_key,
  type: r.type,
  title: r.title,
  description: r.description,
  occurrences: r.occurrences,
  pages: r.pages,
  status: r.status,
  fixedAt: r.fixed_at,
});

/** Marks a run that has been pending/running for too long (e.g. the server restarted) as failed. */
async function expireIfStale(ctx: Ctx, run: AuditRunRow): Promise<AuditRunRow> {
  const active = run.status === 'pending' || run.status === 'running';
  if (!active || Date.now() - Date.parse(run.created_at) < STALE_AFTER_MS) return run;
  const patch = {
    status: 'failed' as const,
    phase: 'done' as const,
    error_message: 'The audit stopped unexpectedly. Please run it again.',
    finished_at: new Date().toISOString(),
  };
  await repo.updateAuditRun(ctx.db, run.id, patch);
  return { ...run, ...patch };
}

export async function startAudit(
  ctx: Ctx,
  input: z.output<typeof startAuditSchema>,
  crawl: typeof crawlSite = crawlSite
): Promise<AuditRunDto> {
  const project = await requireProject(ctx, input.projectId);
  // Clear a stale active run first so it doesn't block a new one forever.
  const [latest] = await repo.listAuditRuns(ctx.db, input.projectId, { limit: 1 });
  if (latest) await expireIfStale(ctx, latest);

  const run = await repo.insertAuditRun(ctx.db, {
    project_id: input.projectId,
    crawl_depth: input.crawlDepth,
    max_pages: input.maxPages,
    user_agent: input.userAgent,
  });
  jobs.enqueue(`audit:${run.id}`, () => runAudit(ctx, run, project.website_url, project.name, crawl));
  return toRunDto(run);
}

/** The audit job: crawl → analyse → store issues → update the run and the project. */
export async function runAudit(
  ctx: Ctx,
  run: AuditRunRow,
  websiteUrl: string,
  projectName: string,
  crawl: typeof crawlSite = crawlSite
) {
  const { db } = ctx;
  try {
    await repo.updateAuditRun(db, run.id, { status: 'running', phase: 'crawling', started_at: new Date().toISOString() });

    let lastReported = 0;
    const result: CrawlResult = await crawl({
      startUrl: websiteUrl,
      maxPages: run.max_pages,
      agent: run.user_agent,
      timeBudgetMs: CRAWL_TIME_BUDGET_MS,
      onProgress: (n) => {
        // Report progress every 10 pages without waiting on the database.
        if (n - lastReported >= 10) {
          lastReported = n;
          repo.updateAuditRun(db, run.id, { pages_crawled: n }).catch(() => {});
        }
      },
    });

    const reachable = result.pages.filter((p) => p.status >= 200 && p.status < 400);
    if (reachable.length === 0) {
      const first = result.pages[0];
      const why = first?.error ?? (first ? `HTTP ${first.status}` : 'no response');
      throw new Error(`Could not load ${websiteUrl} (${why}).`);
    }

    await repo.updateAuditRun(db, run.id, { phase: 'analyzing', pages_crawled: result.pages.length });
    const outcome = analyzeCrawl(result);

    const stored = await repo.insertIssues(
      db,
      outcome.issues.map((i) => ({
        audit_id: run.id,
        project_id: run.project_id,
        check_key: i.checkKey,
        type: i.type,
        title: i.title,
        description: i.description,
        occurrences: i.occurrences,
        pages: i.pages.length,
      }))
    );
    const idByKey = new Map(stored.map((s) => [s.check_key, s.id]));
    await repo.insertIssuePages(
      db,
      outcome.issues.flatMap((i) =>
        i.pages.map((p) => ({
          issue_id: idByKey.get(i.checkKey)!,
          project_id: run.project_id,
          url: p.url,
          status_code: p.statusCode,
          detail: p.detail,
        }))
      )
    );

    const finishedAt = new Date().toISOString();
    await repo.updateAuditRun(db, run.id, {
      status: 'completed',
      phase: 'done',
      pages_crawled: outcome.pagesCrawled,
      health_score: outcome.healthScore,
      errors: outcome.errors,
      warnings: outcome.warnings,
      notices: outcome.notices,
      finished_at: finishedAt,
    });
    await projectsRepo.updateProject(db, run.project_id, { health_score: outcome.healthScore, last_audit_at: finishedAt });

    const summary = `${outcome.healthScore}% site health · ${outcome.errors} errors · ${outcome.warnings} warnings · ${outcome.notices} notices across ${outcome.pagesCrawled} pages`;
    await recordActivity(ctx, { projectId: run.project_id, type: 'audit', title: 'Site audit completed', description: summary });
    await notify(ctx, { projectId: run.project_id, eventKey: 'audit_completed', title: `Site audit complete: ${projectName}`, description: summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The audit failed.';
    logger.warn('Audit failed', { auditId: run.id, userId: ctx.userId, ...errorFields(err) });
    await repo
      .updateAuditRun(db, run.id, { status: 'failed', phase: 'done', error_message: message.slice(0, 500), finished_at: new Date().toISOString() })
      .catch((e) => logger.error('Could not mark audit failed', { auditId: run.id, ...errorFields(e) }));
    await notify(ctx, { projectId: run.project_id, eventKey: 'audit_completed', title: `Site audit failed: ${projectName}`, description: message });
  }
}

export async function getAuditRun(ctx: Ctx, id: string): Promise<AuditRunDto> {
  const run = await repo.findAuditRun(ctx.db, id);
  if (!run) throw notFound('Audit not found.');
  return toRunDto(await expireIfStale(ctx, run));
}

/** The latest run (any status) plus the two latest completed ones, for status and change. */
export async function latestAudits(ctx: Ctx, projectId: string) {
  await requireProject(ctx, projectId);
  const [latest] = await repo.listAuditRuns(ctx.db, projectId, { limit: 1 });
  const completed = await repo.listAuditRuns(ctx.db, projectId, { status: 'completed', limit: 2 });
  return {
    latest: latest ? toRunDto(await expireIfStale(ctx, latest)) : null,
    lastCompleted: completed[0] ? toRunDto(completed[0]) : null,
    previousCompleted: completed[1] ? toRunDto(completed[1]) : null,
  };
}

/** Issues found by the latest completed audit. */
export async function latestChecks(ctx: Ctx, projectId: string): Promise<AuditIssueDto[]> {
  await requireProject(ctx, projectId);
  const [last] = await repo.listAuditRuns(ctx.db, projectId, { status: 'completed', limit: 1 });
  if (!last) return [];
  return (await repo.listIssues(ctx.db, last.id)).map(toIssueDto);
}

/** The last 7 completed audits, oldest first. */
export async function auditHistory(ctx: Ctx, projectId: string) {
  await requireProject(ctx, projectId);
  const runs = await repo.listAuditRuns(ctx.db, projectId, { status: 'completed', limit: 7 });
  return runs.reverse().map((r) => ({
    id: r.id,
    finishedAt: r.finished_at ?? r.created_at,
    healthScore: r.health_score,
    pagesCrawled: r.pages_crawled,
    errors: r.errors,
    warnings: r.warnings,
    notices: r.notices,
  }));
}

export async function getIssue(ctx: Ctx, id: string): Promise<AuditIssueDetailDto> {
  const issue = await repo.findIssue(ctx.db, id);
  if (!issue) throw notFound('Issue not found.');
  const pages = await repo.listIssuePages(ctx.db, id, 200);
  return {
    ...toIssueDto(issue),
    affectedPages: pages.map((p) => ({ url: p.url, statusCode: p.status_code, detail: p.detail })),
    recommendations: checkDefinitions[issue.check_key]?.fixes ?? [],
  };
}

export async function setIssueStatus(ctx: Ctx, id: string, status: 'open' | 'fixed'): Promise<AuditIssueDetailDto> {
  const issue = await repo.findIssue(ctx.db, id);
  if (!issue) throw notFound('Issue not found.');
  await repo.updateIssue(ctx.db, id, { status, fixed_at: status === 'fixed' ? new Date().toISOString() : null });
  return getIssue(ctx, id);
}
