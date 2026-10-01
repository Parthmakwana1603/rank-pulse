# Backend blockers and open decisions

Things the frontend shows that could **not** be implemented honestly without a decision or an
outside service. For each one, the app currently shows an empty state or "—" instead of invented
numbers, and the API contract already has a place for the data.

## 1. SEO data provider (rankings, search volume, traffic, domain authority)

- **Evidence:** Keyword table columns (volume, KD, CPC, rank, change, 30-day trend, SERP feature,
  intent); dashboard traffic/visibility charts; competitor metrics and keyword comparison; gap
  analysis; project traffic/authority; content traffic and score.
- **Why it matters:** These numbers only exist in third-party data (e.g. a SERP/rank-tracking API,
  DataForSEO, Semrush, Ahrefs, Moz) or Google Search Console / Analytics. Scraping Google isn't
  acceptable.
- **Current state:** Keywords, competitors and content are stored for real. Their metric fields
  are returned as `null` / `[]` (`backend/src/services/keywords.service.ts`,
  `competitors.service.ts`, `content.service.ts`, `dashboard.service.ts`) and shown as "—" or an
  empty state. Charts that depend only on this data show "No traffic data connected".
- **Decision needed:** Which provider(s), budget, refresh schedule. Then add a
  `keyword_rankings` snapshot table (keyword_id, checked_at, position, url, serp_feature, volume,
  difficulty, cpc, intent), a scheduled job to fill it, and populate the existing null fields.

## 2. Google Search Console / Analytics / other integrations (OAuth)

- **Evidence:** Settings → Integrations (GSC, GA4, Looker Studio, Slack, Zapier, Ahrefs API);
  Import Project → Google Search Console.
- **Why it matters:** Each needs an OAuth app or API credentials registered by the project owner,
  secure token storage, and a sync job.
- **Current state:** `GET /api/settings/integrations` lists them with `connected: false,
  available: false`; the UI shows "Coming soon". GSC import explains it isn't available; CSV
  import works.
- **Decision needed:** Which integrations are in scope. For each: client ID/secret (backend env
  only), redirect URL, a `integration_connections` table with encrypted tokens.

## 3. AI SEO / GEO metrics

- **Evidence:** AI SEO screen (visibility score, mentions per AI platform, citations,
  recommendations) and the dashboard AI section.
- **Why it matters:** Needs a service that queries AI assistants or sells that data. No provider was
  chosen, so none was invented.
- **Current state:** `/api/ai-seo/*` return empty arrays for projects the caller owns; screens show
  "AI visibility tracking isn't connected". `backend/src/services/ai-seo.service.ts` documents the
  interface a provider should implement.
- **Decision needed:** Provider and its API key (backend env only).

## 4. Core Web Vitals

- **Evidence:** Dashboard "Core Web Vitals" section; the audit's original "Core Web Vitals" check.
- **Why it matters:** Real-user data comes from the Chrome UX Report / PageSpeed Insights API;
  lab measurement needs a headless browser.
- **Current state:** Empty state; the crawler reports slow downloads (>3 s) but not CWV.
- **Decision needed:** Use the PageSpeed Insights API (free with an API key) and on which pages.

## 5. Billing and plans

- **Evidence:** Settings → Billing (price, renewal, Change Plan, Upgrade, invoices).
- **Why it matters:** Needs a payment provider (e.g. Stripe), webhooks and plan limits. None of
  that exists, and prices/limits aren't defined anywhere.
- **Current state:** `/api/settings/billing` returns the plan from `profiles.plan` plus real usage
  counts; price/renewal/invoices are null/empty and the buttons are disabled with an explanation.
  Plan limits are **not enforced**. Users can't change their own plan (database column grants).
- **Decision needed:** Is billing in scope? If yes: provider, prices, limits, webhook endpoint.

## 6. API keys and webhooks for third parties

- **Evidence:** Settings → API Access (masked key, webhook URL, Reveal/Edit/Generate).
- **Why it matters:** Needs a key format, hashed storage, scopes, and an authentication path besides
  Supabase sessions.
- **Current state:** Shows "API keys and webhooks aren't available yet" when connected to the API.
- **Decision needed:** Whether external API access is a product requirement.

## 7. Email / push notification delivery and scheduled reports

- **Evidence:** Notification preferences have Email and Push switches; Reports → Scheduled Reports.
- **Why it matters:** Sending needs an email provider (SMTP/Resend/SES), push credentials, and a
  scheduler.
- **Current state:** Preferences are saved per user. In-app notifications are created for finished
  or failed audits and ready reports, whatever the switches say, because they're the only
  channel. Scheduled reports show "Scheduled delivery isn't available yet"; on-demand reports work.
- **Decision needed:** Email provider; what "push" means (browser push vs in-app); schedule format.

## 8. Date range filter

- **Evidence:** Top bar "Last 30 days" button; report date range.
- **Why it matters:** Only meaningful for time-series data (traffic, rankings), which depends on #1.
- **Current state:** The top-bar button is still a static label. Reports accept 7/30/90 days
  (used for "new backlinks in range" and printed on the report).
- **Decision needed:** Supported ranges and default, once time-series data exists.

## 9. Teams and roles

- **Evidence:** `profiles.role` (owner/member/viewer) exists; no team or invite UI.
- **Current state:** Every account is single-user; all access rules are "your own rows". Roles are
  stored but not used.
- **Decision needed:** Whether teams/shared projects are in scope (affects every RLS policy).

## 10. Smaller notes

- **Global search** (top bar) has no behaviour; decide what it should search.
- **Backlink discovery:** backlinks are recorded manually (or could be imported later); finding
  them automatically needs a provider (#1). Disavow is recorded, but the user still uploads the
  disavow file to Search Console.
- **Background jobs** run in the API process. They're marked failed if the server restarts
  mid-run; move them to a worker queue for production scale.
- **Integrity of your own data:** the API acts with the user's token (no service-role key), so a
  user calling Supabase directly with their token could edit their *own* rows, e.g. an audit's
  health score. Isolation between users is fully enforced. If computed values must be tamper-proof,
  move those writes to a service-role worker and remove the matching update grants.
- **Removed:** the "Add sample projects" button, which copied fake traffic/health numbers into real
  accounts. Demo mode still shows the sample data.
