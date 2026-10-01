// Pure logic: SSRF guard, robots.txt, anchors/analytics, report rendering, CSV import, validators.
import { describe, expect, it } from 'vitest';
import { isBlockedAddress, safeGet } from '../src/services/crawler/safe-fetch.js';
import { parseRobots } from '../src/services/crawler/robots.js';
import { analyzeHtml, normalizeUrl } from '../src/services/crawler/crawl.js';
import { brandTermsFor, classifyAnchor, computeAnalytics } from '../src/services/backlinks.service.js';
import type { BacklinkRow } from '../src/repositories/backlinks.repository.js';
import { renderCsv, renderPdf, renderXlsx, type ReportDoc } from '../src/services/reports/render.js';
import { parseImportCsv } from '../src/services/projects.service.js';
import { newProjectSchema } from '../src/validators/projects.js';
import { fromDbError } from '../src/utils/db-error.js';
import { addBacklinkSchema, createReportSchema, startAuditSchema } from '../src/validators/resources.js';

describe('SSRF protection', () => {
  it('blocks private, loopback, link-local and metadata addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '64:ff9b::10.0.0.1']) {
      expect(isBlockedAddress(ip), ip).toBe(true);
    }
    for (const ip of ['8.8.8.8', '93.184.216.34', '2606:4700::1111']) expect(isBlockedAddress(ip), ip).toBe(false);
  });

  it('refuses to fetch loopback URLs', async () => {
    const res = await safeGet('http://127.0.0.1:8080/', { userAgent: 'test' });
    expect(res.status).toBe(0);
    expect(res.error).toMatch(/private or reserved/);
    const viaDns = await safeGet('http://localhost:8080/', { userAgent: 'test' });
    expect(viaDns.error).toMatch(/private or reserved/);
  });

  it('refuses non-http schemes', async () => {
    expect((await safeGet('file:///etc/passwd', { userAgent: 'test' })).error).toMatch(/http/);
  });
});

describe('robots.txt', () => {
  const robots = `
User-agent: googlebot
Disallow: /nogoogle

User-agent: *
Disallow: /admin
Allow: /admin/public
Disallow: /*.pdf$
`;
  it('applies the generic group with longest-match and wildcards', () => {
    const r = parseRobots(robots, ['rankpulsebot']);
    expect(r.isAllowed('/')).toBe(true);
    expect(r.isAllowed('/admin/users')).toBe(false);
    expect(r.isAllowed('/admin/public/page')).toBe(true);
    expect(r.isAllowed('/files/a.pdf')).toBe(false);
    expect(r.isAllowed('/files/a.pdf?x=1')).toBe(true);
    expect(r.isAllowed('/nogoogle')).toBe(true);
  });
  it('prefers a group naming the agent', () => {
    const r = parseRobots(robots, ['googlebot', 'rankpulsebot']);
    expect(r.isAllowed('/nogoogle')).toBe(false);
    expect(r.isAllowed('/admin')).toBe(true);
  });
});

