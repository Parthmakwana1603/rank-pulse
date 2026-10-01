# CONTEXT.md — RankPulse frontend, for backend integration

> **Update (2026-09-30, branch `backend-integration`):** this analysis describes the frontend *before*
> the Express backend was added. Most blockers listed here are now resolved: bearer-token auth,
> project scoping, ids instead of names, empty states, the error envelope, and raw API values mapped in
> `src/lib/api/mappers.ts`. For the current architecture and setup, read
> [`BACKEND_SETUP.md`](BACKEND_SETUP.md) and [`backend/README.md`](backend/README.md). What remains
> open is in [`BACKEND_BLOCKERS.md`](BACKEND_BLOCKERS.md).

> **Audience:** a developer (human or AI) about to connect a backend to this frontend.
> **Snapshot:** written from the source at commit `3c8674e` ("Add Supabase backend for accounts and projects"), 2026-09-30.
> **Convention used throughout:**
> - **[Observed]**: read directly from the code, with the file named.
> - **[Inferred]**: a requirement deduced from what the UI shows or does. It is not implemented anywhere yet.
> - **Unknown / Needs Verification**: can't be decided from the frontend. These are collected in §25.
>
> Other docs in the repo: `BACKEND_SPECIFICATION.md` (a 4,400-line *proposal* for a REST API and database; most of it is **not** implemented), `PROJECT_CONTEXT.md` and `.agents/PROJECT_CONTEXT.md` (older overviews; parts are out of date. For example, they describe auth as mock-only and routing as state-based). `supabase/README.md` covers Supabase setup. **Where those docs and the code disagree, the code wins, and this file follows the code.**

---

## 0. TL;DR

