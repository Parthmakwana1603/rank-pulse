import { afterEach, describe, expect, it } from 'vitest';
import * as seo from '@/lib/seo-data';
import { formatCompactNumber, initialsOf, parseCompactNumber } from '@/lib/utils';
import { apiGet } from './client';
import { createProject, deleteProject, toApiError, toProjectItem, validateNewProject, type NewProjectForm } from './projects';

const form = (overrides: Partial<NewProjectForm> = {}): NewProjectForm => ({
  name: '',
  websiteUrl: 'https://example.com',
  industry: '',
  targetCountry: '',
  keywords: '',
  ...overrides,
});

describe('validateNewProject', () => {
  it('adds https:// and defaults the name to the domain', () => {
    const result = validateNewProject(form({ websiteUrl: 'www.Example.com/' }));
    expect(result).toEqual({
      ok: true,
      input: { name: 'example.com', websiteUrl: 'https://www.example.com', trackingKeywords: [] },
    });
  });

  it('keeps a path but drops its trailing slash', () => {
    const result = validateNewProject(form({ websiteUrl: 'https://example.com/blog/' }));
    expect(result.ok && result.input.websiteUrl).toBe('https://example.com/blog');
  });

  it('splits, trims, lowercases and de-duplicates keywords', () => {
    const result = validateNewProject(form({ keywords: 'SEO audit, seo audit ,\nKeyword Research,,' }));
    expect(result.ok && result.input.trackingKeywords).toEqual(['seo audit', 'keyword research']);
  });

  it('passes industry and country through', () => {
    const result = validateNewProject(form({ name: 'Acme', industry: 'saas', targetCountry: 'GB' }));
    expect(result.ok && result.input).toMatchObject({ name: 'Acme', industry: 'saas', targetCountry: 'GB' });
  });

  it.each([
    [{ websiteUrl: '' }, 'websiteUrl'],
    [{ websiteUrl: 'not a url' }, 'websiteUrl'],
    [{ websiteUrl: 'localhost' }, 'websiteUrl'],
    [{ websiteUrl: 'ftp://example.com' }, 'websiteUrl'],
    [{ name: 'x' }, 'name'],
    [{ name: 'x'.repeat(101) }, 'name'],
    [{ keywords: Array.from({ length: 101 }, (_, i) => `kw${i}`).join(',') }, 'keywords'],
  ] as const)('rejects %o', (overrides, field) => {
    const result = validateNewProject(form(overrides));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors[field]).toBeTruthy();
  });
});

describe('toProjectItem', () => {
  const row = {
    id: 'p1',
    name: 'example.com',
    website_url: 'https://example.com',
    favicon: null,
    status: 'active' as const,
    health_score: 0,
    authority_score: 0,
    traffic_value: null,
    last_audit_at: null,
    project_keywords: [{ count: 3 }],
  };

  it('maps a new project row to the screen shape', () => {
    expect(toProjectItem(row)).toEqual({
      id: 'p1',
      name: 'example.com',
      websiteUrl: 'https://example.com',
      favicon: 'E',
      status: 'active',
      traffic: '—',
      keywords: 3,
      health: 0,
      authority: 0,
      lastAudit: 'not run yet',
      trend: [],
    });
  });

  it('formats the last audit time relative to now', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();
    expect(toProjectItem({ ...row, last_audit_at: twoHoursAgo }).lastAudit).toBe('2 hours ago');
  });
});

describe('toApiError', () => {
  it.each([
    ['23505', 409, 'You already have a project for this website.'],
    ['23514', 400, 'Some project details are invalid. Check the URL, name and country.'],
    ['42501', 403, "You don't have permission to do that. Try signing in again."],
    ['22023', 400, 'A project can track at most 100 keywords'],
    ['XX000', undefined, 'A project can track at most 100 keywords'],
  ])('maps Postgres code %s', (code, status, message) => {
    const err = toApiError({ code, message: 'A project can track at most 100 keywords' });
    expect(err).toMatchObject({ status, message });
  });
});

describe('demo mode (no backend configured)', () => {
  const original = [...seo.projectList];
  afterEach(() => {
    seo.projectList.splice(0, seo.projectList.length, ...original);
  });

  it('creates and deletes projects in memory', async () => {
    await createProject({ name: 'new.com', websiteUrl: 'https://new.com', trackingKeywords: ['a', 'b'] });
    const created = (await apiGet<seo.ProjectItem[]>('/projects')).find((p) => p.name === 'new.com');
    expect(created).toMatchObject({ keywords: 2, health: 0, trend: [] });
    expect(created?.id).toBeTruthy();

    await deleteProject(created!);
    expect((await apiGet<seo.ProjectItem[]>('/projects')).some((p) => p.name === 'new.com')).toBe(false);
  });

  it('rejects a website that is already a sample project', async () => {
    await expect(
      createProject({ name: 'dup', websiteUrl: 'https://ACME-corp.com', trackingKeywords: [] })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('deletes demo projects (which have no id) by name', async () => {
    await deleteProject({ name: 'globex.io' });
    expect((await apiGet<seo.ProjectItem[]>('/projects')).map((p) => p.name)).not.toContain('globex.io');
  });
});

describe('utils', () => {
  it('parses and formats compact numbers', () => {
    expect(parseCompactNumber('248.5K')).toBe(248_500);
    expect(parseCompactNumber('1.2M')).toBe(1_200_000);
    expect(parseCompactNumber('950')).toBe(950);
    expect(parseCompactNumber('—')).toBeNull();
    expect(formatCompactNumber(742_300)).toBe('742.3K');
  });

  it('builds initials', () => {
    expect(initialsOf('Jamie Doe')).toBe('JD');
    expect(initialsOf('parth kumar makwana')).toBe('PM');
    expect(initialsOf('jamie')).toBe('JA');
    expect(initialsOf('  ')).toBe('?');
  });
});
