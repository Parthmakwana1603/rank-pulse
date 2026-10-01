// The audit job's status transitions and side effects, with a fake crawl and mocked repositories.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CrawlResult } from '../src/services/crawler/crawl.js';

vi.mock('../src/repositories/audits.repository.js', () => ({
  updateAuditRun: vi.fn(async () => {}),
  insertIssues: vi.fn(async (_db: unknown, issues: { check_key: string }[]) => issues.map((i, n) => ({ ...i, id: `issue-${n}` }))),
  insertIssuePages: vi.fn(async () => {}),
}));
vi.mock('../src/repositories/projects.repository.js', () => ({ updateProject: vi.fn(async () => true) }));
vi.mock('../src/repositories/feed.repository.js', () => ({ insertActivity: vi.fn(), insertNotification: vi.fn() }));

const auditsRepo = await import('../src/repositories/audits.repository.js');
const projectsRepo = await import('../src/repositories/projects.repository.js');
const feedRepo = await import('../src/repositories/feed.repository.js');
const { runAudit } = await import('../src/services/audits.service.js');

const ctx = { userId: 'u', email: 'u@x.com', db: {} as never };
const run = {
  id: 'run-1',
  project_id: 'p-1',
  status: 'pending',
  phase: 'queued',
  crawl_depth: 'quick',
  max_pages: 10,
  user_agent: 'desktop',
  pages_crawled: 0,
  health_score: null,
  errors: 0,
  warnings: 0,
  notices: 0,
  error_message: null,
  created_at: new Date().toISOString(),
  started_at: null,
  finished_at: null,
} as const;

const page = (url: string, over: Partial<CrawlResult['pages'][number]> = {}): CrawlResult['pages'][number] => ({
  url,
  status: 200,
  ms: 100,
  isHtml: true,
  isHttps: true,
  title: `Title ${url}`,
  metaDescription: 'desc',
  wordCount: 500,
  imageCount: 0,
  imagesWithoutAlt: 0,
  hasStructuredData: true,
  insecureResources: [],
  textHash: url,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe('runAudit', () => {
  it('stores results and updates the run, project, feed and notifications', async () => {
    const crawl = vi.fn(async () => ({
      pages: [page('https://s.com/'), page('https://s.com/a', { title: '' })],
      linkedFrom: new Map(),
      robotsBlocked: 0,
    }));
    await runAudit(ctx, { ...run }, 'https://s.com', 'Site', crawl);

    const updates = vi.mocked(auditsRepo.updateAuditRun).mock.calls.map((c) => c[2]);
    expect(updates[0]).toMatchObject({ status: 'running', phase: 'crawling' });
    expect(updates.at(-1)).toMatchObject({ status: 'completed', health_score: 50, errors: 1, pages_crawled: 2 });
    expect(auditsRepo.insertIssues).toHaveBeenCalledWith(ctx.db, [
      expect.objectContaining({ check_key: 'missing_title', type: 'error', occurrences: 1, pages: 1, project_id: 'p-1', audit_id: 'run-1' }),
    ]);
    expect(auditsRepo.insertIssuePages).toHaveBeenCalledWith(ctx.db, [
      { issue_id: 'issue-0', project_id: 'p-1', url: 'https://s.com/a', status_code: 200, detail: null },
    ]);
    expect(projectsRepo.updateProject).toHaveBeenCalledWith(ctx.db, 'p-1', { health_score: 50, last_audit_at: expect.any(String) });
    expect(feedRepo.insertActivity).toHaveBeenCalledWith(ctx.db, expect.objectContaining({ type: 'audit', title: 'Site audit completed' }));
    expect(feedRepo.insertNotification).toHaveBeenCalledWith(ctx.db, expect.objectContaining({ event_key: 'audit_completed' }));
  });

  it('marks the run failed when the site cannot be reached', async () => {
    const crawl = vi.fn(async () => ({
      pages: [page('https://down.com/', { status: 0, isHtml: false, error: 'getaddrinfo ENOTFOUND down.com' })],
      linkedFrom: new Map(),
      robotsBlocked: 0,
    }));
    await runAudit(ctx, { ...run }, 'https://down.com', 'Down', crawl);
    const last = vi.mocked(auditsRepo.updateAuditRun).mock.calls.at(-1)![2];
    expect(last).toMatchObject({ status: 'failed', error_message: expect.stringContaining('ENOTFOUND') });
    expect(projectsRepo.updateProject).not.toHaveBeenCalled();
    expect(feedRepo.insertNotification).toHaveBeenCalledWith(ctx.db, expect.objectContaining({ title: 'Site audit failed: Down' }));
  });
});