- **SPA:** React 18 + TypeScript + Vite 5 + Tailwind/shadcn. The URL is read with react-router 7, but there's no `<Routes>` tree. Server state goes through TanStack Query v5.
- **A data layer already exists, and every screen goes through it.** Screens call hooks in `src/lib/api/queries.ts`. The hooks call `apiGet(path)` in `src/lib/api/client.ts`, which resolves each path in order from:
  1. **Supabase**, if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set *and* the path is registered in `supabaseRoutes` (today that's only `/projects`)
  2. **A REST API** at `VITE_API_URL`, if set
  3. **Built-in mock data** (`src/lib/api/mock.ts` → `src/lib/seo-data.ts`)
- **Real today:** sign-up, sign-in, sign-out and session restore (Supabase Auth); the `profiles` row (name and plan are read); projects list/create/delete (Supabase tables + RLS + `create_project` RPC).
- **Mock or non-functional today:** everything else. That covers keywords, audits, backlinks, competitors, content, AI SEO, reports, notifications, activities, settings, billing and integrations. **Every form except New Project and Login is visual only**: its submit button just closes the modal.
- **Biggest blockers:** (1) no query sends a **project id**, so the top-bar project selector changes nothing; (2) the date-range picker isn't wired to anything; (3) the REST client sends **no auth token**; (4) list/detail views identify rows by **display name, not id**; (5) API payloads are shaped for display (pre-formatted strings such as `"248.5K"`, relative times, even chart colour tokens).

---

## 1. Project overview

| Aspect | Value | Source |
|---|---|---|
| Framework | React `^18.3.1` (StrictMode) | `package.json`, `src/main.tsx` |
| Build tool | Vite `^5.4.8` with `@vitejs/plugin-react`; alias `@` → `./src` | `vite.config.ts` |
| Language | TypeScript `^5.5.3` | `tsconfig*.json` |
| Routing | `react-router-dom` `^7.18.4`: `BrowserRouter` plus `useLocation`/`useNavigate`/`<Navigate>` only | `src/main.tsx`, `src/components/dashboard/dashboard.tsx` |
| Server state | `@tanstack/react-query` `^5.104.0` | `src/lib/api/query-client.ts`, `src/lib/api/queries.ts` |
| Global client state | React Context: `AuthProvider`, `ThemeProvider`, `ModalProvider` | see §14 |
| Styling | Tailwind CSS 3.4, `tailwindcss-animate`, CSS variables for theme tokens (`src/index.css`), `clsx` + `tailwind-merge` via `cn()` | `tailwind.config.js`, `src/lib/utils.ts` |
| Component library | shadcn/ui (Radix primitives) in `src/components/ui/` (47 files). **In use:** `card` (19 imports), `skeleton` (7), `dialog` (2). The rest are scaffolding. | `components.json`, grep of imports |
| Icons | `lucide-react` | everywhere |
| Charts | `recharts` 2.12 (Area, Bar, Line, Pie) | dashboard sections and screens |
| Forms | **Plain `useState` + native inputs.** `react-hook-form`, `zod` and `@hookform/resolvers` are installed, and `src/components/ui/form.tsx` exists, but **no screen uses them**. | grep |
| Validation | Hand-written functions: `validate()` in `src/lib/auth-context.tsx`, `validateNewProject()` in `src/lib/api/projects.ts`, `getMissingFields()` in `src/lib/schema.ts` | — |
| API client | `fetch` wrapper `httpRequest()` in `src/lib/api/http.ts`; Supabase JS client in `src/lib/supabase.ts` | — |
| Auth library | `@supabase/supabase-js` `^2.58.0` (Supabase Auth, email + password) | `src/lib/auth-context.tsx` |
| Database | Supabase Postgres. Migration: `supabase/migrations/20260929000000_auth_and_projects.sql` | — |
| Dates | `date-fns` (only `formatDistanceToNowStrict` in `projects.ts`) | — |
| Toasts | `sonner` and shadcn `toast`/`use-toast` are installed, **but no `<Toaster>` is mounted**, so no toasts are shown anywhere | grep |
| Testing | `vitest` `^3.2.7`: `src/lib/api/api.test.ts`, `src/lib/api/projects.test.ts`, `src/lib/schema.test.ts`, `src/lib/api/supabase.integration.test.ts` (skipped unless Supabase env vars are set); SQL RLS tests in `supabase/tests/` | — |
| Third-party integrations in code | Supabase only. Google Search Console, GA4, Looker Studio, Slack, Zapier and the Ahrefs API appear **only as mock rows** (`integrations` in `seo-data.ts`) | — |
| Origin | Bolt.new template `vite-shadcn` (`.bolt/config.json`) | — |

Scripts (`package.json`): `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `typecheck`, `test` (`vitest run`).

---

## 2. Project structure

```
rank-pulse/
├── index.html                      # Entry HTML. Inline script applies saved theme (localStorage 'rankpulse-theme') before React mounts
├── .env.example                    # Names of the 3 env vars (see §12)
├── supabase/
│   ├── README.md                   # How to create a Supabase project and connect it
│   ├── migrations/20260929000000_auth_and_projects.sql   # profiles, projects, project_keywords, RLS, create_project()
│   └── tests/{auth_stub.sql, rls_test.sql}              # 25 SQL checks of the RLS rules
├── BACKEND_SPECIFICATION.md        # Proposed full REST/DB design (mostly NOT implemented)
└── src/
    ├── main.tsx                    # ENTRY: QueryClientProvider → BrowserRouter → <App/>
    ├── App.tsx                     # ThemeProvider → AuthProvider → (user ? ModalProvider+Dashboard : LoginScreen)
    ├── lib/
    │   ├── api/                    # ★ DATA LAYER: the integration point
    │   │   ├── queries.ts          # One React Query hook per GET path + "screen hooks" + mutations
    │   │   ├── client.ts           # apiGet(path): Supabase → REST → mock resolution
    │   │   ├── http.ts             # httpRequest(): fetch wrapper, unwraps {success,data,message}
    │   │   ├── projects.ts         # Projects: validation, Supabase GET/POST/DELETE, row→UI mapping, error mapping
    │   │   ├── mock.ts             # mockRoutes: path → mock payload
    │   │   ├── errors.ts           # ApiError(message, status?)
    │   │   └── query-client.ts     # QueryClient defaults
    │   ├── auth-context.tsx        # ★ AuthProvider/useAuth: demo vs Supabase auth
    │   ├── supabase.ts             # Supabase client, or null (demo mode)
    │   ├── seo-data.ts             # ★ ALL mock data + the TypeScript types screens use
    │   ├── routes.ts               # Page label ↔ URL path table
    │   ├── schema.ts               # Pure JSON-LD builder for Schema Generator (no backend)
    │   └── utils.ts                # cn, matchesQuery, initialsOf, parse/formatCompactNumber
    ├── hooks/use-toast.ts          # shadcn toast store (unused)
    └── components/
        ├── theme-provider.tsx      # Dark/light theme context, persisted to localStorage
        ├── ui/                     # shadcn primitives (shared, mostly unused)
        └── dashboard/
            ├── dashboard.tsx       # ★ Layout + page switch (Sidebar, Topbar, renderPage) + DashboardHome
            ├── login-screen.tsx    # Sign in / sign up form
            ├── sidebar.tsx, topbar.tsx
            ├── query-fallback.tsx  # Shared loading/error view for queries (skeleton + "Try again")
            ├── dashboard-skeleton.tsx, page-skeleton.tsx
            ├── page-header.tsx, section-header.tsx, table-filter.tsx, kpi-card.tsx   # shared presentational
            ├── hero-section.tsx, quick-actions.tsx, charts-section.tsx, keyword-section.tsx,
            │   site-audit-section.tsx, backlink-section.tsx, competitor-section.tsx,
            │   ai-seo-section.tsx, core-web-vitals-section.tsx, recent-activities-section.tsx   # Dashboard home widgets
            ├── pages/              # One screen per route (see §3/§4)
            └── modals/
                ├── modal-provider.tsx   # useModal(): open(name, payload) / close()
                ├── modal-shell.tsx      # Dialog wrapper + shared form controls (TextInput, SelectInput, …)
                └── *-modal.tsx          # 13 modals (see §4, §7)
```

| Directory | Responsibility | Entry points | Shared/reusable |
|---|---|---|---|
| `src/lib/api/` | All data access. **Put backend integration here; screens shouldn't need to change.** | `queries.ts` (what components import) | `ApiError`, `httpRequest`, `combine()` |
| `src/lib/` | Auth, mock data + types, routing table, pure helpers | `auth-context.tsx` | `utils.ts`, `seo-data.ts` types |
| `src/components/dashboard/pages/` | Full screens | one per route | — |
| `src/components/dashboard/modals/` | Dialog forms and detail views | `modal-provider.tsx` | `modal-shell.tsx` controls |
| `src/components/dashboard/` (root) | Layout shell and dashboard widgets | `dashboard.tsx` | `QueryFallback`, `PageHeader`, `SectionHeader`, `TableFilter`/`NoMatchesRow`, `KpiCard` |
| `src/components/ui/` | shadcn primitives | — | `Card`, `Skeleton`, `Dialog` |
| `supabase/` | Database schema, RLS, SQL tests | migration file | — |

---

## 3. Routing

**[Observed]** There is no route configuration. The mechanism:

1. `src/main.tsx` wraps the app in `<BrowserRouter>`.
2. `src/App.tsx` → `AppContent`: while `initializing` it renders an empty `div`. If there's no `user` it renders `<LoginScreen/>` **at whatever URL is current**. Otherwise it renders `<ModalProvider><Dashboard/></ModalProvider>`.
3. `src/components/dashboard/dashboard.tsx` → `Dashboard`: `pageForPath(location.pathname)` (`src/lib/routes.ts`) maps the path to a page label. Unknown paths get `<Navigate to="/" replace />`. `renderPage()` switches on the label.
4. Navigation: `Sidebar` and the `Topbar` user menu call `handleNavigate(label)` → `navigate(pathForPage(label))`. Trailing slashes are stripped when matching.
5. Side effects on page change: `window.scrollTo(0,0)` and `document.title` updates.

**Guards [Observed]:** the only guard is the `user ? … : <LoginScreen/>` switch in `App.tsx`. Every route requires auth. There is no `/login` URL, no redirect-after-login (the user stays on the URL they opened), and no role-based guard. On logout the URL stays the same and the login form replaces the dashboard.

**Layout:** one layout (`Dashboard`: fixed `Sidebar` + sticky `Topbar` + `<main>`). The login screen has no layout.

**Route parameters:** none. There are no `/:id` detail routes. Detail views are **modals** that receive a string payload (see §4).

| Route | Purpose | Auth required | Main components | Backend data needed |
|---|---|---|---|---|
| *(any URL, signed out)* | Sign in / sign up | No | `LoginScreen` | Supabase Auth (implemented) |
| `/` | Dashboard overview | Yes | `DashboardHome` → `HeroSection`, `KpiCard`, `QuickActions`, `ChartsSection`, `KeywordSection`, `SiteAuditSection`, `BacklinkSection`, `CompetitorSection`, `AiSeoSection`, `CoreWebVitalsSection`, `RecentActivitiesSection` | `/dashboard/summary`, `/activities`, `/projects` |
| `/schema-generator` | JSON-LD builder | Yes | `SchemaGeneratorScreen` | **None** (pure client-side, `src/lib/schema.ts`) |
| `/projects` | Project portfolio | Yes | `ProjectsScreen`, modals `new-project`, `import-project`, `project-detail` | `/projects` (Supabase), create/delete/sample |
| `/keywords` | Rank tracking | Yes | `KeywordRankingsScreen`, modals `keyword-detail`, `export-pdf` | `/keywords`, `/keywords/summary` |
| `/site-audit` | Technical audit | Yes | `SiteAuditScreen`, modals `run-audit`, `audit-issue`, `export-pdf` | `/audit/checks`, `/audit/history` |
| `/backlinks` | Link profile | Yes | `BacklinksScreen`, modals `add-backlink`, `export-pdf` | `/backlinks`, `/backlinks/stats`, `/backlinks/growth`, `/backlinks/anchor-distribution`, `/backlinks/follow-nofollow`, `/backlinks/top-domains` |
| `/competitors` | Benchmarking | Yes | `CompetitorsScreen`, modals `add-competitor`, `export-pdf` | `/competitors`, `/competitors/keyword-comparison`, `/competitors/gap-analysis` |
| `/content` | Content library | Yes | `ContentScreen`, modals `new-content`, `content-detail` | `/content`, `/content/stats` |
| `/ai-seo` | AI/GEO visibility | Yes | `AiSeoScreen`, modal `export-pdf` | `/ai-seo/metrics`, `/ai-seo/trend`, `/ai-seo/mentions-by-platform`, `/ai-seo/recommendations` |
| `/reports` | Reports | Yes | `ReportsScreen`, modal `generate-report` | `/reports`, `/reports/templates` |
| `/settings` | Account settings | Yes | `SettingsScreen` → `SettingsView` | `useAuth().user`, `/settings/notifications`, `/settings/integrations`, `/settings/billing` |
| *(any other path)* | — | — | `<Navigate to="/" replace/>` | — |

The paths in the last column are the strings the frontend **already calls** (`src/lib/api/queries.ts`). No REST server implements them. They're served by mock data, except `/projects` in Supabase mode.

**Deployment note [Inferred]:** `BrowserRouter` needs the host to rewrite all paths to `index.html`. The repo has no such config (no `vercel.json`, `netlify.toml` or `public/`). → §25.

---

## 4. Pages and features

Shared behaviour on every data screen **[Observed]**: the screen calls a screen hook such as `useKeywordRankingsData()`. When `!query.data` it returns `<QueryFallback query={…}/>`, which shows a skeleton after 150 ms and, on error, the message plus a "Try again" button. Once data exists, the screen renders it all at once. No screen has partial loading.

### 4.1 Login (`src/components/dashboard/login-screen.tsx`)
- **Purpose:** sign in or create an account. The `mode` state toggles between `signin` and `signup`.
- **Actions:** submit, toggle mode, show/hide password, toggle theme.
- **Demo mode** (no Supabase env): fields are prefilled with `jamie@acme.com` / `rankpulse`, and a "Demo mode" note is shown.
- **Loading:** the button shows a `Loader2` spinner and is disabled. **Error:** a red `role="alert"` box with `result.error`. **Success:** `AuthProvider` sets `user` and the dashboard renders. **Sign-up with email confirmation on:** a green `role="status"` notice ("Check your inbox…"), switches to sign-in mode and clears the password.
- **Not present:** forgot/reset password, OAuth/social login, "remember me", terms checkbox.

### 4.2 Dashboard home (`dashboard.tsx` → `DashboardHome`)
- **Data:** `useDashboardData()` = `combine({ summary: /dashboard/summary, activities: /activities, projects: /projects })`.
- **Widgets and their props** (all typed via `DashboardSummary` in `queries.ts`): `kpis` → `KpiCard` ×8; `trafficTrend`, `keywordDistribution`, `trafficSources`, `countryTraffic`, `deviceBreakdown`, `monthlyGrowth`, `topLandingPages` → `ChartsSection`; `keywordTable` → `KeywordSection`; `auditIssues` → `SiteAuditSection`; `backlinkStats`, `anchorTextDistribution`, `followNofollow`, `topReferringDomains` → `BacklinkSection`; `competitors` → `CompetitorSection`; `aiSeoMetrics` → `AiSeoSection`; `coreWebVitals` → `CoreWebVitalsSection`; `activities` → `RecentActivitiesSection`.
- `HeroSection` shows `projects[0]?.name ?? 'Your project'` and the user's first name.
- **Hard-coded text [Observed]:** `hero-section.tsx` "Last updated 2 minutes ago · Tracking 18,420 keywords across 4,820 pages"; footer "Demo data for illustration".
- **Dead buttons:** Hero "Refresh Data" (no handler); `KeywordSection` "Sort" (no handler).
- **Actions:** Hero "Export Report" → `export-pdf` modal. `QuickActions` (labels from `seo-data.quickActions`) maps to modals `run-audit`, `add-keyword`, `generate-report`, `add-competitor` and `export-pdf`.
- **Empty states:** none. Empty arrays just render empty cards.
- **Assumption:** the dashboard shows data for "the project", but no project id is sent (§25-U1).

### 4.3 Projects (`pages/projects-screen.tsx`) (**the only screen with a real backend**)
- **Data:** `useProjects()` → `/projects`.
- **Derived:** `summarize()` computes Total Projects, Active count, Total Traffic (parses `"248.5K"` strings with `parseCompactNumber` and sums them) and Avg. Health (over projects with `health > 0`).
- **Cards:** favicon letter, name, status badge (`active`/`paused`/`warning` → "Needs Attention"), traffic sparkline (`trend[]`, or "No traffic data yet" if it has fewer than 2 points), traffic, keywords, health, "Last audit {lastAudit}", "DA {authority}".
- **Actions:** "Import" → `import-project`; "New Project" → `new-project`; card click → `project-detail` with payload `p.id ?? p.name`; the "…" button has **no handler** (the click bubbles up to the card).
- **Empty state:** a "No projects yet" card with "New Project". In Supabase mode it also offers "Add sample projects" (`useAddSampleProjects`), with spinner and inline error.
- **Error/loading:** `QueryFallback`.

### 4.4 Project detail modal (`modals/project-detail-modal.tsx`)
- Finds the project in the cached `/projects` list: `p.id === payload || (!p.id && p.name === payload)`. If it's missing: "This project no longer exists."
- Shows the trend chart (or a placeholder), four stats and a trend sentence.
- **Delete:** two-click confirm ("Click again to delete") → `useDeleteProject().mutate(project)` → closes on success; inline error on failure.
- "View Full Report" just closes (**no behaviour**).

### 4.5 Keyword Rankings (`pages/keyword-rankings-screen.tsx`)
- **Data:** `useKeywordRankingsData()` = `/keywords` + `/keywords/summary`.
- **Summary cards:** `keywordSummary[]` `{label, value (string), change (number %)}`.
- **Table:** keyword, intent badge, volume, KD (difficulty colour bands ≥70 / ≥45), CPC (string), rank (colour bands ≤3 / ≤10 / ≤20), change = `previousRank - rank`, 30-day sparkline (`trend30[]`), SERP feature, URL.
- **Filter:** the "Filter" button toggles `TableFilter`. It's a client-side substring match (`matchesQuery`) over keyword, intent, serp and url, and shows "N of M" plus `NoMatchesRow` when nothing matches.
- **Sort:** button present, **no handler**.
- **Export:** opens `export-pdf` (simulated).
- **Row click:** `keyword-detail` modal with payload = **keyword text**.
- There's **no "Add Keyword" button on this screen**. `add-keyword` is only reachable from Quick Actions.

### 4.6 Keyword detail modal (`modals/keyword-detail-modal.tsx`)
- Reads the cached `/keywords` list and finds by `k.keyword === payload`, **falling back to `keywordFullTable[0]`** (so it would crash on an empty list).
- Shows volume, difficulty, CPC, intent, a 30-point rank chart (`trend30`), ranking URL and SERP feature. The "Open" link is `href="#"`.

### 4.7 Site Audit (`pages/site-audit-screen.tsx`)
- **Data:** `useSiteAuditData()` = `/audit/checks` + `/audit/history`.
- **Derived:** totals of `count` per `type` (error/warning/notice).
- **Hard-coded:** the "Site Health 94%" card and "+1.8% from last audit".
- **Audit History chart:** `auditHistory[]` `{date, errors, warnings, notices}`.
- **Three columns of checks:** click opens `audit-issue` with payload = **check title**.
- "Re-run Audit" → `run-audit` modal; "Export" → `export-pdf`.

### 4.8 Run audit modal (`modals/run-audit-modal.tsx`)
- **Fully simulated.** On open, a timer advances 4 phases every 800 ms ("Configuring" → "Crawling pages" → "Analyzing issues" → "Complete") and then shows the hard-coded "94% site health · 23 errors · 87 warnings · 88 notices".
- The form fields are uncontrolled and never read. Both buttons just close.

### 4.9 Audit issue modal (`modals/audit-issue-modal.tsx`)
- Finds the check by title in the cached `/audit/checks` (falls back to `[0]`).
- **Hard-coded:** `mockPages` (affected URLs with HTTP status/severity) and `fixes` (4 generic steps).
- "Mark as Fixed" just closes.

### 4.10 Backlinks (`pages/backlinks-screen.tsx`)
- **Data:** `useBacklinksData()` combines 6 paths (see the §3 table).
- **Widgets:** stats cards; "New vs Lost" bar chart; follow/nofollow pie; anchor text distribution; top referring domains; the "All Backlinks" table.
- **Filter:** client-side over source, target, anchor and type.
- **Actions:** "Add Backlink" → `add-backlink`; "Export" → `export-pdf`. Rows are not clickable. There's no delete or disavow per row.

### 4.11 Competitors (`pages/competitors-screen.tsx`)
- **Data:** `useCompetitorsData()` = `/competitors`, `/competitors/keyword-comparison`, `/competitors/gap-analysis`.
- **Cards:** one per competitor (`isYou` highlights your own site). The grid is `grid-cols-4` with `min-w-[760px]`, so it's designed for exactly 4.
- **Keyword chart:** the `Bar` series are **hard-coded** to data keys `you`, `compA`, `compB`, `compC`, with legend names "You" and "Competitor A/B/C". It can't show a variable number of competitors or their real names.
- **Gap analysis:** `{unique, shared, missed}` numbers.
- **Actions:** "Add Competitor" → modal; "Export" → `export-pdf`. There's no remove or edit.

### 4.12 Content (`pages/content-screen.tsx`)
- **Data:** `useContentData()` = `/content` + `/content/stats`.
- **Table:** title + url, type badge, traffic, keywords, score (or "—" when 0), status badge, updated (relative string), "…" button (**no handler**).
- **Filter:** client-side over title, url, type and status.
- **Row click:** `content-detail` with payload = **title**.
- "New Content" → `new-content`.

### 4.13 Content detail modal (`modals/content-detail-modal.tsx`)
- Finds by title in the cached `/content` (falls back to `[0]`).
- **Hard-coded:** `tips` (4 generic tips). The URL link is `href="#"`.
- "Edit Content" just closes.

### 4.14 AI SEO (`pages/ai-seo-screen.tsx`)
- **Data:** `useAiSeoData()` combines 4 paths.
- **Top 4 metric cards** = `aiSeoFullMetrics.slice(0,4)`. Icons are looked up **by label string** (`iconMap`).
- **Heuristic [Observed]:** `isCount = m.value > 100` decides whether a metric is a count (the progress bar becomes `value/target`) or a 0–100 score.
- **Charts:** trend (weekly `visibility` + `mentions`), mentions by platform, all metrics with progress bars, recommendations (`impact` High/Medium/Low).
- The only action is "Export Report" → `export-pdf`.

### 4.15 Reports (`pages/reports-screen.tsx`)
- **Data:** `useReportsData()` = `/reports` + `/reports/templates`.
- **Recent reports:** name, date, size (hidden when `'—'`), status badge (Ready / Generating with a spinning icon / Scheduled). The download button appears only for `Ready` and has **no handler**.
- **Templates:** buttons with **no handler**.
- **"Scheduled Reports":** **hard-coded inline array** in the component (3 rows with recipients `team@acme.com`, …). It's not fetched.
- "New Report" → `generate-report`.

### 4.16 Generate report modal / Export PDF modal
- `generate-report-modal.tsx`: loads templates (`useReportTemplates`); template selection is local state. Date range (7/30/90/custom), format (pdf/csv/xlsx) and section checkboxes are uncontrolled. "Generate Report" closes. **Nothing is sent.**
- `export-pdf-modal.tsx`: shows "preparing" for 1.5 s, then "ready". The section list is hard-coded. "Download PDF" closes and **nothing downloads**.

### 4.17 Settings (`pages/settings-screen.tsx`)
- **Data:** `useSettingsData()` = `/settings/notifications`, `/settings/integrations`, `/settings/billing`, plus `useAuth().user`.
- **Section nav:** from `seo-data.settingsSections` (static UI config).
- **Profile:** uncontrolled inputs (`defaultValue`) for Full Name (`user.name`), Email (`user.email`), Company (**hard-coded "Acme Corporation"**) and Role (**hard-coded "SEO Manager"**). "Change Avatar", "Cancel" and "Save Changes" have **no handlers**.
- **Notifications:** email/push toggles update **local state only** (`notifState`). They aren't persisted.
- **Integrations:** a "Connected" badge or a "Connect" button (**no handler**).
- **Billing:** plan card from `/settings/billing`. "Change Plan" and "Upgrade" have **no handlers**. The "Billing History" dates are a hard-coded inline array.
- **Appearance:** light/dark toggle → `ThemeProvider` (localStorage; client-only, fine as is).
- **API Access:** masked key `sk-prod-••••3f2a` and webhook URL are **hard-coded**. "Reveal", "Edit" and "Generate New Key" have **no handlers**.

### 4.18 Schema Generator (`pages/schema-generator-screen.tsx`, `src/lib/schema.ts`)
- **Entirely client-side. Needs no backend.** Form state is `SchemaForm` (≈45 fields; `initialSchemaForm` is sample data). `buildSchema()` builds the JSON-LD; `getMissingFields()` lists required fields per entity type.
- Copy (`navigator.clipboard`) and Download (`Blob` → `schema.json`).
- **Possible future need [Inferred, optional]:** saving generated schemas per project. Nothing in the UI suggests it.

### 4.19 Top bar (`topbar.tsx`), on every page
- **Project selector:** lists `/projects`; the selection is **local `useState` (`selectedName`) and isn't passed to any query**. It shows `'…'`/"Loading…", `'!'`/"Projects unavailable" or `'+'`/"No projects".
- **Global search input:** **no handler**.
- **"Last 30 days" date button:** **no handler**.
- **Notifications bell:** lists `/notifications`. The red dot is **always shown**. There's no read/unread state and no "mark as read".
- **User menu:** shows `user.initials/name/plan/email` (falls back to 'JD'/'Jamie Doe'/'Pro Plan'/'jamie@acme.com'). "Profile" and "Settings" both navigate to `/settings`. "Log out" calls `logout()`.

---

## 5. Data flow

### 5.1 Reads (all screens)
```
Screen component
 → screen hook, e.g. useBacklinksData()                    (src/lib/api/queries.ts)
   → combine({...})  merges N useQuery results: data only when all are ready, first error wins,
                     refetch() retries only the failed or empty ones
     → useApi<T>(path) = useQuery({ queryKey: [path], queryFn: apiGet(path, signal) })
       → apiGet(path)                                         (src/lib/api/client.ts)
           if supabase && supabaseRoutes[path] → Supabase query   (src/lib/api/projects.ts)
           else if VITE_API_URL                → httpRequest('GET', path)   (src/lib/api/http.ts)
           else                                → structuredClone(mockRoutes[path]())  (src/lib/api/mock.ts)
 → if !data → <QueryFallback> (skeleton after 150 ms / error card with "Try again")
 → else render; derived values (totals, filters, change = previousRank − rank) computed in the component
```
Query keys are just `[path]`. There are **no parameters** (no project, date range, page, sort or filter).

### 5.2 Writes (only projects are wired)
```
NewProjectModal submit
 → validateNewProject(form)                      (projects.ts)   errors → inline FieldError per field
 → useCreateProject().mutate(input)              (queries.ts)
   → createProject(input):
       Supabase: supabase.rpc('create_project', {p_name, p_website_url, p_industry, p_target_country, p_tracking_keywords})
       REST:     POST {VITE_API_URL}/projects  body = NewProjectInput
       Demo:     push into seo.projectList (in-memory, lost on reload)
   → onSuccess: invalidateQueries(['/projects']) → Projects screen, Topbar, Dashboard hero refresh
 → modal closes on success; on error shows createProject.error.message
```
Delete works the same way (`deleteProject`: Supabase `.delete().eq('id')` / REST `DELETE /projects/:idOrName` / demo splice). `addSampleProjects` (Supabase only) inserts the demo projects that aren't already present.

### 5.3 Auth
```
LoginScreen submit → useAuth().login/signUp (auth-context.tsx)
  → validate() → supabase.auth.signInWithPassword / signUp  (or set demo user)
  → onAuthStateChange(INITIAL_SESSION | SIGNED_IN …) → setTimeout → loadSupabaseUser() reads profiles(name, plan)
  → setUser(AuthUser) → App renders Dashboard
Logout → supabase.auth.signOut() → setUser(null) → queryClient.clear()
```

### 5.4 State inventory
| Kind | Where |
|---|---|
| Global context | `AuthProvider` (user, initializing, mode, login/signUp/logout), `ThemeProvider` (theme), `ModalProvider` (active modal + payload) |
| Server state (React Query) | Every `useApi` path; mutations in `queries.ts` |
| Local UI state | Sidebar open/mobile (`Dashboard`); filter open/query per table screen; topbar dropdowns and `selectedName`; login form; New Project form and errors; settings `activeSection` and `notifState`; modal-internal selections, timers and confirm flags; Schema Generator form |
| Props | Dashboard widgets get slices of `DashboardSummary`; `SettingsView` gets its three datasets; modals get `onClose` + a string payload |
| Mock/static | `src/lib/seo-data.ts` (via `mock.ts`) plus inline constants in components (§6.2) |
| Derived | Projects `summarize()`; Site Audit totals; rank `change`; AI `isCount`/`pct`; `trendUp`; hero `firstName`; `initialsOf(name)` |
| Persistent (browser) | `localStorage['rankpulse-theme']` (theme); Supabase session (the Supabase JS default storage, localStorage). Nothing else. |

---

## 6. Mock / static data

### 6.1 `src/lib/seo-data.ts` (served through `src/lib/api/mock.ts`)

"Replace?" means whether it should eventually come from the backend. Entity names are **possible** entities, not decided ones.

| Export | Type (fields) | Represents | Consumed by (path → component) | Possible entity | Replace? |
|---|---|---|---|---|---|
| `kpis` | `Kpi {id, label, value: string, change: number, trend: number[], accent}` | 8 headline KPIs | `/dashboard/summary` → `KpiCard` | derived metrics per project (time series) | Yes (keep `accent` client-side) |
| `trafficTrend` | `{month, organic, direct, referral, social}[]` | Monthly traffic by channel | summary → `ChartsSection` | traffic data (time series) | Yes |
| `keywordDistribution` | `{name, value, fill}[]` | Keyword count per rank bucket | summary → `ChartsSection` | aggregate of keyword rankings | Yes (drop `fill`) |
| `trafficSources` | `{name, value (%), fill}[]` | Channel share | summary → `ChartsSection` | traffic source aggregate | Yes |
| `countryTraffic` | `{country, code, traffic (%), visits: string}[]` | Traffic by country | summary → `ChartsSection` | traffic by country | Yes |
| `deviceBreakdown` | `{name, value (%), fill}[]` | Device share | summary → `ChartsSection` | traffic by device | Yes |
| `monthlyGrowth` | `{month, traffic, keywords, backlinks}[]` (% growth) | Growth rates | summary → `ChartsSection` | derived | Yes |
| `topLandingPages` | `{page, traffic, change, keywords}[]` | Top pages | summary → `ChartsSection` | page-level traffic | Yes |
| `keywordTable` | `KeywordRow {keyword, volume, difficulty, cpc: string, rank, previousRank, url}` | Top keywords (dashboard) | summary → `KeywordSection` | tracked keyword + latest ranking | Yes |
| `auditIssues` | `AuditIssue {type, title, count}` | Issue summary (dashboard) | summary → `SiteAuditSection` | audit issue aggregate | Yes |
| `backlinkStats` | `{label, value: string, change}[]` | Backlink KPIs | summary + `/backlinks/stats` | derived | Yes |
| `anchorTextDistribution` | `{name, value (%), fill}[]` | Anchor text mix | summary + `/backlinks/anchor-distribution` | backlink aggregate | Yes |
| `followNofollow` | `{name, value (%), fill}[]` | Link type mix | summary + `/backlinks/follow-nofollow` | backlink aggregate | Yes |
| `topReferringDomains` | `{domain, authority, backlinks, change}[]` | Top domains | summary + `/backlinks/top-domains` | referring domain | Yes |
| `competitors` | `Competitor {name, isYou, traffic: string, keywords: string, backlinks: string, authority, trafficValue: string}` | Competitor benchmarks (incl. own site) | summary + `/competitors` | competitor (+ own project metrics) | Yes |
| `aiSeoMetrics` | `{label, value, change, accent}[]` | AI metrics (dashboard) | summary → `AiSeoSection` | AI SEO metric | Yes |
| `coreWebVitals` | `{metric, label, value: string, score: 'good'\|'needs-improvement'\|…, target: string}[]` | CWV | summary → `CoreWebVitalsSection` | CWV measurement | Yes |
| `recentActivities` | `Activity {id, type: 'ranked'\|'lost'\|'audit'\|'backlink'\|'ai', title, description, time: string}` | Activity feed | `/activities` → `RecentActivitiesSection` | activity/event | Yes |
| `notifications` | `{id, title, description, time: string}[]` | Bell dropdown | `/notifications` → `Topbar` | notification | Yes |
| `projectList` | `ProjectItem {id?, name, websiteUrl?, favicon, status, traffic: string, keywords: number, health, authority, lastAudit: string, trend: number[]}` | Projects | `/projects` (demo) | **project (implemented)** | Already replaced in Supabase mode; also the source for "Add sample projects" |
| `keywordFullTable` | `KeywordFull extends KeywordRow {intent, serp, trend30: number[]}` | All tracked keywords | `/keywords` → `KeywordRankingsScreen`, `KeywordDetailModal` | keyword + ranking history | Yes |
| `keywordSummary` | `{label, value: string, change}[]` | Keyword KPIs | `/keywords/summary` | derived | Yes |
| `auditChecks` | `AuditCheck {title, type, count, pages, description}` | Audit checks | `/audit/checks` → `SiteAuditScreen`, `AuditIssueModal` | audit issue type/result | Yes |
| `auditHistory` | `{date: string, errors, warnings, notices}[]` | Past audit counts | `/audit/history` | audit run | Yes |
| `backlinkTable` | `BacklinkRow {source, authority, target, anchor, type: 'Follow'\|'Nofollow'\|'UGC', firstSeen: string, change}` | Backlinks | `/backlinks` | backlink | Yes |
| `backlinkGrowth` | `{month, new, lost}[]` | New/lost per month | `/backlinks/growth` | derived | Yes |
| `competitorKeywords` | `{keyword, you, compA, compB, compC}[]` | Rank comparison | `/competitors/keyword-comparison` | competitor keyword position | Yes (shape needs redesign, §25) |
| `competitorGap` | `{unique, shared, missed}` | Gap counts | `/competitors/gap-analysis` | derived | Yes |
| `contentList` | `ContentItem {title, url, type, traffic, keywords, score, status, updated: string}` | Content pages | `/content` → `ContentScreen`, `ContentDetailModal` | content page | Yes |
| `contentStats` | `{label, value: string, change}[]` | Content KPIs | `/content/stats` | derived | Yes |
| `aiSeoFullMetrics` | `{label, value, change, target, description}[]` | AI metrics (full) | `/ai-seo/metrics` | AI SEO metric | Yes |
| `aiMentionsByPlatform` | `{platform, mentions, share}[]` | Mentions per AI platform | `/ai-seo/mentions-by-platform` | AI mention aggregate | Yes |
| `aiTrend` | `{week: string, visibility, mentions}[]` | Weekly trend | `/ai-seo/trend` | AI metric time series | Yes |
| `aiRecommendations` | `{title, impact: 'High'\|'Medium'\|'Low', score: string}[]` | Recommendations | `/ai-seo/recommendations` | recommendation | Yes |
| `reportList` | `ReportItem {name, type, date: string, status: 'Ready'\|'Generating'\|'Scheduled', size: string}` | Reports | `/reports` | report | Yes |
| `reportTemplates` | `{name, description, icon: string}[]` | Templates | `/reports/templates` → `ReportsScreen`, `GenerateReportModal` | report template (could stay static) | Optional |
| `notificationSettings` | `{label, email: boolean, push: boolean}[]` | Notification prefs | `/settings/notifications` | notification preference | Yes |
| `integrations` | `{name, connected: boolean, description}[]` | Integrations | `/settings/integrations` | integration connection | Yes |
| `planInfo` | `{name, price, cycle, projects, keywords, audits, renewal}` (all strings) | Plan and billing | `/settings/billing` | subscription/plan | Yes |
| `quickActions` | `{label, icon}[]` | Quick action buttons | imported directly by `QuickActions` | UI config | **No** |
| `sidebarItems` | `{label, icon, active?}[]` | Nav items | imported directly by `Sidebar` | UI config | **No** |
| `settingsSections` | `{id, label, icon}[]` | Settings nav | imported directly by `SettingsView` | UI config | **No** |
| `projects` | `{name, favicon}[]` | Old project list | **unused** (grep finds no consumer) | — | Remove later |

### 6.2 Inline hard-coded data inside components (not reachable through the data layer)

| File | Data | Should become |
|---|---|---|
| `hero-section.tsx` | "Last updated 2 minutes ago · Tracking 18,420 keywords across 4,820 pages" | project last-sync time and counts [Inferred] |
| `dashboard.tsx` (`DashboardHome` footer) | "Demo data for illustration" | remove or show only in demo mode |
| `pages/site-audit-screen.tsx` | "94%" site health, "+1.8% from last audit" | latest audit health score + delta |
| `modals/audit-issue-modal.tsx` | `mockPages`, `fixes` | affected pages per issue; fix suggestions (static or server) |
| `modals/content-detail-modal.tsx` | `tips` | optimisation suggestions (static or server) |
| `modals/run-audit-modal.tsx` | phase timer + "94% site health · 23 errors…" | audit job status/result |
| `modals/export-pdf-modal.tsx` | 1.5 s timer, section list | export job / generated file |
| `modals/import-project-modal.tsx` | `sources` (GSC, CSV) | UI config (keep) |
| `modals/add-competitor-modal.tsx` | country options `us/uk/de/in` (lowercase, and `uk` not `GB`) | should match `countries` in `projects.ts` [Inferred] |
| `pages/reports-screen.tsx` | "Scheduled Reports" array | scheduled reports |
| `pages/settings-screen.tsx` | Company "Acme Corporation", Role "SEO Manager", billing history dates, API key mask, webhook URL | profile fields (`profiles.company`, `profiles.job_title` exist in the DB), invoices, API keys, webhook |
| `topbar.tsx` | "Last 30 days", fallback user 'Jamie Doe' | date-range state (client) |
| `auth-context.tsx` | `demoUser` | stays for demo mode |
| `lib/api/projects.ts` | `industries`, `countries` option lists | stay client-side; they must match the DB `check` constraints (they do today) |

---

## 7. Forms

Every form uses native elements and the controls from `modal-shell.tsx`. Only **Login** and **New Project** read their values.

### 7.1 Login / Sign-up (`login-screen.tsx`, validation in `auth-context.tsx`)
| Field | Type | Required | Rule | Default |
|---|---|---|---|---|
| name (sign-up only) | text | yes | `trim().length >= 2` | `''` |
| email | email | yes | `/^\S+@\S+\.\S+$/` after trim | demo: `jamie@acme.com` |
| password | password | yes | `length >= 6` | demo: `rankpulse` |

- **Submit:** `login(email, password)` or `signUp(name, email, password)`. Both return `{ok:true, message?}` or `{ok:false, error}`.
- **Backend operation [Observed]:** `supabase.auth.signInWithPassword`; `supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.origin } })`. A DB trigger `handle_new_user` creates `profiles` from `raw_user_meta_data.name`.
- **Errors:** the Supabase `error.message` is shown verbatim.

### 7.2 New Project (`modals/new-project-modal.tsx`, `validateNewProject` in `lib/api/projects.ts`) (**wired**)
| Field | Type | Required | Validation | Normalisation |
|---|---|---|---|---|
| websiteUrl | text | **yes** | Must parse as `http(s)` URL with a dot in the hostname | Adds `https://` if missing; origin only, or origin + path without trailing slash |
| name | text | no | 2–100 chars | Defaults to hostname without `www.` |
| industry | select | no | one of `saas, ecommerce, finance, health, education, other` | `''` → `undefined` |
| targetCountry | select | no | one of `US, GB, CA, AU, DE, FR, IN` | `''` → `undefined` |
| keywords | text (comma-separated; newlines also split) | no | ≤100 keywords, each ≤200 chars | trim, lowercase, de-duplicate |

