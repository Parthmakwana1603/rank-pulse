// Breadth-first crawler for one website. Collects the facts the audit checks need from each page.
import { createHash } from 'node:crypto';
import { parse, type HTMLElement } from 'node-html-parser';
import { allowAll, parseRobots, type Robots } from './robots.js';
import { safeGet } from './safe-fetch.js';

export type CrawlerAgent = 'desktop' | 'mobile' | 'googlebot';

export const userAgents: Record<CrawlerAgent, { header: string; robotsTokens: string[] }> = {
  desktop: {
    header: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 RankPulseBot/1.0',
    robotsTokens: ['rankpulsebot'],
  },
  mobile: {
    header: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 RankPulseBot/1.0',
    robotsTokens: ['rankpulsebot'],
  },
  // Identifies as Googlebot-compatible so sites that vary content for Googlebot can be checked,
  // while still naming RankPulseBot so site owners can tell who is crawling.
  googlebot: {
    header: 'Mozilla/5.0 (compatible; Googlebot/2.1; RankPulseBot/1.0)',
    robotsTokens: ['googlebot', 'rankpulsebot'],
  },
};

export interface PageData {
  url: string;
  status: number;
  ms: number;
  error?: string;
  isHtml: boolean;
  isHttps: boolean;
  title: string;
  metaDescription: string;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  hasStructuredData: boolean;
  insecureResources: string[];
  textHash: string | null;
}

export interface CrawlResult {
  pages: PageData[];
  /** For every internal URL that was linked to: the pages linking to it. */
  linkedFrom: Map<string, string[]>;
  robotsBlocked: number;
}

export interface CrawlOptions {
  startUrl: string;
  maxPages: number;
  agent: CrawlerAgent;
  concurrency?: number;
  /** Stop crawling new pages after this many milliseconds. */
  timeBudgetMs?: number;
  onProgress?: (pagesCrawled: number) => void;
}

/** Normalises a URL for de-duplication: no fragment, lower-case host, no default port. */
export function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const url = new URL(raw, base);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) url.port = '';
    const s = url.toString();
    return s.length > 2048 ? null : s;
  } catch {
    return null;
  }
}

const siteHost = (host: string) => host.toLowerCase().replace(/^www\./, '');

