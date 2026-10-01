// Turns crawled pages into audit issues. Titles match the check names the frontend already shows.
import type { CrawlResult, PageData } from './crawl.js';

export type IssueType = 'error' | 'warning' | 'notice';

export interface AffectedPage {
  url: string;
  statusCode: number | null;
  detail: string | null;
}

export interface FoundIssue {
  checkKey: string;
  type: IssueType;
  title: string;
  description: string;
  occurrences: number;
  pages: AffectedPage[];
}

export const SLOW_PAGE_MS = 3000;
export const THIN_CONTENT_WORDS = 300;

export const checkDefinitions: Record<string, { type: IssueType; title: string; description: string; fixes: string[] }> = {
  broken_links: {
    type: 'error',
    title: 'Broken Links',
    description: 'Internal links returning 4xx/5xx status codes or failing to load',
    fixes: [
      'Restore the missing pages, or 301-redirect them to the most relevant live page',
      'Update internal links that point to removed or moved pages',
      'Check server logs for pages returning 5xx errors',
      'Submit an updated XML sitemap to Google Search Console',
    ],
  },
  missing_title: {
    type: 'error',
    title: 'Missing Meta Title',
    description: 'Pages without a <title> tag',
    fixes: [
      'Add a unique, descriptive <title> to every page (roughly 50–60 characters)',
      'Put the main keyword near the start of the title',
      'Make sure your CMS template outputs the title tag',
    ],
  },
  https_issues: {
    type: 'error',
    title: 'HTTPS Issues',
    description: 'Pages served over HTTP or loading insecure (http://) resources',
    fixes: [
      'Redirect every HTTP URL to its HTTPS version with a 301',
      'Change resource URLs (images, scripts, stylesheets) from http:// to https://',
      'Add a Content-Security-Policy "upgrade-insecure-requests" header as a safety net',
    ],
  },
  missing_description: {
    type: 'warning',
    title: 'Missing Description',
    description: 'Pages without a meta description',
    fixes: [
      'Write a unique meta description (roughly 120–160 characters) for each page',
      'Summarise the page and include a call to action',
    ],
  },
  duplicate_content: {
    type: 'warning',
    title: 'Duplicate Content',
    description: 'Pages sharing the same title or the same text as another page',
    fixes: [
      'Give each page a unique title and content',
      'Add a rel="canonical" link to the preferred version of duplicated pages',
      'Merge near-identical pages and redirect the extras',
    ],
  },
  slow_pages: {
    type: 'warning',
    title: 'Slow Pages',
    description: `Pages that took over ${SLOW_PAGE_MS / 1000} seconds to download`,
    fixes: [
      'Enable caching and compression (gzip/brotli) on the server',
      'Use a CDN for static assets',
      'Reduce server response time (database queries, heavy plugins)',
    ],
  },
  missing_alt_text: {
    type: 'notice',
    title: 'Missing Alt Text',
    description: 'Images without alt attributes',
    fixes: [
      'Add descriptive alt text to meaningful images',
      'Use alt="" for purely decorative images so screen readers skip them',
    ],
  },
  missing_structured_data: {
    type: 'notice',
    title: 'Structured Data Missing',
    description: 'Pages without schema markup (JSON-LD or microdata)',
    fixes: [
      'Add JSON-LD structured data (the Schema Generator in RankPulse can create it)',
      'Validate markup with Google’s Rich Results Test',
    ],
  },
  thin_content: {
    type: 'notice',
    title: 'Thin Content',
    description: `Pages with under ${THIN_CONTENT_WORDS} words`,
    fixes: [
      'Expand thin pages with useful, original content',
      'Merge closely related thin pages into one stronger page',
      'Consider noindex for pages that don’t need to rank',
    ],
  },
};

const MAX_PAGES_PER_ISSUE = 200;

function issue(checkKey: string, occurrences: number, pages: AffectedPage[]): FoundIssue {
  const def = checkDefinitions[checkKey];
  return {
    checkKey,
    type: def.type,
    title: def.title,
    description: def.description,
    occurrences,
    pages: pages.slice(0, MAX_PAGES_PER_ISSUE),
  };
}

const okHtml = (p: PageData) => p.isHtml && p.status >= 200 && p.status < 300;

export interface AuditOutcome {
  issues: FoundIssue[];
  pagesCrawled: number;
  healthScore: number;
  errors: number;
  warnings: number;
  notices: number;
}