- **Request body [Observed]** (`NewProjectInput`): `{ name: string; websiteUrl: string; industry?: string; targetCountry?: string; trackingKeywords: string[] }`.
- **Operation [Observed]:** Supabase RPC `create_project(p_name, p_website_url, p_industry, p_target_country, p_tracking_keywords)`; or REST `POST /projects` (not implemented server-side).
- **DB-side checks [Observed]:** the same rules as `check` constraints, plus a unique `(user_id, lower(website_url))` index and an RPC error `22023` when there are more than 100 keywords.
- **Errors [Observed]:** `toApiError()` maps `23505` → 409 "You already have a project for this website.", `23514` → 400, `22023` → 400 (message passthrough), `42501` → 403. The message appears in a red box.
- **Success:** the modal closes and `/projects` is invalidated.

### 7.3 Forms that exist in the UI but don't submit anything

For each of these the **suggested operation** is inferred and the **endpoint is TBD**. `BACKEND_SPECIFICATION.md` proposes endpoints for all of them; nothing implements them.

| Form (file) | Fields (as rendered) | Current submit | Suggested operation |
|---|---|---|---|
| Import Project (`import-project-modal.tsx`) | source: `gsc` or `csv` (tile select). CSV shows a **drop-zone graphic only (no `<input type=file>`)**. GSC shows the text "You'll be redirected to authorize access" | "Import" closes | IMPORT projects from CSV / CONNECT GSC OAuth. Endpoint TBD |
| Add Keywords (`add-keyword-modal.tsx`) | keywords: string[] (dynamic rows, controlled); bulk: textarea (controlled, one per line); searchEngine select `google\|bing\|yahoo` (default google, **uncontrolled**); device `desktop\|mobile` (default desktop, **uncontrolled**) | "Track Keywords" closes; **no project selector** | CREATE keywords for a project (the DB already has `project_keywords(keyword, search_engine, device)` with the same enums). Endpoint TBD |
| Run Audit (`run-audit-modal.tsx`) | crawlDepth `quick\|standard\|full` (default standard); maxPages number (default 500); userAgent `desktop\|mobile\|googlebot` (default desktop). All uncontrolled | Simulated progress; closes | START audit job + poll status. Endpoint TBD |
| Add Backlink / Disavow (`add-backlink-modal.tsx`) | mode `add\|disavow` (controlled); sourceUrl; targetPage; linkType `follow\|nofollow\|ugc\|sponsored` (note: the table type only has Follow/Nofollow/UGC); anchorText; domainAuthority number 0–100 (optional per label); notes textarea. All uncontrolled | closes | CREATE backlink / CREATE disavow. Endpoint TBD |
| Add Competitor (`add-competitor-modal.tsx`) | domain (placeholder `competitor.com`); displayName; targetCountry `us\|uk\|de\|in`; trackingScope `organic\|paid\|all`. Uncontrolled | closes. The text says data is fetched automatically and "may take a few minutes" | CREATE competitor + async data fetch. Endpoint TBD |
| New Content (`new-content-modal.tsx`) | title; urlSlug; contentType `blog\|landing\|tool\|guide`; status `draft\|published\|needs-update` (note: the table also has `Outdated`); primaryKeyword; targetKeywords (comma-separated); metaDescription textarea. Uncontrolled | closes | CREATE content page. Endpoint TBD |
| Generate Report (`generate-report-modal.tsx`) | template (index into `/reports/templates`, controlled); dateRange `7\|30\|90\|custom` (no custom date inputs exist); format `pdf\|csv\|xlsx`; sections checkboxes (KPIs, Traffic, Keywords, Backlinks, Site Audit, Competitors, AI SEO; all default checked). Uncontrolled | closes | CREATE report job. Endpoint TBD |
| Export PDF (`export-pdf-modal.tsx`) | none (section list is display-only) | closes | EXPORT current view as a file. Endpoint TBD |
| Mark audit issue fixed (`audit-issue-modal.tsx`) | none | closes | UPDATE issue status. Endpoint TBD |
| Profile (`settings-screen.tsx`) | fullName, email, company, role (all `defaultValue`, uncontrolled) | no handler | UPDATE profile. **The DB already allows users to update `name, profile_image, company, job_title`** (column grants in the migration). Email change is not granted. Endpoint TBD (could be a Supabase `profiles` update) |
| Notification toggles (`settings-screen.tsx`) | per row: email, push booleans | local state only | UPDATE notification preferences. Endpoint TBD |

