// Request schemas for keywords, backlinks, competitors, content, audits, reports and settings.
import { z } from 'zod';
import { countryCode, httpUrl, optionalText, uuid } from './common.js';

// ── Keywords ───────────────────────────────────────────────────────────────

export const addKeywordsSchema = z.object({
  projectId: uuid,
  keywords: z
    .array(z.string().trim().toLowerCase().max(200, 'Each keyword must be 200 characters or fewer.'))
    .transform((list) => [...new Set(list.filter(Boolean))])
    .pipe(z.array(z.string()).min(1, 'Enter at least one keyword.').max(100, 'Add at most 100 keywords at a time.')),
  searchEngine: z.enum(['google', 'bing', 'yahoo']).default('google'),
  device: z.enum(['desktop', 'mobile']).default('desktop'),
});

// ── Backlinks ──────────────────────────────────────────────────────────────

export const addBacklinkSchema = z.object({
  projectId: uuid,
  sourceUrl: httpUrl,
  targetPage: z
    .string()
    .trim()
    .min(1, 'Enter the page on your site that is linked to.')
    .max(2048)
    .transform((v) => {
      // Accept a full URL or a path; store the path (with query) so it matches crawled pages.
      if (/^https?:\/\//i.test(v)) {
        try {
          const url = new URL(v);
          return `${url.pathname}${url.search}`;
        } catch {
          return v;
        }
      }
      return v.startsWith('/') ? v : `/${v}`;
    }),
  linkType: z.enum(['follow', 'nofollow', 'ugc', 'sponsored']).default('follow'),
  anchorText: z.string().trim().max(500).default(''),
  domainAuthority: z.coerce.number().int().min(0).max(100).nullable().optional(),
  notes: optionalText(2000),
  disavow: z.boolean().default(false),
});

// ── Competitors ────────────────────────────────────────────────────────────

export const addCompetitorSchema = z.object({
  projectId: uuid,
  domain: z
    .string()
    .trim()
    .min(1, 'Enter the competitor domain.')
    .max(253)
    .transform((v, ctx) => {
      try {
        const host = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).hostname.toLowerCase().replace(/^www\./, '');
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) throw new Error();
        return host;
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a domain like competitor.com.' });
        return z.NEVER;
      }
    }),
  displayName: optionalText(100),
  targetCountry: countryCode.optional(),
  trackingScope: z.enum(['organic', 'paid', 'all']).default('organic'),
});

// ── Content ────────────────────────────────────────────────────────────────

const urlPath = z
  .string()
  .trim()
  .min(1, 'Enter the URL path, like /blog/my-post.')
  .max(2048)
  .transform((v) => {
    if (/^https?:\/\//i.test(v)) {
      try {
        return new URL(v).pathname;
      } catch {
        return v;
      }
    }
    return v.startsWith('/') ? v : `/${v}`;
  })
  .pipe(z.string().regex(/^\/\S*$/, 'The URL path cannot contain spaces.'));

const keywordList = z
  .array(z.string().trim().toLowerCase().max(200))
  .max(50, 'Use at most 50 target keywords.')
  .transform((list) => [...new Set(list.filter(Boolean))]);

const contentFields = {
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  urlPath,
  contentType: z.enum(['blog', 'landing', 'tool', 'guide']),
  status: z.enum(['draft', 'published', 'needs-update', 'outdated']),
  primaryKeyword: z.string().trim().toLowerCase().max(200).nullable(),
  targetKeywords: keywordList,
  metaDescription: z.string().trim().max(500).nullable(),
};

export const createContentSchema = z.object({
  projectId: uuid,
  ...contentFields,
  contentType: contentFields.contentType.default('blog'),
  status: contentFields.status.default('draft'),
  primaryKeyword: contentFields.primaryKeyword.optional(),
  targetKeywords: keywordList.default([]),
  metaDescription: contentFields.metaDescription.optional(),
});

export const updateContentSchema = z
  .object(contentFields)
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, 'Nothing to update.');

// ── Audits ─────────────────────────────────────────────────────────────────

export const crawlDepthLimits = { quick: 100, standard: 500, full: 1000 } as const;

export const startAuditSchema = z
  .object({
    projectId: uuid,
    crawlDepth: z.enum(['quick', 'standard', 'full']).default('standard'),
    maxPages: z.coerce.number().int().min(1, 'Crawl at least 1 page.').max(1000, 'Crawl at most 1,000 pages.').optional(),
    userAgent: z.enum(['desktop', 'mobile', 'googlebot']).default('desktop'),
  })
  .transform((v) => ({
    ...v,
    maxPages: Math.min(v.maxPages ?? crawlDepthLimits[v.crawlDepth], crawlDepthLimits[v.crawlDepth]),
  }));

export const issueStatusSchema = z.object({ status: z.enum(['open', 'fixed']) });

// ── Reports ────────────────────────────────────────────────────────────────

export const reportSections = ['KPIs', 'Traffic', 'Keywords', 'Backlinks', 'Site Audit', 'Competitors', 'AI SEO'] as const;

export const createReportSchema = z.object({
  projectId: uuid,
  template: z.enum([
    'executive-summary',
    'technical-audit',
    'keyword-performance',
    'backlink-report',
    'competitor-benchmark',
    'ai-seo-report',
  ]),
  format: z.enum(['pdf', 'csv', 'xlsx']).default('pdf'),
  dateRangeDays: z.coerce
    .number()
    .refine((n): n is 7 | 30 | 90 => n === 7 || n === 30 || n === 90, 'Date range must be 7, 30 or 90 days.')
    .default(30),
  sections: z
    .array(z.enum(reportSections))
    .min(1, 'Choose at least one section.')
    .transform((s) => [...new Set(s)]),
});

// ── Settings / profile ─────────────────────────────────────────────────────

export const notificationEventKeys = [
  'audit_completed',
  'new_backlink',
  'keyword_ranking_changed',
  'lost_ranking',
  'report_ready',
  'ai_score_updated',
  'competitor_movement',
] as const;

export const preferenceParams = z.object({ key: z.enum(notificationEventKeys) });
export const preferenceBody = z.object({ email: z.boolean(), push: z.boolean() });

export const profilePatchSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name.').max(100),
    company: z.string().trim().max(100).nullable(),
    jobTitle: z.string().trim().max(100).nullable(),
  })
  .partial()
  .strict()
  .refine((p) => Object.keys(p).length > 0, 'Nothing to update.');

export const activitiesQuery = z.object({ projectId: uuid.optional() });
