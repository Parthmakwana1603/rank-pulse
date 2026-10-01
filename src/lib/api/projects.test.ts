import { afterEach, describe, expect, it } from 'vitest';
import * as seo from '@/lib/seo-data';
import { formatCompactNumber, initialsOf, parseCompactNumber } from '@/lib/utils';
import { apiGet } from './client';
import { createProject, deleteProject, validateNewProject, type NewProjectForm } from './projects';
import { toProjectItem } from './mappers';
import type { ProjectDto } from './types';

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

describe('toProjectItem (API → screen)', () => {
  const dto: ProjectDto = {
    id: 'p1',
    name: 'example.com',
    websiteUrl: 'https://example.com',
    favicon: 'E',
    industry: null,
    targetCountry: null,
    status: 'active',
    keywordCount: 3,
    healthScore: null,
    authorityScore: null,
    organicTraffic: null,
    lastAuditAt: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  it('maps a new project and shows missing metrics as empty', () => {
    expect(toProjectItem(dto)).toEqual({
      id: 'p1',
      name: 'example.com',
      websiteUrl: 'https://example.com',
      favicon: 'E',
      status: 'active',
      traffic: '—',
      keywords: 3,
      health: null,
      authority: null,
      lastAudit: 'not run yet',
      trend: [],
    });
  });

  it('formats audit time and traffic', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString();
    expect(toProjectItem({ ...dto, lastAuditAt: twoHoursAgo, healthScore: 91, organicTraffic: 248_500 })).toMatchObject({
      lastAudit: '2 hours ago',
      health: 91,
      traffic: '248.5K',
    });
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
    expect(created).toMatchObject({ keywords: 2, health: null, trend: [] });
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