**No form uses zod or react-hook-form.** If you add validation, the existing pattern is a pure `validateX(form) → {ok, input} | {ok:false, errors}` function next to the API call (see `validateNewProject`) plus `FieldError` components.

---

## 8. Backend data requirements

Field types are TypeScript types from `src/lib/seo-data.ts`/`projects.ts`/`auth-context.tsx` **[Observed]**. Required/optional follows the TS type (`?` = optional). CRUD and relationships are **[Inferred]** unless noted.

### 8.1 User / Profile
- **Observed (frontend `AuthUser`):** `id?: string`, `name: string`, `email: string`, `plan: string` (display label such as "Pro Plan"), `initials: string` (computed client-side).
- **Observed (DB `profiles`):** `id uuid (=auth.users.id)`, `email`, `name`, `role ('owner'|'member'|'viewer', default 'owner')`, `plan ('free'|'pro'|'enterprise')`, `profile_image`, `company`, `job_title`, `status`, timestamps. The frontend reads only `name, plan`.
- **Used by:** `Topbar`, `HeroSection`, `SettingsView` (profile), `ProjectsScreen` (`mode`).
- **Ops:** GET current user ✅ (implemented); UPDATE profile ❌ (UI exists, not wired); change avatar ❌ (button only).
- **Auth:** a user can only read and update their own row (RLS ✅). role, plan and status can't be self-edited ✅.

### 8.2 Project (**implemented**)
- **Observed UI shape `ProjectItem`:** `id?: string`, `name`, `websiteUrl?`, `favicon` (1 letter), `status: 'active'|'paused'|'warning'`, `traffic: string` (compact, or `'—'`), `keywords: number`, `health: number (0–100)`, `authority: number (0–100)`, `lastAudit: string` (relative, or `'not run yet'`), `trend: number[]`.
- **Observed DB:** `projects(id, user_id, name, website_url, favicon, industry, target_country, status, health_score, authority_score, traffic_value text, last_audit_at, created_at, updated_at)`. `keywords` = `count(project_keywords)`. `trend` is **always `[]` from Supabase** (a comment says traffic history arrives "in a later phase").
- **Ops:** list ✅, create ✅, delete ✅, bulk-insert samples ✅. Update or pause ❌ (no UI). Import ❌.
- **Relationships:** Project 1–N ProjectKeyword ✅. Everything else is per project [Inferred]: keywords/rankings, audits, backlinks, competitors, content, AI metrics, reports, traffic.

