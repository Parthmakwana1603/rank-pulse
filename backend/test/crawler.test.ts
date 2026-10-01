// Crawls a real local HTTP server (private hosts allowed only for this test file).
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.stubEnv('AUDIT_ALLOW_PRIVATE_HOSTS', 'true');
const { crawlSite } = await import('../src/services/crawler/crawl.js');
const { analyzeCrawl } = await import('../src/services/crawler/checks.js');

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

const pages: Record<string, { status?: number; html?: string; delayMs?: number; location?: string }> = {
  '/robots.txt': { html: 'User-agent: *\nDisallow: /private\n' },
  '/': {
    html: `<html><head><title>Home</title><meta name="description" content="Welcome">
      <script type="application/ld+json">{"@type":"WebSite"}</script></head>
      <body><p>${words(400)}</p><img src="/logo.png" alt="Logo"><img src="/x.png">
      <a href="/about">About</a> <a href="/missing">Missing</a> <a href="/private/secret">Secret</a>
      <a href="/old">Old</a> <a href="https://elsewhere.example/">External</a> <a href="mailto:a@b.c">Mail</a></body></html>`,
  },
  '/about': { html: `<html><head><title>Home</title></head><body><p>${words(20)}</p><a href="/">Home</a></body></html>` },
  '/old': { status: 301, location: '/about' },
  '/missing': { status: 404, html: 'Not found' },
  '/private/secret': { html: '<title>secret</title>' },
};

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    const page = pages[req.url ?? '/'];
    if (!page) {
      res.writeHead(404).end();
      return;
    }
    if (page.location) {
      res.writeHead(page.status ?? 302, { location: page.location }).end();
      return;
    }
    res.writeHead(page.status ?? 200, { 'content-type': req.url === '/robots.txt' ? 'text/plain' : 'text/html; charset=utf-8' });
    res.end(page.html ?? '');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  // Use "localhost.localdomain"-style host so it has a dot? Not needed for the crawler, only for project URLs.
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe('crawlSite + analyzeCrawl', () => {
  it('crawls internal pages, respects robots.txt and finds issues', async () => {
    const progress: number[] = [];
    const result = await crawlSite({ startUrl: base, maxPages: 50, agent: 'desktop', onProgress: (n) => progress.push(n) });

    const urls = result.pages.map((p) => new URL(p.url).pathname).sort();
    expect(urls).toEqual(['/', '/about', '/missing', '/old']);
    expect(result.robotsBlocked).toBe(1);
    expect(progress.at(-1)).toBe(4);

    const outcome = analyzeCrawl(result);
    const byKey = Object.fromEntries(outcome.issues.map((i) => [i.checkKey, i]));

    expect(byKey.broken_links).toMatchObject({ type: 'error', occurrences: 1 });
    expect(byKey.broken_links.pages[0]).toMatchObject({ url: `${base}/missing`, statusCode: 404 });
    expect(byKey.https_issues.pages.map((p) => p.detail)).toEqual(['Served over HTTP', 'Served over HTTP']);
    expect(byKey.missing_description.pages.map((p) => new URL(p.url).pathname)).toEqual(['/about']);
    expect(byKey.duplicate_content.occurrences).toBe(2); // both pages are titled "Home"
    expect(byKey.missing_alt_text).toMatchObject({ occurrences: 1 });
    expect(byKey.missing_structured_data.pages.map((p) => new URL(p.url).pathname)).toEqual(['/about']);
    expect(byKey.thin_content.pages.map((p) => new URL(p.url).pathname)).toEqual(['/about']);
    expect(byKey.missing_title).toBeUndefined();
    // The redirect (/old → /about) is recorded but its content is only analysed once, at /about.
    expect(outcome.pagesCrawled).toBe(4);
    // "/", "/about" (served over HTTP) and "/missing" (broken) have errors; the redirect doesn't.
    expect(outcome.healthScore).toBe(25);
    expect(outcome.errors).toBe(byKey.broken_links.occurrences + byKey.https_issues.occurrences);
  });

  it('stops at maxPages', async () => {
    const result = await crawlSite({ startUrl: base, maxPages: 2, agent: 'mobile' });
    expect(result.pages).toHaveLength(2);
  });
});
