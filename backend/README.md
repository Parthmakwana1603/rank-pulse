# RankPulse API (backend)

Express 5 + TypeScript REST API for the RankPulse frontend, backed by Supabase (Auth, PostgreSQL,
Storage). Setup for the whole project is in [`../BACKEND_SETUP.md`](../BACKEND_SETUP.md); known gaps
are in [`../BACKEND_BLOCKERS.md`](../BACKEND_BLOCKERS.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-reload (tsx) on `PORT` (default 5000) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server (`dist/server.js`) |
| `npm run typecheck` | TypeScript check of `src/` and `test/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest: HTTP tests, crawler, SQL/RLS tests on PGlite, job tests (live Supabase test is skipped unless configured) |

## How a request flows

```
Authorization: Bearer <Supabase access token>
  → helmet, CORS (CORS_ORIGINS only), JSON body (1 MB), rate limit
  → requireAuth: verify the token with Supabase Auth → req.user, req.db (Supabase client acting as the user)
  → controller: validate params/query/body with zod
  → service: business rules, ownership check (requireProject → 404 if not the caller's project)
  → repository: Supabase queries (row-level security applies to every query)
  → { "success": true, "data": … }   or   { "success": false, "message": "…" } via the error handler
```

The backend needs only the **anon** key: it never bypasses row-level security, so a bug in a
service can't expose another user's data. Ownership is also checked explicitly in services.

## Layout

```
src/
  server.ts, app.ts            entry point, Express app
  config/                      env validation (zod), Supabase clients
  middleware/                  requireAuth, error handler, rate limits, request logger, uploads
  routes/index.ts              every endpoint
  controllers/                 parse input → call service → send envelope
  services/                    business logic
    crawler/                   site-audit crawler (SSRF-safe fetch, robots.txt, checks)
    reports/                   report templates, document builder, PDF/CSV/XLSX rendering
    jobs/job-runner.ts         in-process queue for audits and reports
  repositories/                Supabase queries per table (+ Storage)
  validators/                  zod schemas
  utils/                       HttpError, response helpers, DB-error mapping, logger
test/                          vitest (see npm test)
```

## Endpoints

All paths are under `/api`. Everything except `/health` needs `Authorization: Bearer <token>`.
"(projectId)" means a required `?projectId=<uuid>` query parameter for a project the caller owns.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{ status: "ok" }` |
| GET / PATCH | `/profile` | Current profile / update `name`, `company`, `jobTitle` |
| POST / DELETE | `/profile/avatar` | Upload (multipart `avatar`, ≤2 MB PNG/JPEG/WebP/GIF) / remove profile picture |
| GET / POST | `/projects` | List / create (`websiteUrl`, `name?`, `industry?`, `targetCountry?`, `trackingKeywords[]`) |
| POST | `/projects/import` | CSV import (multipart `file`, ≤1 MB, ≤100 rows) → `{ created, skipped }` |
| GET / PATCH / DELETE | `/projects/:id` | Read / update (`name`, `status: active\|paused`, `industry`, `targetCountry`) / delete |
| GET | `/dashboard/summary` (projectId) | KPIs, keywords, open audit issues, backlink analytics, competitors |
| GET | `/activities` (projectId optional) | Latest 20 activity entries |
| GET | `/notifications` | Latest 20 + `unreadCount` |
| POST | `/notifications/read-all`, `/notifications/:id/read` | Mark read |
| GET | `/keywords`, `/keywords/summary` (projectId) | Tracked keywords / counts |
| POST | `/keywords` | Add (`projectId`, `keywords[]` ≤100, `searchEngine`, `device`) → `{ added, skipped }` |
| DELETE | `/keywords/:id` | Stop tracking |
| POST | `/audit/runs` | Start a crawl (`projectId`, `crawlDepth`, `maxPages`, `userAgent`) → 202 + run |
| GET | `/audit/runs/:id` | Run status: `pending → running (crawling/analyzing) → completed \| failed` |
| GET | `/audit/latest`, `/audit/checks`, `/audit/history` (projectId) | Latest runs / issues of the latest audit / last 7 audits |
| GET / PATCH | `/audit/issues/:id` | Issue with affected pages and fixes / set `status: open\|fixed` |
| GET / POST | `/backlinks` | List (projectId) / add or disavow (`sourceUrl`, `targetPage`, `linkType`, `anchorText`, `domainAuthority?`, `notes?`, `disavow`) |
| GET | `/backlinks/stats`, `/growth`, `/anchor-distribution`, `/follow-nofollow`, `/top-domains` (projectId) | Analytics computed from recorded backlinks |
| DELETE | `/backlinks/:id` | Delete |
| GET / POST | `/competitors` | List incl. own site (projectId) / add (`domain`, `displayName?`, `targetCountry?`, `trackingScope`) |
| GET | `/competitors/keyword-comparison`, `/competitors/gap-analysis` (projectId) | Empty/null until a rank provider exists |
| DELETE | `/competitors/:id` | Delete |
| GET / POST | `/content`, `/content/stats` (projectId) / `/content` | List, stats / create |
| PATCH / DELETE | `/content/:id` | Update / delete |
| GET | `/ai-seo/metrics`, `/trend`, `/mentions-by-platform`, `/recommendations` (projectId) | Empty until an AI-visibility provider exists |
| GET | `/reports/templates` | Report templates |
| GET / POST | `/reports` | List (projectId) / generate (`projectId`, `template`, `format: pdf\|csv\|xlsx`, `dateRangeDays: 7\|30\|90`, `sections[]`) → 202 |
| GET | `/reports/:id`, `/reports/:id/download` | Status / 60-second signed download URL |
| GET / PUT | `/settings/notifications`, `/settings/notifications/:key` | Preferences (`email`, `push`) |
| GET | `/settings/integrations`, `/settings/billing` | Integration catalog (not connectable yet) / plan + real usage |

Errors: `400` validation (message names the field, `details` lists all issues), `401` missing/expired
token, `403` forbidden, `404` not found or not yours, `409` duplicates / audit already running /
report not ready, `413` upload too large, `429` rate limited, `503` Supabase unreachable, `500`
unexpected (details only in server logs).

## Long-running jobs

Site audits and report files run in an in-process queue (`services/jobs/job-runner.ts`, 2 at a
time). Their state lives in the database (`audit_runs.status`, `reports.status`), and the frontend
polls it. A run still pending/running after 20 min (audits) or 10 min (reports), for example after a
restart, is marked failed the next time it's read. To scale out, replace `JobRunner` with a real
queue; the API contract doesn't change.

## Site-audit crawler

- Crawls the project's own host (www-insensitive) breadth-first, up to the chosen page limit
  (≤1,000) and an 8-minute budget, 4 requests at a time, 15 s timeout, 3 MB per page.
- Respects `robots.txt` (RankPulseBot; the "Googlebot" option also honours Googlebot rules).
- **SSRF protection:** only http(s); every connection's DNS answer is checked against
  private/loopback/link-local/reserved ranges at connect time (so DNS rebinding can't slip
  through), and every redirect hop goes through the same check.
- Checks: broken internal links, missing title, HTTPS/mixed content, missing meta description,
  duplicate titles/text, slow pages (>3 s), images without alt, missing structured data, thin
  content (<300 words). Health = % of crawled pages with no error-level issue.
