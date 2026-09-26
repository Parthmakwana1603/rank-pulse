# Project Context — RankPulse SEO Suite

## 1. Executive Summary
**RankPulse** is a full-featured, enterprise-ready **SEO Analytics & Management Suite** built as a React + TypeScript single-page application (SPA). It empowers marketers, agencies, and webmasters to monitor search engine rankings, run technical site health audits, track backlink profiles, analyze competitors, score content performance, and track brand visibility across Generative AI search platforms (GEO - Generative Engine Optimization).

---

## 2. Tech Stack & Key Dependencies
- **Core Framework**: React 18, TypeScript 5.5, Vite 5.4
- **Styling & UI**: Tailwind CSS 3.4, PostCSS, Autoprefixer, `tailwindcss-animate`, `clsx`, `tailwind-merge`, `class-variance-authority` (CVA)
- **UI Primitives & Components**: Radix UI (`@radix-ui/react-*`), `lucide-react` (icons), `cmdk` (Command menu), `vaul` (Drawer), `sonner` (Toast notifications)
- **Data Visualizations**: Recharts 2.12 (Line, Bar, Pie, Radar, Radial, Area charts)
- **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **Date Utilities**: `date-fns`, `react-day-picker`
- **Backend Ready Client**: `@supabase/supabase-js` 2.58

---

## 3. Project Directory Structure

```
rank-pulse/
├── BACKEND_SPECIFICATION.md   # Exhaustive 130KB blueprint for production REST API & PostgreSQL DB
├── PROJECT_CONTEXT.md         # Comprehensive project context & architecture guide
├── index.html                 # HTML Entry point
├── vite.config.ts             # Vite configuration with path aliases (@ -> /src)
├── tailwind.config.js         # Design tokens, custom colors & animations
├── package.json               # Dependencies & build scripts
└── src/
    ├── App.tsx                # Auth state consumer & main layout switcher
    ├── main.tsx               # DOM mount point
    ├── index.css              # Global Tailwind imports & CSS custom properties (theme tokens)
    ├── lib/
    │   ├── auth-context.tsx   # React Context for mock authentication
    │   ├── seo-data.ts        # Centralized mock data store (~30KB of SEO domain metrics)
    │   └── utils.ts           # Helper function `cn()` combining `clsx` & `tailwind-merge`
    ├── hooks/
    │   └── use-toast.ts       # Hook wrapper for toast notifications
    └── components/
        ├── theme-provider.tsx # Dark/Light theme mode provider
        ├── ui/                # Reusable Radix UI & shadcn styled atomic components
        └── dashboard/
            ├── dashboard.tsx  # Central SPA layout (Sidebar + Topbar + Active View Router)
            ├── topbar.tsx     # Global search, project selector, notification tray, profile menu
            ├── sidebar.tsx    # Collapsible sidebar navigation menu
            ├── hero-section.tsx # Welcome banner & overview summary
            ├── kpi-card.tsx   # Stat card component with trend indicators & mini charts
            ├── pages/         # Core application screens
            │   ├── ai-seo-screen.tsx            # Generative Engine Optimization metrics
            │   ├── backlinks-screen.tsx         # Backlink profile & domain authority
            │   ├── competitors-screen.tsx       # Competitor gap analysis & market share
            │   ├── content-screen.tsx           # Content performance scoring & SEO readiness
            │   ├── keyword-rankings-screen.tsx  # SERP position tracking & feature badges
            │   ├── projects-screen.tsx          # SEO Project portfolio management
            │   ├── reports-screen.tsx           # Scheduled & instant report generation
            │   ├── schema-generator-screen.tsx  # Interactive JSON-LD schema builder (Client-side)
            │   ├── settings-screen.tsx         # Account, integration, & API token settings
            │   └── site-audit-screen.tsx        # Technical crawler diagnostics & health score
            └── modals/        # Action dialogs and drawer forms
                ├── modal-provider.tsx           # Dynamic context-driven modal state dispatcher
                ├── modal-shell.tsx              # Generic modal wrapper dialog layout
                ├── add-backlink-modal.tsx       # Modal to manually add or disavow backlinks
                ├── add-competitor-modal.tsx     # Modal to track new competitor domain
                ├── add-keyword-modal.tsx        # Bulk keyword addition dialog
                ├── audit-issue-modal.tsx        # Technical audit issue details & resolution workflow
                ├── content-detail-modal.tsx     # Detailed content performance audit
                ├── export-pdf-modal.tsx         # Report exporter trigger
                ├── generate-report-modal.tsx    # Custom report creation wizard
                ├── import-project-modal.tsx     # GSC & CSV project import modal
                ├── keyword-detail-modal.tsx     # 30-day SERP position history chart modal
                ├── new-content-modal.tsx        # Create new content entry dialog
                ├── new-project-modal.tsx        # Create new SEO project modal
                ├── project-detail-modal.tsx     # Project overview dialog
                └── run-audit-modal.tsx          # Trigger new site crawler job dialog
```

