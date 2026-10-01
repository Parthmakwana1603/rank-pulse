import type { z } from 'zod';
import * as repo from '../../repositories/reports.repository.js';
import type { ReportRow } from '../../repositories/reports.repository.js';
import * as storage from '../../repositories/storage.repository.js';
import type { Ctx } from '../../utils/context.js';
import { conflict, notFound } from '../../utils/http-error.js';
import { errorFields, logger } from '../../utils/logger.js';
import type { createReportSchema } from '../../validators/resources.js';
import { reportSections } from '../../validators/resources.js';
import { backlinkAnalytics, listBacklinks } from '../backlinks.service.js';
import { listCompetitors } from '../competitors.service.js';
import { dashboardSummary, type KpiKey } from '../dashboard.service.js';
import { latestAudits, latestChecks } from '../audits.service.js';
import { notify, recordActivity } from '../feed.service.js';
import { jobs } from '../jobs/job-runner.js';
import { listKeywords } from '../keywords.service.js';
import { requireProject } from '../projects.service.js';
import { mimeTypes, render, type ReportDoc, type ReportSection } from './render.js';
import { reportTemplates, templateByKey } from './templates.js';

const STALE_AFTER_MS = 10 * 60_000;

export interface ReportDto {
  id: string;
  projectId: string;
  name: string;
  template: string;
  format: ReportRow['format'];
  dateRangeDays: number;
  sections: string[];
  status: ReportRow['status'];
  fileSize: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

const toDto = (r: ReportRow): ReportDto => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  template: r.template,
  format: r.format,
  dateRangeDays: r.date_range_days,
  sections: r.sections,
  status: r.status,
  fileSize: r.file_size,
  errorMessage: r.error_message,
  createdAt: r.created_at,
  completedAt: r.completed_at,
});

export function listTemplates() {
  return reportTemplates.map((t) => ({ ...t, defaultSections: [...t.defaultSections] }));
}

async function expireIfStale(ctx: Ctx, r: ReportRow): Promise<ReportRow> {
  const active = r.status === 'pending' || r.status === 'running';
  if (!active || Date.now() - Date.parse(r.created_at) < STALE_AFTER_MS) return r;
  const patch = { status: 'failed' as const, error_message: 'Report generation stopped unexpectedly. Please try again.' };
  await repo.updateReport(ctx.db, r.id, patch);
  return { ...r, ...patch };
}

export async function listReports(ctx: Ctx, projectId: string): Promise<ReportDto[]> {
  await requireProject(ctx, projectId);
  const rows = await repo.listReports(ctx.db, projectId, 50);
  return Promise.all(rows.map(async (r) => toDto(await expireIfStale(ctx, r))));
}

export async function getReport(ctx: Ctx, id: string): Promise<ReportDto> {
  const row = await repo.findReport(ctx.db, id);
  if (!row) throw notFound('Report not found.');
  return toDto(await expireIfStale(ctx, row));
}

export async function createReport(ctx: Ctx, input: z.output<typeof createReportSchema>): Promise<ReportDto> {
  const project = await requireProject(ctx, input.projectId);
  const template = templateByKey(input.template)!;
  const row = await repo.insertReport(ctx.db, {
    project_id: input.projectId,
    name: `${template.name} — ${project.name}`,
    template: input.template,
    format: input.format,
    date_range_days: input.dateRangeDays,
    // Keep sections in the order the report prints them.
    sections: reportSections.filter((s) => input.sections.includes(s)),
  });
  jobs.enqueue(`report:${row.id}`, () => generateReport(ctx, row));
  return toDto(row);
}

export async function downloadReport(ctx: Ctx, id: string) {
  const row = await repo.findReport(ctx.db, id);
  if (!row) throw notFound('Report not found.');
  if (row.status !== 'completed' || !row.file_path) throw conflict("This report isn't ready yet.");
  const fileName = `${row.name.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-')}.${row.format}`;
  return { url: await storage.signedUrl(ctx.db, 'reports', row.file_path, 60, fileName), fileName };
}

// ── Generation job ─────────────────────────────────────────────────────────

const kpiLabels: Record<KpiKey, string> = {
  'site-health': 'Site health (%)',
  'open-issues': 'Open audit issues',
  'pages-crawled': 'Pages crawled',
  'tracked-keywords': 'Tracked keywords',
  backlinks: 'Backlinks',
  'referring-domains': 'Referring domains',
  competitors: 'Competitors tracked',
  'content-pages': 'Content pages',
};

const NOT_CONNECTED = (what: string, source: string) =>
  `${what} needs ${source}, which isn't connected to RankPulse yet, so this section has no data.`;