### 8.3 Tracked keyword + ranking
- **Observed UI shape `KeywordFull`:** `keyword`, `volume: number`, `difficulty: number`, `cpc: string` (e.g. `"$4.20"`), `rank: number`, `previousRank: number`, `url: string` (path), `intent: 'Informational'|'Commercial'|'Transactional'|'Navigational'`, `serp: string`, `trend30: number[]` (7 points in the mock despite the name).
- **Observed DB:** only `project_keywords(id, project_id, keyword, search_engine, device)`. No metrics or rankings yet.
- **Used by:** Keyword Rankings screen, keyword detail modal, dashboard `KeywordSection` (the `KeywordRow` subset), competitor comparison.
- **Ops:** list, create (bulk) [UI exists]. Delete and update have no UI.
- **Summary (`keywordSummary`):** 6 labelled KPIs with a % change.

### 8.4 Site audit
- **Observed:** `AuditCheck {title, type: 'error'|'warning'|'notice', count, pages, description}`; history `{date: string, errors, warnings, notices}`; the dashboard uses `AuditIssue {type, title, count}`; the audit-issue modal wants affected pages `{url, status, severity}` (currently mock).
- **Inferred:** audit run (job with status/progress and a health score), issue results per run, affected pages per issue, "fixed" status.
- **Ops:** list latest checks, list history, start audit, get audit status, mark issue fixed.

### 8.5 Backlink
- **Observed:** `BacklinkRow {source (domain), authority, target (path), anchor, type: 'Follow'|'Nofollow'|'UGC', firstSeen: string ('Jul 14, 2025'), change: number}`. Stats, growth `{month, new, lost}`, anchor distribution `{name, value%}`, follow/nofollow `{name, value%}`, top domains `{domain, authority, backlinks, change}`.
- **Inferred:** create (manual add), disavow (the form also includes `sponsored` and `notes`).

### 8.6 Competitor
- **Observed:** `Competitor {name, isYou, traffic: string, keywords: string, backlinks: string, authority: number, trafficValue: string}`; keyword comparison `{keyword, you, compA, compB, compC}`; gap `{unique, shared, missed}`.
- **Inferred:** create (domain, displayName, country, scope). Remove and edit have no UI.