---

## 4. Architecture & Data Flow

### State & Context Hierarchy
1. **`AuthProvider`** ([`src/lib/auth-context.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/lib/auth-context.tsx)): Wraps application root. Provides current logged-in user state (`user`), login handler (`login`), and logout handler (`logout`).
2. **`ThemeProvider`** ([`src/components/theme-provider.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/components/theme-provider.tsx)): Controls dark/light mode toggle stored in localStorage.
3. **`ModalProvider`** ([`src/components/dashboard/modals/modal-provider.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/components/dashboard/modals/modal-provider.tsx)): Centralized dispatch system for opening/closing modals with optional payload objects across any component without prop drilling.
4. **`Dashboard Router`** ([`src/components/dashboard/dashboard.tsx`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/src/components/dashboard/dashboard.tsx)): State-driven view router (`activePage`) that dynamically renders page components and handles simulated page loading skeletons.

---

## 5. Main Screens & Features Summary

| Screen | Core Capabilities | Data Source |
| :--- | :--- | :--- |
| **Dashboard** | Overview of main KPIs, Organic traffic chart, SERP breakdown, recent activities, Core Web Vitals. | `kpis`, `trafficData`, `recentActivities` in `seo-data.ts` |
| **Projects** | Manage multiple tracked domains/websites, add target countries, import from CSV/GSC. | `projectList` in `seo-data.ts` |
| **Keyword Rankings** | SERP tracking with position changes, difficulty index (KD%), search volume, intent tag, SERP features (Snippet, PAA, Knowledge Panel). | `keywordFullTable`, `keywordSummary` in `seo-data.ts` |
| **Site Audit** | Technical audit health gauge (0-100), crawled pages status, issue severity filter (Errors, Warnings, Notices). | `auditChecks`, `auditHistory` in `seo-data.ts` |
| **Backlinks** | Referring domain rating (DR), Follow vs Nofollow ratio, anchor text distribution, backlink growth velocity. | `backlinkTable`, `backlinkStats` in `seo-data.ts` |
| **Competitors** | Domain overlap score, organic keyword gap identification (Missing, Shared, Weak keywords). | `competitors`, `competitorKeywords` in `seo-data.ts` |
| **Content** | Content performance scoring (SEO score, readability score), word counts, target keyword density. | `contentList`, `contentStats` in `seo-data.ts` |
| **AI SEO (GEO)** | Generative AI visibility tracking across ChatGPT, Claude, Perplexity, Google AI Overviews, Copilot. | `aiSeoFullMetrics`, `aiMentionsByPlatform` in `seo-data.ts` |
| **Reports** | On-demand PDF/CSV report builder and scheduled automated report dispatch configuration. | `reportList`, `reportTemplates` in `seo-data.ts` |
| **Schema Generator** | 100% Client-side JSON-LD generator for 10 Schema.org types (Article, Product, FAQ, LocalBusiness, etc.). | Form state in `schema-generator-screen.tsx` |
| **Settings** | User profile, notification preferences, OAuth integrations (GSC, GA4, Ahrefs), API key management. | `integrations`, `notificationSettings` in `seo-data.ts` |

---

## 6. Development Scripts

- `npm run dev` — Launch Vite local development server on `http://localhost:5173/`.
- `npm run build` — TypeScript type-check (`tsc -b`) and bundle build using Vite.
- `npm run preview` — Locally serve production build output.
- `npm run typecheck` — Perform strict TypeScript validation without emitting output.
- `npm run lint` — Execute ESLint static analysis across `.ts` and `.tsx` files.

---

## 7. Future Integration Blueprint

For building the backend service layer, refer to [`BACKEND_SPECIFICATION.md`](file:///c:/Users/parth/OneDrive/Desktop/college%20project/rank-pulse/BACKEND_SPECIFICATION.md). It defines:
- RESTful API specs for all 11 screens & 13 modals
- PostgreSQL Relational Database Schema & Migrations
- Auth & RBAC Security setup (JWT + Refresh Tokens)
- Integration architecture for Google Search Console, Google Analytics 4, SERP tracking APIs, and LLM providers.