describe('HTML analysis', () => {
  it('extracts SEO facts and ignores scripts in word counts', () => {
    const facts = analyzeHtml(
      `<html><head><title> T </title><meta name="Description" content=" d "><base href="https://site.com/sub/">
       <link rel="stylesheet" href="http://cdn.com/a.css"></head>
       <body><script>var hidden = "lots of words here";</script><img src="a.png"><a href="x#frag">x</a> one two</body></html>`,
      'https://site.com/page'
    );
    expect(facts).toMatchObject({
      title: 'T',
      metaDescription: 'd',
      imagesWithoutAlt: 1,
      insecureResources: ['http://cdn.com/a.css'],
      links: ['https://site.com/sub/x'],
      wordCount: 3,
      hasStructuredData: false,
    });
  });
  it('normalises URLs', () => {
    expect(normalizeUrl('HTTPS://Example.COM:443/a#b')).toBe('https://example.com/a');
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('backlink analytics', () => {
  const brand = brandTermsFor({ name: 'Acme Tools', website_url: 'https://www.acme-tools.com' });
  const kw = ['seo audit tool', 'keyword research'];
  it('classifies anchors', () => {
    expect(classifyAnchor('Acme Tools', brand, kw)).toBe('branded');
    expect(classifyAnchor('acme-tools.com/pricing', brand, kw)).toBe('naked-url');
    expect(classifyAnchor('seo audit tool', brand, kw)).toBe('exact');
    expect(classifyAnchor('the best seo audit tool ever', brand, kw)).toBe('partial');
    expect(classifyAnchor('click here', brand, kw)).toBe('generic');
    expect(classifyAnchor('', brand, kw)).toBe('generic');
  });

  it('computes stats, growth and top domains from rows', () => {
    const row = (o: Partial<BacklinkRow>): BacklinkRow => ({
      id: Math.random().toString(),
      project_id: 'p',
      source_url: 'https://a.com/x',
      source_domain: 'a.com',
      target_page: '/',
      anchor_text: 'acme tools',
      link_type: 'follow',
      domain_authority: null,
      notes: null,
      disavowed: false,
      disavowed_at: null,
      first_seen_at: '2026-09-20T00:00:00Z',
      created_at: '2026-09-20T00:00:00Z',
      ...o,
    });
    const now = new Date('2026-09-30T00:00:00Z');
    const a = computeAnalytics(
      [
        row({ domain_authority: 40 }),
        row({ source_url: 'https://a.com/y', domain_authority: 60, link_type: 'nofollow', anchor_text: 'keyword research' }),
        row({ source_domain: 'b.com', source_url: 'https://b.com/', first_seen_at: '2026-06-01T00:00:00Z' }),
        row({ source_domain: 'c.com', source_url: 'https://c.com/', disavowed: true, disavowed_at: '2026-09-25T00:00:00Z' }),
      ],
      brand,
      kw,
      now
    );
    expect(a.stats).toEqual({ total: 3, referringDomains: 2, newLast30Days: 2, disavowed: 1 });
    expect(a.growth.map((g) => g.month)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    expect(a.growth.at(-1)).toEqual({ month: '2026-09', new: 3, lost: 1 });
    expect(a.anchors).toEqual([
      { category: 'branded', count: 2 },
      { category: 'exact', count: 1 },
    ]);
    expect(a.linkTypes).toEqual([
      { type: 'follow', count: 2 },
      { type: 'nofollow', count: 1 },
    ]);
    expect(a.topDomains[0]).toEqual({ domain: 'a.com', backlinks: 2, authority: 60 });
  });
});

describe('report rendering', () => {
  const doc: ReportDoc = {
    title: 'Report',
    subtitle: 'sub',
    sections: [
      { title: 'Keywords', note: 'note', tables: [{ columns: ['Keyword', 'Pos'], rows: [['=cmd()', null], ['a, "b"', 3]] }] },
      { title: 'Traffic', note: 'Not connected', tables: [] },
    ],
  };
  it('CSV escapes quotes and neutralises formulas', () => {
    const text = renderCsv(doc).toString('utf8');
    expect(text.charCodeAt(0)).toBe(0xfeff);
    expect(text).toContain(`'=cmd(),`);
    expect(text).toContain('"a, ""b""",3');
  });
  it('produces a PDF and an XLSX file', async () => {
    expect((await renderPdf(doc)).subarray(0, 4).toString()).toBe('%PDF');
    expect((await renderXlsx(doc)).subarray(0, 2).toString()).toBe('PK');
  });
});

describe('CSV import parsing', () => {
  it('maps header aliases and trims values', () => {
    const rows = parseImportCsv(Buffer.from('﻿Website URL,Name,Country,Keywords,Extra\n example.com , Ex ,gb,a;b|c,zzz\n'));
    expect(rows).toEqual([{ websiteUrl: 'example.com', name: 'Ex', targetCountry: 'gb', keywords: 'a;b|c', '_ignored_Extra': 'zzz' }]);
  });
  it('rejects files without a website column or with too many rows', () => {
    expect(() => parseImportCsv(Buffer.from('name\nx\n'))).toThrow(/website_url/);
    expect(() => parseImportCsv(Buffer.from(`url\n${'a.com\n'.repeat(101)}`))).toThrow(/at most 100/);
    expect(() => parseImportCsv(Buffer.from(''))).toThrow(/no rows/);
  });
});

describe('database error mapping', () => {
  it.each([
    ['23505', 409, 'Already tracked.'],
    ['23514', 400, 'Some of the details are invalid.'],
    ['22023', 400, 'A project can track at most 100 keywords'],
    ['42501', 403, "You don't have permission to do that."],
    ['PGRST301', 401, 'Your session has expired. Please sign in again.'],
    ['XX000', 500, 'Something went wrong while saving your data. Please try again.'],
  ])('maps %s to %i', (code, status, message) => {
    const err = fromDbError({ code, message: 'A project can track at most 100 keywords' }, 'Already tracked.');
    expect(err).toMatchObject({ status, message });
  });
});

describe('validators', () => {
  it('normalise a new project like the frontend does', () => {
    expect(newProjectSchema.parse({ websiteUrl: 'https://www.shop.io/', trackingKeywords: ['A', 'a', ' b '] })).toEqual({
      name: 'shop.io',
      websiteUrl: 'https://www.shop.io',
      industry: undefined,
      targetCountry: undefined,
      trackingKeywords: ['a', 'b'],
    });
    expect(newProjectSchema.safeParse({ websiteUrl: 'https://x.io', trackingKeywords: Array.from({ length: 101 }, (_, i) => `k${i}`) }).success).toBe(false);
  });
  it('cap audit size by crawl depth', () => {
    const base = { projectId: '33333333-3333-4333-8333-333333333333' };
    expect(startAuditSchema.parse({ ...base, crawlDepth: 'quick', maxPages: 500 }).maxPages).toBe(100);
    expect(startAuditSchema.parse({ ...base, crawlDepth: 'standard' }).maxPages).toBe(500);
    expect(startAuditSchema.safeParse({ ...base, maxPages: 5000 }).success).toBe(false);
  });
  it('store backlink targets as paths', () => {
    const parsed = addBacklinkSchema.parse({ projectId: '33333333-3333-4333-8333-333333333333', sourceUrl: 'blog.io/post', targetPage: 'https://me.com/pricing?x=1' });
    expect(parsed).toMatchObject({ sourceUrl: 'https://blog.io/post', targetPage: '/pricing?x=1', linkType: 'follow', disavow: false });
  });
  it('only accept known report sections and ranges', () => {
    const base = { projectId: '33333333-3333-4333-8333-333333333333', template: 'executive-summary' };
    expect(createReportSchema.safeParse({ ...base, sections: ['Hacks'] }).success).toBe(false);
    expect(createReportSchema.safeParse({ ...base, sections: ['KPIs'], dateRangeDays: 14 }).success).toBe(false);
    expect(createReportSchema.parse({ ...base, sections: ['KPIs', 'KPIs'] })).toMatchObject({ sections: ['KPIs'], dateRangeDays: 30, format: 'pdf' });
  });
});