export function analyzeCrawl(result: CrawlResult): AuditOutcome {
  const { pages, linkedFrom } = result;
  const content = pages.filter(okHtml);
  const found: FoundIssue[] = [];
  const pagesWithErrors = new Set<string>();
  // Only pages counted in `pages` are affected pages for health; affected entries may be link targets.
  const add = (i: FoundIssue, errorPages: string[] = []) => {
    if (i.occurrences === 0) return;
    found.push(i);
    if (i.type === 'error') for (const url of errorPages) pagesWithErrors.add(url);
  };

  // Broken links: crawled internal URLs that failed, which some page links to.
  const broken = pages.filter((p) => (p.status === 0 || p.status >= 400) && (linkedFrom.get(p.url)?.length ?? 0) > 0);
  add(
    issue(
      'broken_links',
      broken.reduce((n, p) => n + (linkedFrom.get(p.url)?.length ?? 0), 0),
      broken.map((p) => {
        const sources = linkedFrom.get(p.url) ?? [];
        return {
          url: p.url,
          statusCode: p.status || null,
          detail: `${p.error ? `${p.error}. ` : ''}Linked from ${sources[0]}${sources.length > 1 ? ` and ${sources.length - 1} more` : ''}`,
        };
      })
    ),
    broken.map((p) => p.url)
  );

  const noTitle = content.filter((p) => !p.title);
  add(issue('missing_title', noTitle.length, noTitle.map((p) => ({ url: p.url, statusCode: p.status, detail: null }))), noTitle.map((p) => p.url));

  const insecure = content.filter((p) => !p.isHttps || p.insecureResources.length > 0);
  add(
    issue(
      'https_issues',
      insecure.reduce((n, p) => n + (p.isHttps ? p.insecureResources.length : 1), 0),
      insecure.map((p) => ({
        url: p.url,
        statusCode: p.status,
        detail: p.isHttps
          ? `${p.insecureResources.length} insecure resource${p.insecureResources.length === 1 ? '' : 's'}, e.g. ${p.insecureResources[0]}`
          : 'Served over HTTP',
      }))
    ),
    insecure.map((p) => p.url)
  );

  const noDescription = content.filter((p) => !p.metaDescription);
  add(issue('missing_description', noDescription.length, noDescription.map((p) => ({ url: p.url, statusCode: p.status, detail: null }))));

  const duplicates = new Map<string, PageData[]>();
  for (const p of content) {
    for (const key of [p.title ? `title:${p.title.toLowerCase()}` : null, p.textHash ? `text:${p.textHash}` : null]) {
      if (!key) continue;
      duplicates.set(key, [...(duplicates.get(key) ?? []), p]);
    }
  }
  const duplicated = new Map<string, string>();
  for (const [key, group] of duplicates) {
    if (group.length < 2) continue;
    for (const p of group) {
      if (duplicated.has(p.url)) continue;
      const other = group.find((g) => g !== p)!;
      duplicated.set(p.url, `${key.startsWith('title:') ? 'Same title' : 'Same text'} as ${other.url}`);
    }
  }
  add(issue('duplicate_content', duplicated.size, [...duplicated].map(([url, detail]) => ({ url, statusCode: 200, detail }))));

  const slow = content.filter((p) => p.ms > SLOW_PAGE_MS);
  add(issue('slow_pages', slow.length, slow.map((p) => ({ url: p.url, statusCode: p.status, detail: `${(p.ms / 1000).toFixed(1)} s` }))));

  const noAlt = content.filter((p) => p.imagesWithoutAlt > 0);
  add(
    issue(
      'missing_alt_text',
      noAlt.reduce((n, p) => n + p.imagesWithoutAlt, 0),
      noAlt.map((p) => ({ url: p.url, statusCode: p.status, detail: `${p.imagesWithoutAlt} of ${p.imageCount} images` }))
    )
  );

  const noSchema = content.filter((p) => !p.hasStructuredData);
  add(issue('missing_structured_data', noSchema.length, noSchema.map((p) => ({ url: p.url, statusCode: p.status, detail: null }))));

  const thin = content.filter((p) => p.wordCount < THIN_CONTENT_WORDS);
  add(issue('thin_content', thin.length, thin.map((p) => ({ url: p.url, statusCode: p.status, detail: `${p.wordCount} words` }))));

  const pagesCrawled = pages.length;
  const healthScore = pagesCrawled === 0 ? 0 : Math.round((100 * (pagesCrawled - pagesWithErrors.size)) / pagesCrawled);
  const total = (type: IssueType) => found.filter((i) => i.type === type).reduce((n, i) => n + i.occurrences, 0);

  return { issues: found, pagesCrawled, healthScore: Math.max(0, healthScore), errors: total('error'), warnings: total('warning'), notices: total('notice') };
}