export async function buildReportDoc(ctx: Ctx, row: ReportRow): Promise<ReportDoc> {
  const project = await requireProject(ctx, row.project_id);
  const template = templateByKey(row.template);
  const sections: ReportSection[] = [];

  for (const name of row.sections) {
    switch (name) {
      case 'KPIs': {
        const summary = await dashboardSummary(ctx, project.id);
        sections.push({
          title: 'KPIs',
          tables: [{ columns: ['Metric', 'Value', 'Previous audit'], rows: summary.kpis.map((k) => [kpiLabels[k.key], k.value, k.previous]) }],
        });
        break;
      }
      case 'Traffic':
        sections.push({ title: 'Traffic', note: NOT_CONNECTED('Traffic data', 'Google Analytics or Search Console'), tables: [] });
        break;
      case 'Keywords': {
        const keywords = await listKeywords(ctx, project.id);
        sections.push({
          title: 'Keywords',
          note: `${keywords.length} tracked keywords. ${NOT_CONNECTED('Positions, volume and difficulty', 'a rank-tracking data provider')}`,
          tables: [
            {
              columns: ['Keyword', 'Search engine', 'Device', 'Added', 'Position'],
              rows: keywords.map((k) => [k.keyword, k.searchEngine, k.device, k.createdAt.slice(0, 10), k.rank]),
            },
          ],
        });
        break;
      }
      case 'Backlinks': {
        const [links, analytics] = await Promise.all([listBacklinks(ctx, project.id), backlinkAnalytics(ctx, project.id)]);
        const since = Date.now() - row.date_range_days * 86_400_000;
        sections.push({
          title: 'Backlinks',
          note: `Backlinks recorded in RankPulse. ${links.filter((l) => Date.parse(l.firstSeenAt) >= since).length} were added in the last ${row.date_range_days} days.`,
          tables: [
            {
              columns: ['Metric', 'Value'],
              rows: [
                ['Backlinks', analytics.stats.total],
                ['Referring domains', analytics.stats.referringDomains],
                ['New in the last 30 days', analytics.stats.newLast30Days],
                ['Disavowed', analytics.stats.disavowed],
              ],
            },
            {
              columns: ['Source', 'Target page', 'Anchor', 'Type', 'DA', 'Disavowed', 'First seen'],
              rows: links.slice(0, 1000).map((l) => [l.sourceUrl, l.targetPage, l.anchorText, l.linkType, l.domainAuthority, l.disavowed ? 'yes' : 'no', l.firstSeenAt.slice(0, 10)]),
            },
          ],
        });
        break;
      }
      case 'Site Audit': {
        const [audits, issues] = await Promise.all([latestAudits(ctx, project.id), latestChecks(ctx, project.id)]);
        const last = audits.lastCompleted;
        if (!last) {
          sections.push({ title: 'Site Audit', note: 'No site audit has completed for this project yet.', tables: [] });
          break;
        }
        sections.push({
          title: 'Site Audit',
          note: `Latest audit finished ${last.finishedAt?.slice(0, 16).replace('T', ' ')} UTC.`,
          tables: [
            {
              columns: ['Metric', 'Value'],
              rows: [
                ['Site health (%)', last.healthScore],
                ['Pages crawled', last.pagesCrawled],
                ['Errors', last.errors],
                ['Warnings', last.warnings],
                ['Notices', last.notices],
              ],
            },
            {
              columns: ['Severity', 'Check', 'Occurrences', 'Pages', 'Status'],
              rows: issues.map((i) => [i.type, i.title, i.occurrences, i.pages, i.status]),
            },
          ],
        });
        break;
      }
      case 'Competitors': {
        const competitors = (await listCompetitors(ctx, project.id)).filter((c) => !c.isYou);
        sections.push({
          title: 'Competitors',
          note: NOT_CONNECTED('Competitor traffic, keywords and authority', 'an SEO data provider'),
          tables: [{ columns: ['Domain', 'Name', 'Country', 'Scope', 'Added'], rows: competitors.map((c) => [c.domain, c.displayName, c.targetCountry, c.trackingScope, c.createdAt.slice(0, 10)]) }],
        });
        break;
      }
      case 'AI SEO':
        sections.push({ title: 'AI SEO', note: NOT_CONNECTED('AI visibility tracking', 'an AI search data provider'), tables: [] });
        break;
    }
  }

  return {
    title: `${template?.name ?? 'SEO Report'}: ${project.name}`,
    subtitle: `${project.website_url} · last ${row.date_range_days} days · generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by RankPulse`,
    sections,
  };
}

export async function generateReport(ctx: Ctx, row: ReportRow) {
  try {
    await repo.updateReport(ctx.db, row.id, { status: 'running' });
    const doc = await buildReportDoc(ctx, row);
    const file = await render(doc, row.format);
    const path = `${ctx.userId}/${row.id}.${row.format}`;
    await storage.uploadFile(ctx.db, 'reports', path, file, mimeTypes[row.format]);
    await repo.updateReport(ctx.db, row.id, {
      status: 'completed',
      file_path: path,
      file_size: file.byteLength,
      completed_at: new Date().toISOString(),
    });
    await recordActivity(ctx, { projectId: row.project_id, type: 'report', title: 'Report generated', description: `${row.name} (${row.format.toUpperCase()})` });
    await notify(ctx, { projectId: row.project_id, eventKey: 'report_ready', title: 'Report ready', description: row.name });
  } catch (err) {
    logger.warn('Report failed', { reportId: row.id, userId: ctx.userId, ...errorFields(err) });
    await repo
      .updateReport(ctx.db, row.id, { status: 'failed', error_message: 'The report could not be generated. Please try again.' })
      .catch((e) => logger.error('Could not mark report failed', { reportId: row.id, ...errorFields(e) }));
  }
}