### 8.7 Content page
- **Observed:** `ContentItem {title, url, type: 'Blog'|'Landing'|'Tool'|'Guide', traffic: number, keywords: number, score: number (0 means none), status: 'Published'|'Draft'|'Needs Update'|'Outdated', updated: string (relative)}`; stats `{label, value, change}`.
- **Inferred:** create (form includes primaryKeyword, targetKeywords, metaDescription, which aren't displayed anywhere), edit ("Edit Content" button).

### 8.8 AI SEO
- **Observed:** metrics `{label, value, change, target, description}`, where **label is used as a key** for icons; trend `{week, visibility, mentions}`; platform mentions `{platform, mentions, share}`; recommendations `{title, impact, score: string}`.
- **Ops:** read only.

### 8.9 Dashboard traffic and KPIs
- **Observed:** see the §6.1 rows for `kpis` through `coreWebVitals`. All read-only.
- **Inferred:** needs a source of traffic data. Integrations (GSC/GA4) are the likely source, but that's **Unknown** (§25).

### 8.10 Activity, Notification
- **Observed:** Activity `{id, type ('ranked'|'lost'|'audit'|'backlink'|'ai'), title, description, time: string}`; Notification `{id, title, description, time: string}`.
- **Inferred:** notifications need read state (the bell dot is always on today). Both are read-only in the UI.

### 8.11 Report, report template, scheduled report
- **Observed:** `ReportItem {name, type: 'Weekly'|'Monthly'|'Custom'|'Audit'|'Competitor', date: string, status: 'Ready'|'Generating'|'Scheduled', size: string}`; template `{name, description, icon: string (lucide name)}`; scheduled (inline) `{name, schedule, recipients, next}`.
- **Inferred:** create report (async), download file, list scheduled reports. Scheduled-report CRUD has no UI.

### 8.12 Settings entities
- **Notification preference (observed):** `{label, email: boolean, push: boolean}`. Label is the only key.
- **Integration (observed):** `{name, connected: boolean, description}`. The "Connect" action is inferred (OAuth).
- **Plan/billing (observed):** `{name, price, cycle, projects, keywords, audits, renewal}`, all display strings. `profiles.plan` holds the plan tier; there's no billing table.
- **API key / webhook (inferred from hard-coded UI):** reveal, edit and generate have no data source at all.

---

## 9. API requirements

Legend: **✅ implemented**. **Path in code** = the string the frontend already requests (in `queries.ts`/`projects.ts`), which a REST backend at `VITE_API_URL` must serve as `GET {VITE_API_URL}{path}` returning `{success:true, data:<shape>}`. **TBD** = no contract exists in the code.

| Feature | Method | Suggested endpoint | Request | Response (`data`) | Auth | Frontend consumer |
|---|---|---|---|---|---|---|
| Sign up | — | Supabase Auth ✅ | email, password, `data.name` | session or none (email confirm) | public | `AuthProvider.signUp` |
| Sign in | — | Supabase Auth ✅ | email, password | session | public | `AuthProvider.login` |
| Sign out | — | Supabase Auth ✅ | — | — | user | `AuthProvider.logout` |
| Current profile | SELECT | Supabase `profiles` ✅ | `id = auth user` | `{name, plan}` | user | `loadSupabaseUser` |
| Update profile | TBD | TBD | `{name, company, job_title, profile_image}` [Inferred] | TBD | user (own row) | `SettingsView` profile (not wired) |
| List projects | GET | `/projects` (Supabase ✅ / REST path in code) | — | `ProjectItem[]` | user | `useProjects` (Projects, Topbar, Dashboard, ProjectDetail) |
| Create project | POST | `/projects` (Supabase RPC ✅ / REST path in code) | `NewProjectInput` | ignored (`void`) | user | `useCreateProject` |
| Delete project | DELETE | `/projects/{id}` (Supabase ✅ / REST path in code; demo projects use the name) | — | ignored | user (owner) | `useDeleteProject` |
| Add sample projects | INSERT | Supabase only ✅ | — | — | user | `useAddSampleProjects` |
| Import projects | TBD | TBD | CSV file or GSC OAuth | TBD | user | `ImportProjectModal` |
| Dashboard summary | GET | `/dashboard/summary` (path in code) | *(needs projectId, date range: §25)* | `DashboardSummary` (17 keys) | user | `useDashboardSummary` |
| Activities | GET | `/activities` | — | `Activity[]` | user | `useActivities` |
| Notifications | GET | `/notifications` | — | `{id,title,description,time}[]` | user | `useNotifications` (Topbar) |
| Keywords | GET | `/keywords` | — | `KeywordFull[]` | user | `useKeywords` |
| Keyword summary | GET | `/keywords/summary` | — | `{label,value,change}[]` | user | `useKeywordSummary` |
| Add keywords | TBD | TBD | `{keywords[], searchEngine, device}` + project [Inferred] | TBD | user | `AddKeywordModal` |
| Audit checks | GET | `/audit/checks` | — | `AuditCheck[]` | user | `useAuditChecks` |
| Audit history | GET | `/audit/history` | — | `{date,errors,warnings,notices}[]` | user | `useAuditHistory` |
| Run audit | TBD | TBD | `{crawlDepth, maxPages, userAgent}` | job id/status [Inferred] | user | `RunAuditModal` |
| Audit status | TBD | TBD | job id | phase/progress/result | user | `RunAuditModal` |
| Issue affected pages | TBD | TBD | issue id | `{url,status,severity}[]` | user | `AuditIssueModal` |
| Mark issue fixed | TBD | TBD | issue id | TBD | user | `AuditIssueModal` |
| Backlinks | GET | `/backlinks` | — | `BacklinkRow[]` | user | `useBacklinks` |
| Backlink stats / growth / anchors / follow / top domains | GET | `/backlinks/stats`, `/backlinks/growth`, `/backlinks/anchor-distribution`, `/backlinks/follow-nofollow`, `/backlinks/top-domains` | — | see §6.1 | user | `useBacklinksData` |
| Add / disavow backlink | TBD | TBD | `{mode, sourceUrl, targetPage, linkType, anchorText, domainAuthority?, notes?}` | TBD | user | `AddBacklinkModal` |
| Competitors | GET | `/competitors` | — | `Competitor[]` | user | `useCompetitors` |
| Competitor keyword comparison | GET | `/competitors/keyword-comparison` | — | `{keyword,you,compA,compB,compC}[]` | user | `useCompetitorKeywords` |
| Gap analysis | GET | `/competitors/gap-analysis` | — | `{unique,shared,missed}` | user | `useCompetitorGap` |
| Add competitor | TBD | TBD | `{domain, displayName, targetCountry, trackingScope}` | TBD | user | `AddCompetitorModal` |
| Content | GET | `/content` | — | `ContentItem[]` | user | `useContent` |
| Content stats | GET | `/content/stats` | — | `{label,value,change}[]` | user | `useContentStats` |
| Create content | TBD | TBD | `{title, urlSlug, contentType, status, primaryKeyword, targetKeywords[], metaDescription}` | TBD | user | `NewContentModal` |
| AI metrics / trend / mentions / recommendations | GET | `/ai-seo/metrics`, `/ai-seo/trend`, `/ai-seo/mentions-by-platform`, `/ai-seo/recommendations` | — | see §6.1 | user | `useAiSeoData` |
| Reports | GET | `/reports` | — | `ReportItem[]` | user | `useReports` |
| Report templates | GET | `/reports/templates` | — | `{name,description,icon}[]` | user | `useReportTemplates` |
| Generate report | TBD | TBD | `{template, dateRange, format, sections[]}` | report id/status | user | `GenerateReportModal` |
| Download report | TBD | TBD | report id | file | user | `ReportsScreen` download button |
| Export PDF | TBD | TBD | current screen/sections | file | user | `ExportPdfModal` |
| Scheduled reports | TBD | TBD | — | `{name,schedule,recipients,next}[]` | user | `ReportsScreen` (inline data) |
| Notification settings | GET | `/settings/notifications` | — | `{label,email,push}[]` | user | `useNotificationSettings` |
| Update notification settings | TBD | TBD | per row | TBD | user | `SettingsView` toggles |
| Integrations | GET | `/settings/integrations` | — | `{name,connected,description}[]` | user | `useIntegrations` |
| Connect integration | TBD | TBD (OAuth redirect) | provider | TBD | user | "Connect" button |
| Billing | GET | `/settings/billing` | — | `planInfo` shape | user | `useBilling` |
| Change / upgrade plan, invoices | TBD | TBD | — | — | owner [Inferred] | Billing buttons |
| API keys / webhook | TBD | TBD | — | — | owner [Inferred] | API Access section |

---

## 10. Authentication

**Current implementation [Observed]** (`src/lib/auth-context.tsx`, `src/lib/supabase.ts`):

| Topic | Behaviour |
|---|---|
| Provider | Supabase Auth when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set; otherwise **demo mode** (`mode: 'demo'`): any valid-looking email + 6-char password "logs in" and nothing persists |
| Login | `signInWithPassword`. The user is set by the `onAuthStateChange` listener, not by `login()` itself |
| Signup | `signUp` with `options.data.name` and `emailRedirectTo: window.location.origin`. If there's no session (confirm email on), it shows a notice |
| Logout | `supabase.auth.signOut()`, `setUser(null)`, `queryClient.clear()`. On the `SIGNED_OUT` event, the cache is also cleared |
| Session restore | `initializing` stays true until the first auth event; `App` renders a blank screen meanwhile |
| Token handling | Entirely inside supabase-js (default: localStorage, auto-refresh). The app ignores `TOKEN_REFRESHED` events. **The app never reads the access token itself** |
| Cookies/storage | The app itself writes only the theme to localStorage. `httpRequest` sends `credentials: 'include'` but **no `Authorization` header** |
| Current user | `useAuth().user: AuthUser \| null` |
| Password reset / change | **Not implemented, and no UI** |
| Email verification | Handled by Supabase (confirmation link → `window.location.origin`) |
| OAuth / SSO / MFA | None |
| Protected routes | Everything except the login screen (see §3) |
| Role-based UI / permission checks | **None** |

**What a backend must provide:**
- **If you stay on Supabase:** nothing new for basic auth. Remaining gaps: password reset (Supabase `resetPasswordForEmail` + a UI that doesn't exist yet), profile update, and Site URL / redirect configuration (`supabase/README.md` step 5).
- **If you add a custom REST API (`VITE_API_URL`):** decide how it authenticates the caller. As written, `httpRequest` only works with **cookie-based sessions on the API's domain** (it sends `credentials: 'include'` and no bearer token), and the frontend has no login call to such an API. With Supabase auth plus a REST API, the natural option is sending the Supabase JWT as `Authorization: Bearer` and verifying it server-side. **That requires a change to `http.ts`** (→ §25-U3).
- The REST API must return **HTTP 401/403** with the envelope. The frontend has **no global 401 handler** (no auto-logout, no redirect); the error message is simply shown in `QueryFallback` or the modal.

---

## 11. Authorization / roles

| Role | Source | Permissions | Frontend behaviour |
|---|---|---|---|
| `owner` / `member` / `viewer` | **DB only** (`profiles.role`, default `owner`) | **None enforced in DB policies beyond "own rows"**. RLS is per `user_id`, not per role | The frontend **never reads `role`**. No conditional UI |
| Plan (`free`/`pro`/`enterprise`) | `profiles.plan` → shown as "Free Plan"/… in the top bar | None enforced | Displayed only. `planInfo` limits ("10 projects", "5,000 tracked keywords") are mock text |
| Demo vs Supabase mode | `useAuth().mode` | — | `ProjectsScreen` shows "Add sample projects" only in Supabase mode; `LoginScreen` shows the demo note only in demo mode |

**[Inferred]** Settings contains billing, API keys and integrations, which usually belong to an account owner, and the UI shows "Profile → Role: SEO Manager" (hard-coded job title, not an access role). There are no team/member-invite screens. `BACKEND_SPECIFICATION.md §3` proposes an owner/member/viewer matrix; nothing in the frontend implements or requires it. Whether multi-user teams are in scope is **Unknown** (§25-U9).

**Data isolation [Observed]:** RLS policies on `profiles`, `projects` and `project_keywords` restrict every operation to `auth.uid()`. `create_project` is `security invoker`, so RLS still applies. Covered by `supabase/tests/rls_test.sql` and `supabase.integration.test.ts` ("keeps users apart").

---

## 12. Environment variables

Declared in `src/vite-env.d.ts`, documented in `.env.example`. Vite embeds every `VITE_*` variable into the client bundle, so **all of these are public by design.** `.env`, `*.local` are git-ignored (`.gitignore`). There's no `.env`/`.env.local` in the working tree right now, so a fresh clone runs in demo mode.

| Name | Used in | Purpose | Public/secret | Unset means |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` | Supabase project URL | Public | Demo mode (no auth, mock data) |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Supabase anon key (RLS protects the data) | Public (anon key only) | Demo mode |
| `VITE_API_URL` | `src/lib/api/http.ts` (`baseUrl`) | Base URL of a custom REST API, e.g. `…/api/v1` (trailing `/` stripped) | Public | Paths not served by Supabase use mock data |

**Never** put the Supabase `service_role` key, database passwords, third-party API secrets (GSC/GA4/Ahrefs/OpenAI…), Stripe secrets or JWT secrets in any `VITE_*` variable. They belong on the server. There's no third-party service configuration in the frontend today.

---

## 13. API client / service layer

**Existing pattern [Observed]. Keep it.**

| Piece | File | Notes |
|---|---|---|
| React Query setup | `query-client.ts` | `staleTime 60s`, `retry 1`, `refetchOnWindowFocus false` |
| Read hooks | `queries.ts` → `useApi<T>(path)` | queryKey `[path]`; returns `UseQueryResult<T, Error>` |
| Screen hooks | `queries.ts` → `combine()` | One loading/error state per screen |
| Mutations | `queries.ts` → `useProjectMutation` | Invalidates `['/projects']` on success |
| Source resolution | `client.ts` → `apiGet(path, signal)` | Supabase registry → REST → mock |
| Supabase registry | `projects.ts` → `supabaseRoutes: Record<path, () => Promise<unknown>>` | Add an entry here to serve another path from Supabase |
| REST | `http.ts` → `httpRequest(method, path, body?, signal?)` | JSON; unwraps `{success, data, message}`; 204 → `undefined`; network error → friendly `ApiError`; abort passthrough |
| Errors | `errors.ts` → `ApiError(message, status?)` | Screens show `error.message` |
| Row mapping | `projects.ts` → `toProjectItem(row)` | Converts DB rows (snake_case, timestamps) into the display shape (`ProjectItem`) |
| Mock | `mock.ts` → `mockRoutes` | `api.test.ts` asserts **every `useApi` path has a mock route**, so add a mock when you add a hook |

**Not present:** Axios, SWR, GraphQL, RPC frameworks (other than one Supabase RPC), WebSockets, server actions, Supabase Realtime, polling.

**Recommendations for integrating (without changing screens):**
1. Implement each path either as a Supabase function registered in `supabaseRoutes`, or on the REST server under the same path. The screens don't need to change.
2. Keep **display formatting in the frontend mapping layer** (like `toProjectItem`): return raw numbers and ISO timestamps from the backend and convert them to `"248.5K"`, `"Jul 14, 2025"`, `"12 min ago"` and chart `fill` colours in `src/lib/api/*`. The current mock payloads mix data with presentation (`fill: 'hsl(var(--chart-1))'`, `accent`, `icon`), which a backend shouldn't own.
3. For writes, add functions like `createProject` (Supabase / REST / demo branches) plus hooks built like `useProjectMutation`, invalidating the affected path keys.
4. To add parameters (project, date range, pagination), extend `useApi` so the params are part of the `queryKey` and are forwarded to `apiGet`/`httpRequest`. Today neither accepts params (§25-U1).

---

## 14. State management

| State | Today | Should eventually come from |
|---|---|---|
| `user` (AuthProvider) | Supabase session + `profiles` | Backend ✅ (already) |
| Theme | localStorage | **Client** (could optionally sync to the profile; nothing requires it) |
| Active modal + payload | ModalProvider | **Client** |
| Current page | URL | **Client** |
| Sidebar collapsed / mobile nav | Dashboard `useState` | **Client** |
| **Selected project** | Topbar `useState(selectedName)` (not shared, not persisted) | **Client state that must be shared** (context or URL) and sent to the backend with every project-scoped query [Inferred] |
| **Date range** | Doesn't exist (button is static) | Client state sent as query params [Inferred] |
| Table filter text | Per-screen `useState` | Client (or server-side search if lists get large) |
| Notification toggle values | Local `useState` seeded from the query | Backend (persist on toggle) |
| All SEO data | React Query cache over mock/REST/Supabase | Backend |
| Cache lifetime | 60 s stale, cleared on logout | — |

---

## 15. Component dependencies (reusable components)

| Component | File | Used in | Expects | Callbacks | Mock-dependent? | Future backend data |
|---|---|---|---|---|---|---|
| `QueryFallback` | `query-fallback.tsx` | Every data screen, 5 modals, `DashboardHome` | `query: {error, refetch}`, optional `skeleton` | `refetch` | No | Error messages from `ApiError` |
| `combine()` | `lib/api/queries.ts` | All screen hooks | `Record<string, UseQueryResult>` | — | No | — |
| `KpiCard` | `kpi-card.tsx` | `DashboardHome` | `kpi: Kpi`, `index` | — | Yes (`kpis`) | KPI value/change/trend |
| `PageHeader` | `page-header.tsx` | All screens | `title, description?, icon?, actions?` | — | No | — |
| `SectionHeader` | `section-header.tsx` | Dashboard widgets | `title, description?, action?` | — | No | — |
| `TableFilter` / `NoMatchesRow` | `table-filter.tsx` | Keywords, Backlinks, Content | `value, onChange, placeholder` / `colSpan` | `onChange` | No | Could drive server search |
| `ModalShell` + `ModalFooter`, `CancelButton`, `PrimaryButton`, `FieldLabel`, `FieldError`, `TextInput`, `TextArea`, `SelectInput` | `modals/modal-shell.tsx` | All modals | Standard input props; `PrimaryButton {type, disabled, onClick}` | `onClose`, `onClick` | No | — |
| `useModal()` | `modals/modal-provider.tsx` | Screens, hero, quick actions | `open(name: ModalName, payload?: unknown)` | — | No | Payloads should become **ids** (§25-U4) |
| Dashboard widgets (`ChartsSection`, `KeywordSection`, `SiteAuditSection`, `BacklinkSection`, `CompetitorSection`, `AiSeoSection`, `CoreWebVitalsSection`) | `components/dashboard/*.tsx` | `DashboardHome` | `Pick<DashboardSummary, …>` | none | Yes | `/dashboard/summary` |
| `RecentActivitiesSection` | `recent-activities-section.tsx` | `DashboardHome` | `recentActivities: Activity[]` | none | Yes | `/activities` |
| `HeroSection` | `hero-section.tsx` | `DashboardHome` | `projectName` | uses `useModal`, `useAuth` | Partly (hard-coded text) | Project name, sync time, counts |
| `Sidebar` | `sidebar.tsx` | `Dashboard` | `open, onToggle, mobileOpen, onMobileClose, active, onNavigate` | yes | Uses static `sidebarItems` (UI config) | — |
| `Topbar` | `topbar.tsx` | `Dashboard` | `onNavigate, onMenuClick` | yes | Uses `/projects`, `/notifications` | Selected project, notifications, search |

---

## 16. Tables / lists / dashboards

None of these have server-side pagination, sorting or search. Every list is fetched in full and rendered in full.

| View | Fields displayed | Sort | Filter/search | Pagination | Selection | CRUD | Export | Backend requirement |
|---|---|---|---|---|---|---|---|---|
| Projects grid (`projects-screen.tsx`) | favicon, name, status, trend, traffic, keywords, health, lastAudit, authority + 4 summary cards | none (DB orders by `created_at asc`) | none | none | click → detail | create ✅ delete ✅ (in modal) | — | ✅ implemented. Needs `trend` and `traffic` data eventually |
| Keyword table (`keyword-rankings-screen.tsx`) | 10 columns (§4.5) | button, no handler | client substring filter | none | row → detail | none wired | Export → simulated | Full list today; for large sets (mock KPI claims 18,420) needs server pagination/search [Inferred] |
| Dashboard keyword mini-table (`keyword-section.tsx`) | keyword, volume, KD, CPC, rank, previous rank, change, URL | button, no handler | none | none | none | none | — | Top-N keywords in summary |
| Audit checks (`site-audit-screen.tsx`) | title, count, description, pages; grouped by type | fixed grouping | none | none | click → issue modal | "Mark as Fixed" not wired | Export simulated | Latest audit results |
| Audit history chart | date, errors, warnings, notices | chronological | none | none | — | — | — | Last 7 audits |
| Backlinks table (`backlinks-screen.tsx`) | source, DA, target, anchor, type, firstSeen, change | none | client substring | none | none | add/disavow not wired | Export simulated | Mock KPI claims 52,140 links → pagination needed [Inferred] |
| Top referring domains | domain, DA, backlinks, change | fixed | none | none | none | — | — | Top-N |
| Competitor cards + keyword chart | §4.11 | fixed | none | none | none | add not wired | Export simulated | Variable-length competitor support needs a UI change (§25-U6) |
| Content table (`content-screen.tsx`) | title, url, type, traffic, keywords, score, status, updated | none | client substring | none | row → detail | create not wired | — | Mock KPI claims 4,820 pages → pagination [Inferred] |
| AI metric grid, trend, platforms, recommendations | §4.14 | fixed | none | none | none | — | Export simulated | Read-only |
| Reports list (`reports-screen.tsx`) | name, date, size, status | as returned | none | none | none | generate not wired | download not wired | Status updates for `Generating` [Inferred] |
| Notifications dropdown (`topbar.tsx`) | title, description, time | as returned | none | none | none | none | — | Read state [Inferred] |
| Activity timeline | type icon, title, description, time | as returned | none | none | none | — | — | Recent N |
| Dashboard charts (`charts-section.tsx`) | traffic trend, keyword distribution, sources, countries, devices, growth, top pages | fixed | none | none | none | — | — | Date range param [Inferred] |

---

## 17. File uploads

**[Observed] No file upload is implemented.** There's no `<input type="file">` anywhere in `src/components/dashboard`.

| UI | Location | What exists | Implied requirement [Inferred] |
|---|---|---|---|
| CSV project import | `modals/import-project-modal.tsx` | Dashed drop-zone graphic ("Drop your CSV file here / or click to browse"). No input, no drag handlers, no preview | CSV upload + parsing into projects. **File format, columns and size limit are Unknown** (§25-U10) |
| Change avatar | `pages/settings-screen.tsx` | Button with no handler | Image upload. `profiles.profile_image` (text) exists in the DB. Storage (e.g. Supabase Storage) not set up. Types and size are Unknown |

**Downloads (not uploads):** the Schema Generator creates `schema.json` client-side (works). Report download, billing invoice download and "Download PDF" are buttons without handlers. They'll need file URLs or streams from the backend.

---

## 18. Search / filter / sort / pagination

| Mechanism | Where | How | Where it runs |
|---|---|---|---|
| Table filter | Keywords, Backlinks, Content | `matchesQuery(query, fields)`: case-insensitive substring over listed fields | **Client-side** |
| Global search | `topbar.tsx` input "Search projects, keywords, reports…" | No handler | **Not implemented** (intent Unknown) |
| Sort buttons | `keyword-rankings-screen.tsx`, `keyword-section.tsx` | No handler | **Not implemented** |
| Site audit grouping | `site-audit-screen.tsx` | `filter` by `type` | Client-side |
| Date range | `topbar.tsx` "Last 30 days"; `generate-report-modal.tsx` select | No state / uncontrolled | **Not implemented** |
| Project selection | `topbar.tsx` | Local state, unused | **Not implemented** (affects all queries) |
| Pagination | — | None. The shadcn `pagination.tsx` primitive exists but is unused | — |
| URL query params | — | None are read or written | — |

If server-side search/sort/pagination is added, the frontend currently has no place to put params in `useApi`, and `http.ts` has no support for a `meta` field (it only returns `parsed.data`). That's a frontend change to plan (§25-U7).

---

## 19. Error / loading / empty states

Preserve these patterns:

| Pattern | Implementation |
|---|---|
| **Page loading** | `QueryFallback` renders nothing for 150 ms, then `PageSkeleton` (or `DashboardSkeleton` on `/`) |
| **Modal loading** | `QueryFallback` with `<Skeleton className="h-48 rounded-xl"/>` (project, keyword, audit-issue and content detail modals, generate-report modal) |
| **Session restore** | Blank `min-h-screen` div while `initializing` |
| **Query error** | `QueryFallback` card: "Couldn't load this data" + `error.message` + "Try again" (`refetch`, which only re-runs failed or missing queries via `combine`). React Query retries once automatically first |
| **Mutation pending** | Submit/delete button `disabled`, `Loader2` spinner |
| **Mutation error** | Inline red box with `mutation.error.message` (New Project, Project detail delete, Add samples) |
| **Form validation** | Per-field `FieldError` + `aria-invalid`/`aria-describedby`; the error clears when the field changes |
| **Auth error / notice** | `role="alert"` red box / `role="status"` green box on the login screen |
| **Empty** | Projects: "No projects yet" card. Project trend: "No traffic data yet" / "Traffic history will appear once data starts coming in." Topbar: "No projects" / "Projects unavailable". Tables: `NoMatchesRow` "No rows match your filter." (filter only). Project detail: "This project no longer exists." |
| **Missing empty states** | Keywords, backlinks, content, reports, competitors, AI, audit, activities and notifications render **blank sections** for empty arrays. `KeywordDetailModal`, `AuditIssueModal` and `ContentDetailModal` fall back to `list[0]` and would **throw on an empty list**. A real backend returning `[]` for a new project will expose this (§25-U11) |
| **Toasts** | None mounted |
| **Retry** | `retry: 1` + manual "Try again". No backoff config, no offline handling |
| **Global 401 handling** | None |

**Error message contract [Observed]:** `http.ts` shows `parsed.message` from the error body, falling back to `Request failed ({status})`. Network failure → "Could not reach the server. Check your connection and try again."

---

## 20. Real-time features

**[Observed] None.** There are no WebSockets, Supabase Realtime channels, Firebase listeners or polling (`refetchInterval` isn't used). The only subscription is `supabase.auth.onAuthStateChange`.

**What the UI implies [Inferred]:**
- **Audit progress** (`RunAuditModal` phases + "Run in Background"): needs job status by polling or a push channel.
- **Report generation** (`status: 'Generating'` with a spinning icon; the export "preparing" state): needs status updates.
- **Competitor data fetch** ("may take a few minutes"): async job.
- **Notifications bell** (unread dot): new notifications need polling or realtime.
- **"Last updated 2 minutes ago"** (hero): a sync timestamp.

Which mechanism to use (polling via React Query `refetchInterval`, Supabase Realtime, SSE…) is **Unknown** (§25-U12). Polling fits the existing architecture with the fewest changes.

---

## 21. Database requirements: potential database entities

**Already implemented [Observed]** (`supabase/migrations/20260929000000_auth_and_projects.sql`):

| Table | Key columns | Relations | RLS | Frontend use |
|---|---|---|---|---|
| `profiles` | id (=auth.users.id), email, name, role, plan, profile_image, company, job_title, status | 1–1 `auth.users` | own row: select, update (name, profile_image, company, job_title only) | name, plan |
| `projects` | id, user_id, name, website_url, favicon, industry, target_country, status, health_score, authority_score, traffic_value, last_audit_at | N–1 profiles | own rows: CRUD | Projects screen, Topbar, Dashboard |
| `project_keywords` | id, project_id, keyword, search_engine, device (unique per project+keyword+engine+device) | N–1 projects | via project ownership | count only |
| fn `create_project()` | — | inserts project + keywords | security invoker | New Project |
| fn `handle_new_user()` trigger | — | creates profile on sign-up | security definer | — |

**Potential entities not yet in the DB [Inferred].** Fields listed are only those the frontend displays or submits. Every entity below appears to be per project, but the frontend never sends a project id, so the scoping is an inference.

| Possible entity | Frontend evidence | Fields the frontend needs | Suggested relationships [Inferred] | CRUD needed |
|---|---|---|---|---|
| Keyword ranking snapshot | `KeywordFull`, `trend30`, `previousRank` | keyword, rank over time, volume, difficulty, cpc, intent, serp feature, ranking url | N–1 project_keywords | R (C by a tracking job) |
| Audit run | `auditHistory`, `RunAuditModal`, hero/site health "94%" | date, errors/warnings/notices counts, health score, config (depth, maxPages, userAgent), status | N–1 project | C, R |
| Audit issue | `AuditCheck`, `auditIssues`, `AuditIssueModal` | title, type, count, pages, description, affected pages (url, status, severity), fixed flag | N–1 audit run | R, U (fixed) |
| Backlink | `BacklinkRow`, add/disavow form | source, authority, target, anchor, type, firstSeen, change, notes, disavowed | N–1 project | C, R, (disavow) |
| Competitor | `Competitor`, add form | domain/name, displayName, country, scope, traffic, keywords, backlinks, authority, trafficValue | N–1 project | C, R |
| Competitor keyword position | `competitorKeywords` | keyword, position per competitor | N–1 competitor, keyword | R |
| Content page | `ContentItem`, new-content form | title, url, type, traffic, keywords, score, status, updated, primaryKeyword, targetKeywords, metaDescription | N–1 project | C, R, U |
| Traffic data | `kpis`, `trafficTrend`, sources, countries, devices, landing pages, `ProjectItem.trend/traffic` | time series per channel/country/device/page | N–1 project | R (ingested) |
| Core Web Vitals | `coreWebVitals` | metric, value, score, target | N–1 project | R |
| AI SEO metrics / mentions / trend / recommendations | AI screen | §8.8 | N–1 project | R |
| Activity | `recentActivities` | type, title, description, time | N–1 project or user | R |
| Notification | `notifications` | title, description, time, (read) | N–1 user | R, U (read) |
| Notification preference | `notificationSettings` | event label/key, email, push | N–1 user | R, U |
| Report | `reportList`, generate form | name, type, date, status, size, file, template, range, format, sections | N–1 project/user | C, R, (download) |
| Report template | `reportTemplates` | name, description, icon | static or table | R |
| Scheduled report | inline array in `reports-screen.tsx` | name, schedule, recipients, next run | N–1 project/user | R (no create UI) |
| Integration connection | `integrations` | provider name, connected, description | N–1 user (or project) | R, C (connect) |
| Plan / subscription | `planInfo`, `profiles.plan` | name, price, cycle, limits, renewal, invoices | N–1 user | R, U (change plan) |
| API key / webhook | hard-coded API Access UI | masked key, webhook URL | N–1 user | C, R, U |

---

## 22. Security considerations

| Area | Current state [Observed] | Consideration |
|---|---|---|
| Client-side secrets | Only public `VITE_*` values. The anon key is intended to be public | Never add secrets to `VITE_*` (they end up in the bundle). Third-party API keys (SERP, GSC, LLM) must be server-side |
| Data isolation | Supabase RLS on all 3 tables; tested | Every new table needs RLS scoped through project ownership (the `project_keywords` policy is the pattern) |
| Privilege escalation | Column-level grants stop users editing role/plan/status/email | Keep plan changes server-side (billing webhook), never from the client |
| REST auth | `credentials: 'include'`, no bearer token | Cookie auth needs CORS with an explicit origin + `Access-Control-Allow-Credentials` and CSRF protection. Bearer auth needs a code change (§25-U3) |
| Authorization in UI | No role checks | The server must enforce all permissions; don't rely on hidden buttons |
| XSS | No `dangerouslySetInnerHTML` in app code. All user data (project names, keywords, schema JSON in a `<pre>`) is rendered as React text | Keep it that way. Future content/meta-description previews must stay escaped |
| URLs from data | Links are `href="#"` today | When real URLs from crawled/third-party data are rendered as links, allow only `http(s):` (block `javascript:`), and add `rel="noopener noreferrer"` for `target="_blank"` |
| Input validation | Client validation duplicated as DB constraints for projects | Every new write endpoint must validate server-side; client checks are UX only |
| File uploads | None yet | CSV and avatar uploads need type/size limits, server-side parsing and a storage policy |
| Tokens/session storage | supabase-js default (localStorage) | Standard SPA trade-off (readable by XSS). Keep XSS surface minimal |
| Logout hygiene | `queryClient.clear()` on logout and on `SIGNED_OUT` | Keep. Per-user caches must not leak |
| API keys UI | Shows a hard-coded masked key | A real implementation should show a key only once at creation and store only a hash [Inferred] |
| Rate limiting / abuse | None | Auth and job-triggering endpoints (audit, competitor fetch, report) need limits [Inferred] |

---

## 23. Backend integration checklist

### Phase 1: Backend foundation
- [ ] Decide on the architecture: **Supabase-only**, **Supabase auth + custom REST**, or **REST-only** (the code supports mixing per path; §25-U2)
- [x] Database: Supabase migration for profiles/projects/project_keywords
- [x] Authentication: Supabase email/password, session restore, sign-out
- [ ] Password reset flow (backend + new UI)
- [ ] Decide how REST requests authenticate (cookie vs bearer) and update `http.ts` if bearer
- [ ] Align the REST error envelope with `http.ts` (`message` at top level) or update `http.ts` (§25-U5)
- [x] Environment configuration (`.env.example`, `vite-env.d.ts`)
- [ ] SPA fallback rewrite on the hosting platform

### Phase 2: Core APIs
- [x] Users: read profile
- [ ] Users: update profile (name/company/job_title/avatar)
- [x] Projects: list/create/delete
- [ ] Projects: update/pause, import
- [ ] Project-scoping design for all other data (§25-U1)
- [ ] Keywords: add, list with ranking metrics, summary
- [ ] Site audit: start job, status, results, history, affected pages, mark fixed
- [ ] Backlinks: list, stats/aggregates, add, disavow
- [ ] Competitors: add, list, keyword comparison, gap
- [ ] Content: create, list, stats, (edit)
- [ ] Dashboard summary aggregates + activities + notifications
- [ ] AI SEO read endpoints
- [ ] Reports: generate, list, download; templates; scheduled
- [ ] Settings: notification prefs (read/update), integrations (read/connect), billing (read), API keys

### Phase 3: Frontend integration
- [ ] Replace mock data path by path (register in `supabaseRoutes` or serve under `VITE_API_URL`)
- [ ] Add mapping functions (raw DB/API → display shape) next to each fetcher, like `toProjectItem`
- [ ] Extend `useApi`/`apiGet`/`httpRequest` with params (project id, date range, pagination), included in the query key
- [ ] Lift the selected project into shared state (context or URL) and use it in every query
- [ ] Wire each visual-only form to a mutation hook (§7.3); keep `validateX` + `FieldError` pattern
- [ ] Switch modal payloads from names/titles to ids
- [ ] Add empty states for every list; remove `?? list[0]` fallbacks in detail modals
- [ ] Remove hard-coded inline data (§6.2)
- [ ] Loading states: already handled by `QueryFallback`; add pending states to new mutations
- [ ] Protected routes: already global. Add role-gating only if roles become a requirement

### Phase 4: Testing
- [ ] API error cases (4xx/5xx/network, `success:false`). Extend `api.test.ts`
- [ ] Auth cases (expired session, 401 from REST, email-confirm flow)
- [ ] Empty states for a brand-new account/project
- [ ] Loading states (slow responses → skeleton after 150 ms)
- [ ] Form validation parity (client vs DB constraints, as in `projects.test.ts`)
- [ ] Permission/isolation checks for every new table (extend `supabase/tests/rls_test.sql` and `supabase.integration.test.ts`)
- [ ] Keep the "every hook has a mock route" test passing (demo mode must keep working)

---

## 24. Frontend ↔ backend contract

### Authentication contract
- **Supabase mode (implemented):** Supabase Auth email/password. Sign-up passes `options.data.name`; a DB trigger must create `profiles(id, email, name)`. The frontend then reads `profiles.name` and `profiles.plan` (`'free'|'pro'|'enterprise'`). If the profile read fails, it falls back to the email prefix and "Free Plan".
- **REST mode:** **not defined.** No REST login endpoint is called. Requests carry cookies only (`credentials: 'include'`).

### User contract
`AuthUser = { id?: string; name: string; email: string; plan: string /* display label */; initials: string /* computed */ }`

### Main entities
Exactly the TypeScript types in `src/lib/seo-data.ts` (`ProjectItem`, `KeywordFull`/`KeywordRow`, `AuditCheck`/`AuditIssue`, `BacklinkRow`, `Competitor`, `ContentItem`, `ReportItem`, `Activity`, `Kpi`) plus the `typeof seo.x` shapes referenced in `queries.ts`. `DashboardSummary` (in `queries.ts`) is the composite for `/dashboard/summary`.

### API operations
- **GET:** the 28 paths in `src/lib/api/queries.ts` (listed in §9). Each returns the array/object type named there, with **no parameters**.
- **POST `/projects`:** body `NewProjectInput` `{ name, websiteUrl, industry?, targetCountry?, trackingKeywords: string[] }`. The response body is ignored.
- **DELETE `/projects/{id-or-name}`:** URL-encoded. The response is ignored (204 allowed).
- **All other writes:** TBD.

### Request structure
- JSON body, `Content-Type: application/json` only when there's a body; `Accept: application/json`; `credentials: 'include'`; `AbortSignal` passed for GETs (React Query cancels on unmount).

### Response structure (REST, as parsed by `src/lib/api/http.ts`)
```jsonc
// success (HTTP 2xx)
{ "success": true, "data": <payload>, "message": "optional" }
// 204 No Content is also accepted (returns undefined)
```

### Error format (as parsed by `http.ts`)
```jsonc
// HTTP 4xx/5xx, or HTTP 200 with success:false
{ "success": false, "message": "Human-readable text shown to the user" }
```
- The frontend shows `message` verbatim. If there's no JSON or no `message`, it shows `Request failed ({status})`. `ApiError.status` holds the HTTP status, but no screen branches on it.
- ⚠️ `BACKEND_SPECIFICATION.md §22` proposes `{ success:false, error:{ code, message, details } }`. **With that shape the frontend would lose the message** (§25-U5).
- Supabase errors are mapped by `toApiError()` (`projects.ts`): `23505`→409, `23514`→400, `22023`→400, `42501`→403.

### Pagination format
**None.** Lists are plain arrays in `data`. If a `meta` object is returned, `http.ts` discards it.

### Filtering format
**None sent.** Filtering is client-side.

### Sorting format
**None sent.** Display order = response order (projects: `created_at asc`).

### Value formatting currently expected in payloads
Several fields are **display strings**, not raw values: `traffic`/`visits`/`value` like `"248.5K"`, `"18,420"`, `"94%"`; `cpc` like `"$4.20"`; times like `"12 min ago"`, `"2h ago"`, `"3d ago"`; dates like `"Jul 14, 2025"`/`"Jul 22"`; sizes like `"2.4 MB"` or `"—"`; chart colours `fill: "hsl(var(--chart-N))"`; `accent` and `icon` names. The Supabase projects path shows the intended approach: raw columns from the DB, formatted in `toProjectItem`.

### File upload requirements
None implemented (§17).

### Authorization requirements
Every endpoint requires a signed-in user and must return only that user's data (enforced by RLS for Supabase paths). There are no role requirements in the frontend.

---

## 25. Unknown / needs verification

| # | What is unknown | Where detected | Why it matters | Decision needed |
|---|---|---|---|---|
| U1 | **How data is scoped to a project.** No query sends a project id; the top-bar selector is local and unused | `queries.ts` (`useApi(path)` has no params), `topbar.tsx` (`selectedName`) | Every non-project endpoint returns data "for a project", but the backend can't know which | Pass `projectId` as a query param, a path segment or a header? Where does the selected project live (context, URL, persisted)? Default to the first project? |
| U2 | **Target backend architecture** | `client.ts` (Supabase → REST → mock), `.env.example`, `BACKEND_SPECIFICATION.md` (proposes Node/REST) | Decides whether new data lives in Supabase tables/RPCs or a REST server, and how auth reaches the server | Supabase-only vs Supabase-auth + REST vs REST-only |
| U3 | **REST authentication method** | `http.ts` (`credentials:'include'`, no `Authorization`) | With Supabase auth, a REST server can't identify the user unless the JWT is sent or cookies are shared | Cookie session or bearer JWT (the latter needs an `http.ts` change) |
| U4 | **Stable ids for list items** | Modal payloads: keyword text (`keyword-detail`), check title (`audit-issue`), content title (`content-detail`); React keys use names/urls; demo projects have no id | Duplicate names break lookups; detail endpoints need ids | Add `id` to all entities and pass ids as payloads |
| U5 | **Error envelope shape** | `http.ts` reads `message`; `BACKEND_SPECIFICATION.md §22` puts it at `error.message` | A spec-following backend's messages would be replaced by "Request failed (400)" | Return top-level `message` too, or update `http.ts` |
| U6 | **Number of competitors / comparison shape** | `competitors-screen.tsx` hard-codes `you, compA, compB, compC` series and names; 4-column grid | Real competitors have names and varying counts | Response shape for comparison; UI change to generate series dynamically |
| U7 | **Pagination/search/sort requirements** | Mock KPIs imply 18,420 keywords, 52,140 backlinks, 4,820 pages; no params supported; Sort buttons dead | Full-list responses won't scale | Page size, param names, `meta` handling in `http.ts` |
| U8 | **Date range** | `topbar.tsx` "Last 30 days" (static), `generate-report-modal.tsx` | Charts and KPIs imply a period | Supported ranges, param format, default |
| U9 | **Roles / teams** | `profiles.role` exists but is unread; no team UI; spec proposes RBAC | Affects RLS design (per user vs per organisation) | Single-user accounts only, or teams with owner/member/viewer? |
| U10 | **CSV import format** | `import-project-modal.tsx` | Can't implement parsing | Columns, max rows, max size, encoding, duplicates behaviour |
| U11 | **Empty-state behaviour for new projects** | Most screens have no empty state; detail modals use `list[0]` fallback | A real backend returning `[]` will show blank screens or crash modals | Add UI empty states (frontend change) before switching those paths off mock |
| U12 | **Async job model** (audit, competitor fetch, reports, export) | `run-audit-modal.tsx`, `add-competitor-modal.tsx`, `reports-screen.tsx`, `export-pdf-modal.tsx` | UI simulates progress; the backend needs a job/status design | Polling vs realtime; status fields; where files are stored |
| U13 | **Source of SEO data** (traffic, rankings, backlinks, AI mentions, CWV) | Integrations list (GSC, GA4, Ahrefs API) is mock only; no ingestion code | Determines third-party APIs, costs and credentials (server-side) | Which providers; sync schedule |
| U14 | **Formatting responsibility** | Mock payloads contain display strings, colours, icons | Backend shouldn't emit `hsl(var(--chart-1))` | Confirm: backend returns raw values; frontend mapping layer formats (recommended) |
| U15 | **Notification read state and preference keys** | Bell dot always on; prefs keyed only by display label | Need ids/keys to persist toggles and read state | Preference key list; read/unread API |
| U16 | **Billing provider** | Billing UI buttons dead; `profiles.plan` not client-editable | Plan changes need a payment flow | Stripe or other? Is billing in scope for this project? |
| U17 | **API keys & webhooks feature scope** | Hard-coded UI in Settings → API Access | Needs storage/hashing design | In scope or placeholder? |
| U18 | **Password reset** | No UI | Users can't recover accounts | Add UI + Supabase `resetPasswordForEmail` redirect page |
| U19 | **SPA hosting rewrite** | `BrowserRouter`, no host config | Deep links 404 on static hosts | Hosting target and rewrite config |
| U20 | **Field mismatches between forms and display types** | Backlink form has `sponsored` (table type lacks it); content form status lacks `Outdated` (table has it); competitor country codes `us/uk/de/in` vs project `US/GB/…` | Enum design | Canonical enums per field |
| U21 | **`trend30` length and meaning** | Named 30-day, mock has 7 points; keyword detail labels them `D1..D7` | Backend must know how many points to return | Points count / interval |
| U22 | **`ProjectItem.traffic` source** | Stored as text `traffic_value` in DB; parsed with `parseCompactNumber` for totals | Should be numeric and derived from traffic data | Replace with computed numeric traffic |

---

## 26. Backend implementation order

This order is dependency-aware and covers only what this frontend needs. Steps 1–2 are largely done.

1. **Architecture decision** (U2, U3, U5): pick Supabase-only vs +REST; fix the auth header and error envelope agreement. *Unblocks everything else.*
2. **Auth + profiles:** ✅ done. Remaining: profile update (column grants already exist), password reset (U18).
3. **Projects:** ✅ list/create/delete done. Remaining: update/pause, import (U10, needs file handling).
4. **Project scoping in the frontend data layer** (U1, U8): params in `useApi`/`apiGet`/`httpRequest` + shared selected-project state. *Required before any per-project data is real.*
5. **Stable ids + empty states** (U4, U11): small frontend changes, so switching each path off mock is safe.
6. **Keywords & rankings:** extend `project_keywords` usage (add-keywords mutation), ranking snapshots, `/keywords`, `/keywords/summary`. Feeds the dashboard keyword widgets and competitor comparison.
7. **Site audit:** audit runs + issues + affected pages; job/status model (U12); `/audit/checks`, `/audit/history`, mark fixed. Feeds project `health_score`/`last_audit_at` and the dashboard audit widget.
8. **Backlinks:** table + aggregates + add/disavow.
9. **Competitors:** add + async fetch + comparison (with U6 UI change) + gap.
10. **Content:** create/list/stats (+ edit).
11. **Traffic & dashboard aggregates** (depends on U13 data sources): `/dashboard/summary`, project `trend`/`traffic`, CWV.
12. **Activities & notifications** (+ read state, U15), generated from steps 6–11.
13. **AI SEO** read endpoints (source Unknown, U13).
14. **Reports & export:** async generation, file storage, download; templates; scheduled reports.
15. **Settings:** notification preferences persistence, integrations (OAuth), billing (U16), API keys (U17).
16. **File storage:** avatar upload and CSV import storage (when steps 2–3 need them).
17. **Search/sort/pagination** for large lists (U7).
18. **Error handling hardening + tests:** extend `api.test.ts`, `supabase.integration.test.ts` and `supabase/tests/rls_test.sql` for each new table and endpoint; keep demo mode working (the mock-route coverage test).
