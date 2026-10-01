// Applies supabase/tests/auth_stub.sql and every file in supabase/migrations to an in-memory
// PostgreSQL (PGlite), then checks row-level security and constraints as real users would hit them.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..', '..', 'supabase');
const A = 'aaaaaaaa-0000-0000-0000-000000000001';
const B = 'bbbbbbbb-0000-0000-0000-000000000002';

let db: PGlite;

async function as<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role;');
  }
}

async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows;
}

async function errorCode(sql: string, params: unknown[] = []) {
  try {
    await db.query(sql, params);
  } catch (err) {
    return (err as { code?: string }).code;
  }
  return 'no error';
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(root, 'tests', 'auth_stub.sql'), 'utf8'));
  for (const file of readdirSync(join(root, 'migrations')).sort()) {
    await db.exec(readFileSync(join(root, 'migrations', file), 'utf8'));
  }
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'a@example.com', '{"name":"Alice"}'), ($2, 'b@example.com', '{}')`, [A, B]);
}, 60_000);

describe('migrations', () => {
  let projectA: string;

  it('create profiles on sign-up and keep the phase-1 rules', async () => {
    expect(await rows(`select name, plan, role from public.profiles order by email`)).toEqual([
      { name: 'Alice', plan: 'free', role: 'owner' },
      { name: 'b', plan: 'free', role: 'owner' },
    ]);
    projectA = await as(A, async () => {
      const [p] = await rows<{ id: string }>(
        `select id from public.create_project('example.com', 'https://example.com', 'saas', 'gb', array['seo audit'])`
      );
      return p.id;
    });
    const [kw] = await as(A, () => rows<{ created_at: Date }>(`select created_at from public.project_keywords`));
    expect(kw.created_at).toBeInstanceOf(Date);
  });

  it('store audits, issues and pages for the owner only', async () => {
    const auditId = await as(A, async () => {
      const [run] = await rows<{ id: string }>(
        `insert into public.audit_runs (project_id, crawl_depth, max_pages, user_agent) values ($1, 'quick', 10, 'desktop') returning id`,
        [projectA]
      );
      const [issue] = await rows<{ id: string }>(
        `insert into public.audit_issues (audit_id, project_id, check_key, type, title, occurrences, pages)
         values ($1, $2, 'missing_title', 'error', 'Missing Meta Title', 2, 2) returning id`,
        [run.id, projectA]
      );
      await db.query(`insert into public.audit_issue_pages (issue_id, project_id, url, status_code) values ($1, $2, '/a', 200)`, [
        issue.id,
        projectA,
      ]);
      return run.id;
    });

    expect(
      await as(A, () =>
        errorCode(`insert into public.audit_runs (project_id, crawl_depth, max_pages, user_agent) values ($1, 'quick', 10, 'desktop')`, [
          projectA,
        ])
      )
    ).toBe('23505'); // one active audit per project

    await as(B, async () => {
      expect(await rows(`select * from public.audit_runs`)).toEqual([]);
      expect(await rows(`select * from public.audit_issues`)).toEqual([]);
      expect(await rows(`select * from public.audit_issue_pages`)).toEqual([]);
      expect(
        await errorCode(
          `insert into public.audit_runs (project_id, crawl_depth, max_pages, user_agent) values ($1, 'quick', 10, 'desktop')`,
          [projectA]
        )
      ).toBe('42501');
      await db.query(`update public.audit_runs set status = 'failed' where id = $1`, [auditId]);
    });
    const [run] = await as(A, () => rows<{ status: string }>(`select status from public.audit_runs where id = $1`, [auditId]));
    expect(run.status).toBe('pending');
  });

  it('keep issue pages attached to an issue of the same project', async () => {
    const other = await as(A, async () => {
      const [p] = await rows<{ id: string }>(`select id from public.create_project('other.com', 'https://other.com')`);
      return p.id;
    });
    const [issue] = await as(A, () => rows<{ id: string }>(`select id from public.audit_issues limit 1`));
    expect(
      await as(A, () =>
        errorCode(`insert into public.audit_issue_pages (issue_id, project_id, url) values ($1, $2, '/x')`, [issue.id, other])
      )
    ).toBe('23503');
  });

  it('validate and isolate backlinks, competitors and content', async () => {
    await as(A, async () => {
      await db.query(
        `insert into public.backlinks (project_id, source_url, source_domain, target_page, link_type) values ($1, 'https://news.site/a', 'news.site', '/blog', 'ugc')`,
        [projectA]
      );
      expect(
        await errorCode(
          `insert into public.backlinks (project_id, source_url, source_domain, target_page) values ($1, 'https://news.site/a', 'news.site', '/blog')`,
          [projectA]
        )
      ).toBe('23505');
      expect(
        await errorCode(
          `insert into public.backlinks (project_id, source_url, source_domain, target_page, domain_authority) values ($1, 'https://x.site/', 'x.site', '/', 101)`,
          [projectA]
        )
      ).toBe('23514');
      await db.query(`insert into public.competitors (project_id, domain, display_name) values ($1, 'rival.com', 'Rival')`, [projectA]);
      expect(
        await errorCode(`insert into public.competitors (project_id, domain, display_name) values ($1, 'RIVAL.com', 'Again')`, [projectA])
      ).toBe('23505');
      await db.query(`insert into public.content_pages (project_id, title, url_path) values ($1, 'Guide', '/guide')`, [projectA]);
      expect(
        await errorCode(`insert into public.content_pages (project_id, title, url_path) values ($1, 'Bad', 'no-slash')`, [projectA])
      ).toBe('23514');
    });
    await as(B, async () => {
      for (const table of ['backlinks', 'competitors', 'content_pages']) {
        expect(await rows(`select * from public.${table}`)).toEqual([]);
      }
      expect(
        await errorCode(`insert into public.competitors (project_id, domain, display_name) values ($1, 'evil.com', 'Evil')`, [projectA])
      ).toBe('42501');
    });
  });

  it('scope activities, notifications and preferences to their user', async () => {
    await as(A, async () => {
      await db.query(`insert into public.activities (project_id, type, title) values ($1, 'project', 'Project created')`, [projectA]);
      await db.query(`insert into public.notifications (project_id, event_key, title) values ($1, 'audit_completed', 'Done')`, [projectA]);
      await db.query(`insert into public.notification_preferences (event_key, email, push) values ('report_ready', true, false)`);
      expect(await errorCode(`update public.notifications set title = 'changed'`)).toBe('42501');
      await db.query(`update public.notifications set read_at = now()`);
      expect(
        await errorCode(`insert into public.notification_preferences (event_key, email, push) values ('bogus', true, true)`)
      ).toBe('23514');
    });
    await as(B, async () => {
      expect(await rows(`select * from public.activities`)).toEqual([]);
      expect(await rows(`select * from public.notifications`)).toEqual([]);
      expect(await rows(`select * from public.notification_preferences`)).toEqual([]);
      expect(
        await errorCode(`insert into public.activities (project_id, type, title) values ($1, 'project', 'x')`, [projectA])
      ).toBe('42501');
      expect(
        await errorCode(`insert into public.notifications (user_id, event_key, title) values ($1, 'audit_completed', 'x')`, [A])
      ).toBe('42501');
    });
  });

  it('keep report records and files private', async () => {
    await as(A, async () => {
      await db.query(
        `insert into public.reports (project_id, name, template, format, date_range_days, sections) values ($1, 'R', 'executive-summary', 'pdf', 30, array['KPIs'])`,
        [projectA]
      );
      await db.query(`insert into storage.objects (bucket_id, name) values ('reports', $1)`, [`${A}/r.pdf`]);
      expect(await errorCode(`insert into storage.objects (bucket_id, name) values ('reports', $1)`, [`${B}/r.pdf`])).toBe('42501');
    });
    await as(B, async () => {
      expect(await rows(`select * from public.reports`)).toEqual([]);
      expect(await rows(`select * from storage.objects`)).toEqual([]);
    });
    expect(await rows(`select id, public from storage.buckets order by id`)).toEqual([
      { id: 'avatars', public: false },
      { id: 'reports', public: false },
    ]);
  });

  it('delete everything of a project with the project', async () => {
    await as(A, () => db.query(`delete from public.projects where id = $1`, [projectA]));
    for (const table of ['audit_runs', 'audit_issues', 'audit_issue_pages', 'backlinks', 'competitors', 'content_pages', 'reports']) {
      expect(await rows(`select count(*)::int as n from public.${table} where project_id = $1`, [projectA])).toEqual([{ n: 0 }]);
    }
  });
});