export function analyzeHtml(html: string, pageUrl: string) {
  const root = parse(html, { comment: false });
  const isHttps = pageUrl.startsWith('https:');

  const title = root.querySelector('title')?.text.trim() ?? '';
  const metaDescription =
    root
      .querySelectorAll('meta')
      .find((m) => m.getAttribute('name')?.toLowerCase() === 'description')
      ?.getAttribute('content')
      ?.trim() ?? '';

  const hasStructuredData =
    root.querySelectorAll('script').some((s) => s.getAttribute('type')?.toLowerCase() === 'application/ld+json') ||
    root.querySelector('[itemscope]') !== null;

  const insecureResources: string[] = [];
  if (isHttps) {
    const check = (el: HTMLElement, attr: string) => {
      const value = el.getAttribute(attr)?.trim();
      if (value && /^http:\/\//i.test(value)) insecureResources.push(value);
    };
    for (const el of root.querySelectorAll('img, script, iframe, audio, video, source')) check(el, 'src');
    for (const el of root.querySelectorAll('link')) {
      if (el.getAttribute('rel')?.toLowerCase().includes('stylesheet')) check(el, 'href');
    }
  }

  const images = root.querySelectorAll('img');
  const imagesWithoutAlt = images.filter((img) => !img.hasAttribute('alt')).length;

  const baseHref = root.querySelector('base')?.getAttribute('href');
  const base = baseHref ? (normalizeUrl(baseHref, pageUrl) ?? pageUrl) : pageUrl;
  const links: string[] = [];
  for (const a of root.querySelectorAll('a')) {
    const href = a.getAttribute('href')?.trim();
    if (!href || /^(mailto:|tel:|javascript:|data:|#)/i.test(href)) continue;
    const normalized = normalizeUrl(href, base);
    if (normalized) links.push(normalized);
  }

  for (const el of root.querySelectorAll('script, style, noscript, template, svg')) el.remove();
  const text = (root.querySelector('body') ?? root).text.replace(/\s+/g, ' ').trim();
  const wordCount = text ? text.split(' ').length : 0;
  const textHash = wordCount >= 50 ? createHash('sha1').update(text.toLowerCase()).digest('hex') : null;

  return {
    title,
    metaDescription,
    hasStructuredData,
    insecureResources: [...new Set(insecureResources)],
    imageCount: images.length,
    imagesWithoutAlt,
    links: [...new Set(links)],
    wordCount,
    textHash,
  };
}

async function loadRobots(origin: string, agent: CrawlerAgent): Promise<Robots> {
  const res = await safeGet(`${origin}/robots.txt`, { userAgent: userAgents[agent].header, maxBytes: 500_000, timeoutMs: 10_000 });
  if (res.status !== 200 || !res.body) return allowAll;
  return parseRobots(res.body, userAgents[agent].robotsTokens);
}

export async function crawlSite(opts: CrawlOptions): Promise<CrawlResult> {
  const start = normalizeUrl(opts.startUrl);
  if (!start) throw new Error('The project website URL is not a valid http(s) URL.');
  let host = siteHost(new URL(start).hostname);
  const robots = await loadRobots(new URL(start).origin, opts.agent);
  const deadline = Date.now() + (opts.timeBudgetMs ?? 8 * 60_000);
  const concurrency = opts.concurrency ?? 4;

  const seen = new Set<string>([start]);
  const queue: string[] = [start];
  const linkedFrom = new Map<string, string[]>();
  const pages: PageData[] = [];
  let robotsBlocked = 0;

  const crawlOne = async (url: string) => {
    const res = await safeGet(url, {
      userAgent: userAgents[opts.agent].header,
      wantBody: (type) => /html/i.test(type),
    });
    const finalUrl = normalizeUrl(res.finalUrl) ?? url;
    const isHtml = /html/i.test(res.contentType) && res.body !== null;
    const page: PageData = {
      url,
      status: res.status,
      ms: Math.round(res.ms),
      error: res.error,
      isHtml,
      isHttps: finalUrl.startsWith('https:'),
      title: '',
      metaDescription: '',
      wordCount: 0,
      imageCount: 0,
      imagesWithoutAlt: 0,
      hasStructuredData: false,
      insecureResources: [],
      textHash: null,
    };
    // A redirect is recorded as its own (non-content) page and its target is queued, so content
    // is only ever analysed under its final URL (http→https or /a → /a/ aren't duplicates).
    if (finalUrl !== url) {
      page.isHtml = false;
      const target = new URL(finalUrl);
      // If the start page moves to another host (e.g. to www or a new domain), crawl that host.
      if (url === start && pages.length === 0) host = siteHost(target.hostname);
      if (siteHost(target.hostname) === host && !seen.has(finalUrl)) {
        seen.add(finalUrl);
        if (robots.isAllowed(`${target.pathname}${target.search}`)) queue.push(finalUrl);
        else robotsBlocked++;
      }
    } else if (isHtml && res.status >= 200 && res.status < 300) {
      const facts = analyzeHtml(res.body!, finalUrl);
      Object.assign(page, {
        title: facts.title,
        metaDescription: facts.metaDescription,
        wordCount: facts.wordCount,
        imageCount: facts.imageCount,
        imagesWithoutAlt: facts.imagesWithoutAlt,
        hasStructuredData: facts.hasStructuredData,
        insecureResources: facts.insecureResources,
        textHash: facts.textHash,
      });
      for (const link of facts.links) {
        const target = new URL(link);
        if (siteHost(target.hostname) !== host) continue;
        const sources = linkedFrom.get(link) ?? [];
        if (sources.length < 20) sources.push(url);
        linkedFrom.set(link, sources);
        if (seen.has(link)) continue;
        seen.add(link);
        if (!robots.isAllowed(`${target.pathname}${target.search}`)) {
          robotsBlocked++;
          continue;
        }
        queue.push(link);
      }
    }
    pages.push(page);
    opts.onProgress?.(pages.length);
  };

  const inFlight = new Set<Promise<void>>();
  for (;;) {
    while (queue.length > 0 && inFlight.size < concurrency && pages.length + inFlight.size < opts.maxPages && Date.now() < deadline) {
      const url = queue.shift()!;
      const task: Promise<void> = crawlOne(url).finally(() => inFlight.delete(task));
      inFlight.add(task);
    }
    if (inFlight.size === 0) break;
    await Promise.race(inFlight);
  }

  return { pages, linkedFrom, robotsBlocked };
}
