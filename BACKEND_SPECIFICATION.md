# Backend Engineering Specification — RankPulse SEO Suite

> Generated from a complete frontend analysis of the existing Bolt-built React application.
> This document is implementation-ready for any backend AI agent or developer.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Complete Project Inventory](#2-complete-project-inventory)
3. [User Roles & RBAC](#3-user-roles--rbac)
4. [Data Model / Database Design](#4-data-model--database-design)
5. [Database Relationships](#5-database-relationships)
6. [API Specification](#6-api-specification)
7. [API Inventory Table](#7-api-inventory-table)
8. [Frontend Mock Data Mapping](#8-frontend-mock-data-mapping)
9. [Forms & User Actions](#9-forms--user-actions)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Security Requirements](#11-security-requirements)
12. [File & Image Uploads](#12-file--image-uploads)
13. [Real-Time Features](#13-real-time-features)
14. [GPS / Location Features](#14-gps--location-features)
15. [Analytics & Dashboards](#15-analytics--dashboards)
16. [Search, Filtering & Pagination](#16-search-filtering--pagination)
17. [Notifications](#17-notifications)
18. [Audit Logging](#18-audit-logging)
19. [Background Jobs / Cron Jobs](#19-background-jobs--cron-jobs)
20. [AI Features](#20-ai-features)
21. [Offline Sync](#21-offline-sync)
22. [Error Handling](#22-error-handling)
23. [Response Format](#23-response-format)
24. [Backend Architecture Recommendation](#24-backend-architecture-recommendation)
25. [Recommended Technology Stack](#25-recommended-technology-stack)
26. [Environment Variables](#26-environment-variables)
27. [Seed Data](#27-seed-data)
28. [API → Frontend Mapping](#28-api--frontend-mapping)
29. [End-to-End User Flows](#29-end-to-end-user-flows)
30. [Backend Implementation Order](#30-backend-implementation-order)
31. [Testing Requirements](#31-testing-requirements)
32. [Production Readiness](#32-production-readiness)

---

## 1. Project Overview

RankPulse is an SEO management suite. The frontend is a React + Vite + Tailwind + shadcn/ui application with 11 screens, 13 modals, and a mock auth context. All data is currently hardcoded in `src/lib/seo-data.ts`. The frontend uses Recharts for visualizations, lucide-react for icons, and a central modal-provider context for dialog dispatch.

The application manages:
- SEO projects (website tracking units)
- Keyword rank tracking with SERP features
- Technical site audits with crawl diagnostics
- Backlink monitoring and referring domain analysis
- Competitor benchmarking with keyword gap analysis
- Content performance scoring
- AI/GEO visibility scoring (ChatGPT, Perplexity, Google AI Overviews, Claude, Copilot)
- Core Web Vitals (CrUX data)
- Report generation (PDF/CSV/XLSX) with scheduling
- Schema markup generation (client-side only — no backend needed)
- User settings, integrations, billing, notifications

The schema generator page is purely client-side computation (builds JSON-LD from form input) and requires **no backend**.

---

## 2. Complete Project Inventory

### Pages / Screens

| Screen | Route (sidebar label) | Purpose | Role | Data Required | Actions | Backend APIs |
|---|---|---|---|---|---|---|
| Login | (pre-auth) | Email/password sign-in | Anonymous | User credentials | Submit login form | `POST /auth/login` |
| Dashboard | "Dashboard" | KPI overview, traffic charts, quick actions, recent activity | Owner/Member | KPIs, traffic trends, keyword table, audit issues, backlink stats, competitors, AI metrics, CWV, activities | Navigate to sub-pages via quick actions | `GET /dashboard/summary`, `GET /dashboard/kpis`, `GET /dashboard/traffic-trend`, `GET /dashboard/activities` |
| Schema Generator | "Schema Generator" | Build JSON-LD structured data from form input | Owner/Member | None (client-side) | Fill form, copy/download JSON | None |
| Projects | "Projects" | List/manage SEO projects | Owner/Member | projectList (6 items) | New project, import project, view project detail | `GET /projects`, `POST /projects`, `POST /projects/import`, `GET /projects/:id` |
| Keyword Rankings | "Keyword Rankings" | Track keyword positions in SERPs | Owner/Member | keywordFullTable (12 rows), keywordSummary (6 stats) | Add keyword, view keyword detail, export PDF | `GET /keywords`, `GET /keywords/summary`, `POST /keywords`, `GET /keywords/:id`, `POST /export` |
| Site Audit | "Site Audit" | Technical health diagnostics | Owner/Member | auditChecks (10), auditHistory (7) | Run audit, view issue detail, export PDF | `GET /audit/checks`, `GET /audit/history`, `POST /audit/run`, `GET /audit/issues/:id`, `PATCH /audit/issues/:id`, `POST /export` |
| Backlinks | "Backlinks" | Inbound link profile monitoring | Owner/Member | backlinkTable (10), backlinkStats (4), backlinkGrowth (6), anchorTextDistribution (5), followNofollow (3), topReferringDomains (5) | Add backlink, export PDF | `GET /backlinks`, `GET /backlinks/stats`, `GET /backlinks/growth`, `GET /backlinks/anchor-distribution`, `GET /backlinks/follow-nofollow`, `GET /backlinks/top-domains`, `POST /backlinks`, `POST /export` |
| Competitors | "Competitors" | Benchmark against competitors | Owner/Member | competitors (4), competitorKeywords (8), competitorGap (3) | Add competitor, export PDF | `GET /competitors`, `GET /competitors/keyword-comparison`, `GET /competitors/gap-analysis`, `POST /competitors`, `POST /export` |
| Content | "Content" | Content performance management | Owner/Member | contentList (10), contentStats (4) | New content, view content detail | `GET /content`, `GET /content/stats`, `POST /content`, `GET /content/:id` |
| AI SEO | "AI SEO" | AI/GEO visibility scoring | Owner/Member | aiSeoFullMetrics (8), aiMentionsByPlatform (5), aiTrend (7), aiRecommendations (5) | Export PDF | `GET /ai-seo/metrics`, `GET /ai-seo/trend`, `GET /ai-seo/mentions-by-platform`, `GET /ai-seo/recommendations`, `POST /export` |
| Reports | "Reports" | Generate/schedule/download reports | Owner/Member | reportList (8), reportTemplates (6), scheduled reports (3 inline) | Generate report, download report, use template | `GET /reports`, `GET /reports/templates`, `POST /reports/generate`, `GET /reports/:id/download`, `GET /reports/scheduled`, `POST /reports/schedule` |
| Settings | (via profile dropdown) | Profile, notifications, integrations, billing, appearance, API | Owner/Member | settingsSections (6), integrations (6), notificationSettings (7), planInfo | Update profile, toggle notifications, connect/disconnect integrations, change plan, generate API key, toggle theme | `GET /settings/profile`, `PUT /settings/profile`, `GET /settings/notifications`, `PUT /settings/notifications`, `GET /settings/integrations`, `POST /settings/integrations/:id/connect`, `DELETE /settings/integrations/:id`, `GET /settings/billing`, `GET /settings/api-keys`, `POST /settings/api-keys` |

### Modals

| Modal | Triggered From | Purpose | Form Fields | Backend Operation |
|---|---|---|---|---|
| new-project | Projects screen | Create new SEO project | name, website_url, industry, target_country, tracking_keywords[] | `POST /projects` |
| import-project | Projects screen | Import from GSC or CSV | source (gsc/csv), csv_file | `POST /projects/import` |
| project-detail | Projects screen | View project metrics + trend chart | (read-only) | `GET /projects/:id` |
| add-keyword | Keyword Rankings screen | Add keywords to track | keywords[], bulk_text, search_engine, device | `POST /keywords` (bulk) |
| keyword-detail | Keyword Rankings screen | View keyword stats + 30-day history | (read-only) | `GET /keywords/:id` |
| run-audit | Site Audit screen | Trigger site crawl | crawl_depth, max_pages, user_agent | `POST /audit/run` |
| audit-issue | Site Audit screen | View issue detail + mark fixed | (read-only + action) | `GET /audit/issues/:id`, `PATCH /audit/issues/:id` |
| add-backlink | Backlinks screen | Manually add or disavow backlink | source_url, target_page, link_type, anchor_text, domain_authority, notes, mode (add/disavow) | `POST /backlinks` or `POST /backlinks/disavow` |
| add-competitor | Competitors screen | Add competitor domain | domain, display_name, target_country, tracking_scope | `POST /competitors` |
| new-content | Content screen | Create content entry | title, url_slug, content_type, status, primary_keyword, target_keywords[], meta_description | `POST /content` |
| content-detail | Content screen | View content performance | (read-only) | `GET /content/:id` |
| generate-report | Reports screen | Generate report from template | template_id, date_range, format, include_sections[] | `POST /reports/generate` |
| export-pdf | Multiple screens | Export current view as PDF | (none — 8 fixed sections) | `POST /export` |

---

## 3. User Roles & RBAC

The frontend implies a single-tenant SaaS model with one organization per account. There is no multi-user role selection in the UI. However, the settings page has a "Role" field (defaulting to "SEO Manager"), and the profile supports team member concepts. The frontend supports these roles:

### Identified Roles

| Role | Evidence in Frontend |
|---|---|
| **Owner** | Account creator; has billing access, API key management, can delete projects |
| **Member** | Standard user; can manage projects, keywords, content, audits, reports |
| **Viewer** | Read-only access (implied by "Pro Plan" with team features) |

### RBAC Matrix

| Feature | Owner | Member | Viewer |
|---|---|---|---|
| View Dashboard | YES | YES | YES |
| View all screens | YES | YES | YES |
| Create/Edit/Delete Projects | YES | YES | NO |
| Import Projects | YES | YES | NO |
| Add/Delete Keywords | YES | YES | NO |
| Run Site Audits | YES | YES | NO |
| Mark Audit Issues Fixed | YES | YES | NO |
| Add/Disavow Backlinks | YES | YES | NO |
| Add/Remove Competitors | YES | YES | NO |
| Create/Edit Content | YES | YES | NO |
| Generate/Export Reports | YES | YES | YES |
| Schedule Reports | YES | YES | NO |
| Manage Integrations | YES | NO | NO |
| Manage Billing/Plan | YES | NO | NO |
| Generate API Keys | YES | NO | NO |
| Manage Notifications | YES | YES | YES |
| Edit Profile | YES | YES | YES |
| Invite Team Members | YES | NO | NO |
| Delete Account | YES | NO | NO |

---

## 4. Data Model / Database Design

### 4.1 `users`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           TEXT NOT NULL UNIQUE
password_hash   TEXT NOT NULL
name            TEXT NOT NULL
role            TEXT NOT NULL DEFAULT 'owner'  -- 'owner' | 'member' | 'viewer'
plan            TEXT NOT NULL DEFAULT 'free'   -- 'free' | 'pro' | 'enterprise'
profile_image   TEXT
company         TEXT
job_title       TEXT
status          TEXT NOT NULL DEFAULT 'active' -- 'active' | 'suspended' | 'deleted'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `email`
- **Index:** `email`, `status`

### 4.2 `projects`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
name            TEXT NOT NULL
website_url     TEXT NOT NULL
favicon         TEXT
industry        TEXT           -- 'saas' | 'ecommerce' | 'finance' | 'health' | 'education' | 'other'
target_country  TEXT            -- 'US' | 'UK' | 'DE' | 'IN' | etc.
status          TEXT NOT NULL DEFAULT 'active' -- 'active' | 'paused' | 'warning'
health_score    INTEGER DEFAULT 0
authority_score INTEGER DEFAULT 0
traffic_value   TEXT
last_audit_at   TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Foreign Key:** `user_id → users.id`
- **Index:** `user_id`, `status`

### 4.3 `project_keywords`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
keyword         TEXT NOT NULL
search_engine   TEXT NOT NULL DEFAULT 'google' -- 'google' | 'bing' | 'yahoo'
device          TEXT NOT NULL DEFAULT 'desktop' -- 'desktop' | 'mobile'
```

- **Unique:** `(project_id, keyword, search_engine, device)`
- **Index:** `project_id`

### 4.4 `keywords`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
keyword         TEXT NOT NULL
volume          INTEGER          -- monthly search volume
difficulty      INTEGER          -- keyword difficulty score 0-100
cpc             DECIMAL(10,2)    -- cost per click in USD
intent          TEXT             -- 'informational' | 'commercial' | 'transactional' | 'navigational'
serp_feature    TEXT             -- 'featured_snippet' | 'people_also_ask' | 'image_pack' | 'site_links' | 'video' | null
url             TEXT             -- ranking URL path
search_engine   TEXT NOT NULL DEFAULT 'google'
device          TEXT NOT NULL DEFAULT 'desktop'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `keyword`

### 4.5 `keyword_rankings`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
keyword_id      UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE
rank            INTEGER NOT NULL
previous_rank   INTEGER
checked_at      DATE NOT NULL DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(keyword_id, checked_at)`
- **Index:** `keyword_id`, `checked_at`

### 4.6 `audits`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
crawl_depth     TEXT NOT NULL DEFAULT 'standard' -- 'quick' | 'standard' | 'full'
max_pages       INTEGER NOT NULL DEFAULT 500
user_agent      TEXT NOT NULL DEFAULT 'desktop'  -- 'desktop' | 'mobile' | 'googlebot'
health_score    INTEGER
status          TEXT NOT NULL DEFAULT 'pending'  -- 'pending' | 'running' | 'completed' | 'failed'
started_at      TIMESTAMPTZ
completed_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `status`

### 4.7 `audit_issues`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
type            TEXT NOT NULL   -- 'error' | 'warning' | 'notice'
title           TEXT NOT NULL
description     TEXT
count           INTEGER NOT NULL DEFAULT 0
pages_affected  INTEGER NOT NULL DEFAULT 0
status          TEXT NOT NULL DEFAULT 'open' -- 'open' | 'fixed' | 'ignored'
affected_urls   JSONB           -- array of {url, detail}
recommendations JSONB           -- array of fix recommendations
fixed_at        TIMESTAMPTZ
fixed_by        UUID REFERENCES users(id)
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `audit_id`, `project_id`, `type`, `status`

### 4.8 `audit_history`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
audit_date      DATE NOT NULL
errors          INTEGER NOT NULL DEFAULT 0
warnings        INTEGER NOT NULL DEFAULT 0
notices         INTEGER NOT NULL DEFAULT 0
health_score    INTEGER
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(project_id, audit_date)`
- **Index:** `project_id`, `audit_date`

### 4.9 `backlinks`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
source_domain    TEXT NOT NULL
source_url      TEXT NOT NULL
target_page     TEXT NOT NULL
anchor_text     TEXT
link_type       TEXT NOT NULL DEFAULT 'follow' -- 'follow' | 'nofollow' | 'ugc' | 'sponsored'
domain_authority INTEGER
is_disavowed    BOOLEAN NOT NULL DEFAULT false
notes           TEXT
first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now()
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `source_domain`, `link_type`

### 4.10 `backlink_disavows`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
source_url      TEXT NOT NULL
notes           TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.11 `competitors`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
domain          TEXT NOT NULL
display_name    TEXT
target_country  TEXT DEFAULT 'US'
tracking_scope  TEXT NOT NULL DEFAULT 'organic' -- 'organic' | 'paid_organic' | 'all'
traffic         TEXT
traffic_value   TEXT
keywords_count  TEXT
backlinks_count TEXT
authority_score INTEGER
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(project_id, domain)`
- **Index:** `project_id`

### 4.12 `competitor_keyword_positions`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
keyword         TEXT NOT NULL
your_rank       INTEGER
comp_a_rank     INTEGER
comp_b_rank     INTEGER
comp_c_rank     INTEGER
checked_at      DATE NOT NULL DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `keyword`

### 4.13 `content_pages`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
title           TEXT NOT NULL
url_slug        TEXT NOT NULL
content_type    TEXT NOT NULL  -- 'blog' | 'landing' | 'tool' | 'guide'
status          TEXT NOT NULL DEFAULT 'draft' -- 'draft' | 'published' | 'needs_update' | 'outdated'
primary_keyword TEXT
target_keywords TEXT[]
meta_description TEXT
traffic         INTEGER DEFAULT 0
keywords_count  INTEGER DEFAULT 0
content_score   INTEGER DEFAULT 0
updated_at      TEXT           -- human-readable relative time
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `status`, `content_type`

### 4.14 `ai_seo_metrics`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
metric_name     TEXT NOT NULL   -- 'ai_visibility' | 'geo_score' | 'ai_mentions' | 'citation_score' | 'llm_readiness' | 'structured_data' | 'content_quality' | 'entity_recognition'
value           NUMERIC NOT NULL
change_pct      NUMERIC
target_value    NUMERIC
description     TEXT
checked_at      DATE NOT NULL DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(project_id, metric_name, checked_at)`
- **Index:** `project_id`, `metric_name`

### 4.15 `ai_mentions_by_platform`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
platform        TEXT NOT NULL  -- 'chatgpt' | 'perplexity' | 'google_ai_overviews' | 'claude' | 'copilot'
mentions        INTEGER NOT NULL DEFAULT 0
share_pct       NUMERIC
checked_at      DATE NOT NULL DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `platform`

### 4.16 `ai_seo_trend`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
week_label      TEXT NOT NULL  -- 'W1', 'W2', etc.
visibility      NUMERIC NOT NULL
mentions        INTEGER NOT NULL
checked_at      DATE NOT NULL DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `checked_at`

### 4.17 `ai_recommendations`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
title           TEXT NOT NULL
impact          TEXT NOT NULL  -- 'high' | 'medium' | 'low'
score_delta     TEXT           -- '+8 visibility'
status          TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'applied' | 'dismissed'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.18 `core_web_vitals`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
metric          TEXT NOT NULL  -- 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'
label           TEXT NOT NULL
value           TEXT NOT NULL
score           TEXT NOT NULL  -- 'good' | 'needs_improvement' | 'poor'
target          TEXT
checked_at      DATE NOT NULL DEFAULT CURRENT_DATE
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `metric`

### 4.19 `traffic_data`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
month           TEXT NOT NULL  -- 'Jan', 'Feb', etc.
organic         INTEGER
direct          INTEGER
referral        INTEGER
social          INTEGER
year            INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(project_id, month, year)`
- **Index:** `project_id`

### 4.20 `traffic_sources`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name            TEXT NOT NULL  -- 'Organic Search' | 'Direct' | 'Referral' | 'Social' | 'Paid'
value           NUMERIC NOT NULL
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.21 `country_traffic`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
country         TEXT NOT NULL
country_code    TEXT NOT NULL
traffic_pct     NUMERIC NOT NULL
visits          TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.22 `device_breakdown`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name            TEXT NOT NULL  -- 'Desktop' | 'Mobile' | 'Tablet'
value           NUMERIC NOT NULL
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.23 `top_landing_pages`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
page_path       TEXT NOT NULL
traffic         INTEGER NOT NULL DEFAULT 0
change_pct      NUMERIC
keywords_count   INTEGER NOT NULL DEFAULT 0
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.24 `monthly_growth`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
month           TEXT NOT NULL
traffic_growth  NUMERIC
keyword_growth  NUMERIC
backlink_growth NUMERIC
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.25 `reports`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name            TEXT NOT NULL
report_type     TEXT NOT NULL  -- 'weekly' | 'monthly' | 'custom' | 'audit' | 'competitor'
template_id     UUID REFERENCES report_templates(id)
date_range      TEXT           -- '7' | '30' | '90' | 'custom'
format          TEXT NOT NULL DEFAULT 'pdf' -- 'pdf' | 'csv' | 'xlsx'
include_sections TEXT[]        -- ['kpis', 'traffic', 'keywords', 'backlinks', 'site_audit', 'competitors', 'ai_seo']
status          TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'generating' | 'ready' | 'failed'
file_url        TEXT           -- signed download URL
file_size       TEXT
generated_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `project_id`, `status`

### 4.26 `report_templates`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL
description     TEXT
icon            TEXT           -- 'FileText' | 'ShieldCheck' | 'Search' | 'Link2' | 'Users' | 'Sparkles'
sections        TEXT[]
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.27 `scheduled_reports`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name            TEXT NOT NULL
schedule_cron   TEXT NOT NULL  -- cron expression
recipients      TEXT[] NOT NULL
next_run_at     TIMESTAMPTZ
status          TEXT NOT NULL DEFAULT 'active' -- 'active' | 'paused'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 4.28 `notifications`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
project_id      UUID REFERENCES projects(id) ON DELETE CASCADE
type            TEXT NOT NULL  -- 'audit_complete' | 'new_backlink' | 'keyword_ranked' | 'keyword_lost' | 'ai_score_updated' | 'report_ready' | 'competitor_movement'
title           TEXT NOT NULL
description     TEXT
is_read         BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `user_id`, `is_read`

### 4.29 `notification_preferences`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
event_type      TEXT NOT NULL  -- 'site_audit_completed' | 'new_backlink_found' | 'keyword_ranking_changed' | 'lost_keyword_ranking' | 'weekly_report_ready' | 'ai_score_updated' | 'competitor_movement_detected'
email_enabled   BOOLEAN NOT NULL DEFAULT true
push_enabled    BOOLEAN NOT NULL DEFAULT false
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(user_id, event_type)`

### 4.30 `integrations`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
provider        TEXT NOT NULL  -- 'google_search_console' | 'google_analytics_4' | 'google_looker_studio' | 'slack' | 'zapier' | 'ahrefs_api'
is_connected    BOOLEAN NOT NULL DEFAULT false
description     TEXT
connection_data JSONB          -- OAuth tokens, webhook URLs, API keys (encrypted)
connected_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Unique:** `(user_id, provider)`

### 4.31 `api_keys`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
name            TEXT NOT NULL DEFAULT 'Production API Key'
key_prefix      TEXT NOT NULL  -- 'sk-prod-...' (last 4 chars visible)
key_hash        TEXT NOT NULL  -- hashed full key
webhook_url     TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
last_used_at    TIMESTAMPTZ
```

### 4.32 `activities`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
project_id      UUID REFERENCES projects(id) ON DELETE CASCADE
type            TEXT NOT NULL  -- 'ranked' | 'lost' | 'audit' | 'backlink' | 'ai'
title           TEXT NOT NULL
description     TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `user_id`, `project_id`, `created_at DESC`

### 4.33 `audit_logs`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
action          TEXT NOT NULL  -- 'project.create' | 'project.delete' | 'keyword.add' | 'audit.run' | 'backlink.add' | 'report.generate' | 'settings.update' | 'integration.connect' | 'auth.login' | 'auth.logout'
entity_type     TEXT
entity_id       UUID
old_value       JSONB
new_value       JSONB
ip_address      INET
metadata        JSONB
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `user_id`, `action`, `entity_type`, `created_at DESC`

### 4.34 `subscription_plans`

```text
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            TEXT NOT NULL  -- 'Free' | 'Pro' | 'Enterprise'
price           TEXT NOT NULL  -- '$0' | '$99' | custom
cycle           TEXT NOT NULL DEFAULT '/month'
max_projects    INTEGER
max_keywords    INTEGER
audit_frequency TEXT           -- 'weekly' | 'daily' | 'on_demand'
features        JSONB
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

## 5. Database Relationships

```text
users
 ├── has_many → projects
 ├── has_many → notifications
 ├── has_many → notification_preferences
 ├── has_many → integrations
 ├── has_many → api_keys
 ├── has_many → activities
 └── has_many → audit_logs

projects
 ├── belongs_to → users
 ├── has_many → keywords
 │    └── has_many → keyword_rankings
 ├── has_many → project_keywords
 ├── has_many → audits
 │    └── has_many → audit_issues
 ├── has_many → audit_history
 ├── has_many → backlinks
 ├── has_many → backlink_disavows
 ├── has_many → competitors
 │    └── has_many → competitor_keyword_positions
 ├── has_many → content_pages
 ├── has_many → ai_seo_metrics
 ├── has_many → ai_mentions_by_platform
 ├── has_many → ai_seo_trend
 ├── has_many → ai_recommendations
 ├── has_many → core_web_vitals
 ├── has_many → traffic_data
 ├── has_many → traffic_sources
 ├── has_many → country_traffic
 ├── has_many → device_breakdown
 ├── has_many → top_landing_pages
 ├── has_many → monthly_growth
 ├── has_many → reports
 │    └── belongs_to → report_templates
 └── has_many → scheduled_reports

report_templates
 └── has_many → reports
```

### ERD (textual)

```text
┌──────────┐       ┌──────────┐
│  users   │──1:N──│ projects │
└──────────┘       └────┬─────┘
                        │
          ┌─────────────┼──────────────┐
          │             │              │
    ┌─────┴────┐ ┌─────┴────┐ ┌──────┴──────┐
    │ keywords │ │  audits  │ │  backlinks  │
    └────┬─────┘ └────┬─────┘ └─────────────┘
         │             │
    ┌────┴────┐  ┌────┴──────┐
    │ rankings│  │   issues  │
    └─────────┘  └───────────┘

┌──────────┐
│ projects │──1:N──┌──────────────┐
└──────────┘       │ competitors   │
                   └──────┬───────┘
                          │
                   ┌──────┴──────────────┐
                   │ comp_keyword_positions│
                   └─────────────────────┘

┌──────────┐
│  users   │──1:N──┌─────────────────┐
└──────────┘       │ notifications   │
                   └─────────────────┘
```

---

## 6. API Specification

### Standard Headers

```text
Authorization: Bearer <access_token>
Content-Type: application/json
X-Project-Id: <project_uuid>   (for project-scoped endpoints)
```

---

### 6.1 Authentication

#### `POST /api/v1/auth/register`

**Purpose:** Create a new account
**Auth:** Public

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Jamie Doe",
  "company": "Acme Corporation"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jamie Doe",
      "role": "owner",
      "plan": "free"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Validation:**
- `email`: valid email format, required
- `password`: min 8 chars, at least 1 uppercase, 1 number
- `name`: min 2 chars, required

**Errors:** 400 (validation), 409 (email exists)

---

#### `POST /api/v1/auth/login`

**Purpose:** Authenticate user and return tokens
**Auth:** Public

**Request:**
```json
{
  "email": "jamie@acme.com",
  "password": "rankpulse"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jamie@acme.com",
      "name": "Jamie Doe",
      "role": "owner",
      "plan": "pro",
      "initials": "JD"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Validation:**
- `email`: valid email, required
- `password`: min 4 chars, required

**Errors:** 401 (invalid credentials), 403 (account suspended)

**DB Operations:** `SELECT users WHERE email`, verify password hash, create audit log entry

---

#### `POST /api/v1/auth/logout`

**Purpose:** Invalidate current session/token
**Auth:** Authenticated

**Response (200):**
```json
{ "success": true, "message": "Logged out successfully" }
```

**DB Operations:** Invalidate refresh token, create audit log

---

#### `POST /api/v1/auth/refresh`

**Purpose:** Exchange refresh token for new access token
**Auth:** Public (requires refresh token in body)

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors:** 401 (invalid/expired refresh token)

---

#### `POST /api/v1/auth/forgot-password`

**Purpose:** Send password reset email
**Auth:** Public

**Request:**
```json
{ "email": "user@example.com" }
```

**Response (200):**
```json
{ "success": true, "message": "Reset link sent if account exists" }
```

**DB Operations:** Generate reset token, store hash, send email

---

#### `POST /api/v1/auth/reset-password`

**Purpose:** Reset password using token
**Auth:** Public

**Request:**
```json
{
  "token": "reset-token-uuid",
  "password": "newpassword"
}
```

**Response (200):**
```json
{ "success": true, "message": "Password reset successfully" }
```

**Errors:** 400 (invalid token), 410 (token expired)

---

### 6.2 Dashboard

#### `GET /api/v1/dashboard/summary`

**Purpose:** Get all KPIs and summary data for the dashboard
**Auth:** Authenticated + project scope

**Query:**
```text
project_id=<uuid>&date_range=30
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "kpis": [
      { "id": "seo-score", "label": "SEO Score", "value": "82", "change": 4.2, "trend": [68,70,72,71,75,78,80,82], "accent": "primary" },
      { "id": "organic-traffic", "label": "Organic Traffic", "value": "248.5K", "change": 12.8, "trend": [120,145,160,175,190,210,230,248], "accent": "accent" }
    ],
    "trafficTrend": [
      { "month": "Jan", "organic": 142, "direct": 88, "referral": 34, "social": 22 }
    ],
    "trafficSources": [
      { "name": "Organic Search", "value": 48, "fill": "hsl(var(--chart-1))" }
    ],
    "countryTraffic": [
      { "country": "United States", "code": "US", "traffic": 38, "visits": "94.4K" }
    ],
    "deviceBreakdown": [
      { "name": "Desktop", "value": 58, "fill": "hsl(var(--chart-1))" }
    ],
    "monthlyGrowth": [
      { "month": "Feb", "traffic": 4, "keywords": 3, "backlinks": 2 }
    ],
    "topLandingPages": [
      { "page": "/blog/seo-guide-2025", "traffic": 18420, "change": 12.4, "keywords": 248 }
    ],
    "keywordDistribution": [
      { "name": "Top 3", "value": 1240, "fill": "hsl(var(--chart-1))" }
    ],
    "activities": [
      { "id": "1", "type": "ranked", "title": "New Keyword Ranked", "description": "\"seo audit tool\" reached position 3", "time": "12 min ago" }
    ],
    "coreWebVitals": [
      { "metric": "LCP", "label": "Largest Contentful Paint", "value": "1.8s", "score": "good", "target": "< 2.5s" }
    ],
    "aiSeoMetrics": [
      { "label": "AI Visibility Score", "value": 76, "change": 9.4, "accent": "primary" }
    ]
  }
}
```

**DB Operations:** Aggregate queries across keywords, backlinks, audits, ai_seo_metrics, core_web_vitals, activities, traffic_data

---

### 6.3 Projects

#### `GET /api/v1/projects`

**Purpose:** List all projects for the authenticated user
**Auth:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "acme-corp.com",
      "favicon": "A",
      "status": "active",
      "traffic": "248.5K",
      "keywords": 18420,
      "health": 94,
      "authority": 64,
      "lastAudit": "2h ago",
      "trend": [180,195,210,225,230,240,248]
    }
  ]
}
```

**DB Operations:** `SELECT projects WHERE user_id`, compute traffic/keywords/health/authority aggregates

---

#### `POST /api/v1/projects`

**Purpose:** Create a new SEO project
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "name": "acme-corp.com",
  "websiteUrl": "https://acme-corp.com",
  "industry": "saas",
  "targetCountry": "US",
  "trackingKeywords": ["seo audit tool", "keyword research"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "acme-corp.com",
    "status": "active"
  }
}
```

**Validation:**
- `name`: required, min 2 chars
- `websiteUrl`: valid URL, required
- `industry`: one of ['saas','ecommerce','finance','health','education','other']
- `targetCountry`: ISO country code
- `trackingKeywords`: array of strings, max 100

**DB Operations:** `INSERT projects`, `INSERT project_keywords` (bulk), enqueue initial data fetch job

**Errors:** 400 (validation), 409 (duplicate project URL)

---

#### `POST /api/v1/projects/import`

**Purpose:** Import project from Google Search Console or CSV file
**Auth:** Authenticated (owner/member)

**Request (GSC):**
```json
{
  "source": "gsc",
  "gscProperty": "https://acme-corp.com"
}
```

**Request (CSV):**
```text
Content-Type: multipart/form-data
file: <csv_file>
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "importJobId": "uuid",
    "status": "processing"
  }
}
```

**DB Operations:** `INSERT projects`, enqueue import job (GSC API fetch or CSV parse + bulk insert)

**Errors:** 400 (invalid CSV), 409 (project exists), 502 (GSC API error)

---

#### `GET /api/v1/projects/:id`

**Purpose:** Get detailed project metrics and traffic trend
**Auth:** Authenticated + owner check

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "acme-corp.com",
    "favicon": "A",
    "status": "active",
    "traffic": "248.5K",
    "keywords": 18420,
    "health": 94,
    "authority": 64,
    "lastAudit": "2h ago",
    "trend": [180,195,210,225,230,240,248],
    "trafficTrend": [{ "month": "Jan", "organic": 142 }]
  }
}
```

**DB Operations:** `SELECT projects`, `SELECT traffic_data`, aggregate keyword/backlink counts

---

### 6.4 Keywords

#### `GET /api/v1/keywords`

**Purpose:** List tracked keywords with full metrics
**Auth:** Authenticated + project scope

**Query:**
```text
project_id=<uuid>&page=1&limit=20&search=seo&intent=commercial&sortBy=rank&sortOrder=asc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "keyword": "seo audit tool",
      "volume": 18100,
      "difficulty": 68,
      "cpc": "$4.20",
      "rank": 3,
      "previousRank": 5,
      "url": "/tools/seo-audit",
      "intent": "Commercial",
      "serp": "Featured snippet",
      "trend30": [7,6,6,5,5,4,3]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 18420, "totalPages": 921 }
}
```

**DB Operations:** `SELECT keywords` + latest `keyword_rankings` JOIN, filter/sort/paginate

---

#### `GET /api/v1/keywords/summary`

**Purpose:** Get aggregate keyword statistics
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "label": "Tracked Keywords", "value": "18,420", "change": 6.4 },
    { "label": "Top 10 Rankings", "value": "4,720", "change": 8.1 },
    { "label": "Top 3 Rankings", "value": "1,240", "change": 12.3 },
    { "label": "New Keywords", "value": "342", "change": 15.6 },
    { "label": "Lost Keywords", "value": "128", "change": -4.2 },
    { "label": "Avg. Position", "value": "14.2", "change": 3.8 }
  ]
}
```

**DB Operations:** Aggregate counts from `keywords` + `keyword_rankings`

---

#### `POST /api/v1/keywords`

**Purpose:** Add keywords to track (bulk)
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "projectId": "uuid",
  "keywords": ["seo audit tool", "keyword research"],
  "bulkText": "backlink checker\ncore web vitals",
  "searchEngine": "google",
  "device": "desktop"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "added": 4,
    "duplicates": 0,
    "keywords": [{ "id": "uuid", "keyword": "seo audit tool" }]
  }
}
```

**Validation:**
- `keywords` or `bulkText`: at least one required
- `searchEngine`: one of ['google','bing','yahoo']
- `device`: one of ['desktop','mobile']
- Max 1000 keywords per request

**DB Operations:** `INSERT keywords` (bulk, skip duplicates), enqueue rank tracking job

**Errors:** 400 (no keywords), 409 (all duplicates), 422 (validation)

---

#### `GET /api/v1/keywords/:id`

**Purpose:** Get keyword detail with 30-day ranking history
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "keyword": "seo audit tool",
    "volume": 18100,
    "difficulty": 68,
    "cpc": "$4.20",
    "intent": "Commercial",
    "rank": 3,
    "previousRank": 5,
    "url": "/tools/seo-audit",
    "serpFeature": "Featured Snippet",
    "rankingHistory": [
      { "date": "2025-07-01", "rank": 7 },
      { "date": "2025-07-02", "rank": 6 }
    ]
  }
}
```

**DB Operations:** `SELECT keywords`, `SELECT keyword_rankings ORDER BY checked_at`

---

### 6.5 Site Audit

#### `GET /api/v1/audit/checks`

**Purpose:** List audit issues grouped by type
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "error",
      "title": "Broken Links",
      "description": "Links returning 4xx/5xx status codes",
      "count": 12,
      "pages": 9
    }
  ]
}
```

**DB Operations:** `SELECT audit_issues` from latest audit, grouped by type

---

#### `GET /api/v1/audit/history`

**Purpose:** Get audit history time-series
**Auth:** Authenticated + project scope

**Query:**
```text
project_id=<uuid>&days=7
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "date": "Jul 22", "errors": 28, "warnings": 92, "notices": 96 }
  ]
}
```

**DB Operations:** `SELECT audit_history ORDER BY audit_date`

---

#### `POST /api/v1/audit/run`

**Purpose:** Trigger a new site crawl/audit
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "projectId": "uuid",
  "crawlDepth": "standard",
  "maxPages": 500,
  "userAgent": "desktop"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "auditId": "uuid",
    "status": "pending"
  }
}
```

**Validation:**
- `crawlDepth`: one of ['quick','standard','full']
- `maxPages`: integer 1-10000
- `userAgent`: one of ['desktop','mobile','googlebot']

**DB Operations:** `INSERT audits`, enqueue crawl job

---

#### `GET /api/v1/audit/issues/:id`

**Purpose:** Get audit issue detail with affected pages and recommendations
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "error",
    "title": "Broken Links",
    "description": "Links returning 4xx/5xx status codes",
    "count": 12,
    "pages": 9,
    "severity": "critical",
    "affectedUrls": [
      { "url": "/blog/old-post", "statusCode": 404, "detail": "Page not found" }
    ],
    "recommendations": [
      "Fix or redirect broken internal links",
      "Update sitemap.xml",
      "Submit updated sitemap to GSC"
    ]
  }
}
```

**DB Operations:** `SELECT audit_issues` with `affected_urls` and `recommendations` JSONB

---

#### `PATCH /api/v1/audit/issues/:id`

**Purpose:** Mark an audit issue as fixed/ignored
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "status": "fixed"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { "id": "uuid", "status": "fixed", "fixedAt": "2025-09-15T10:00:00Z" }
}
```

**Validation:** `status`: one of ['open','fixed','ignored']

**DB Operations:** `UPDATE audit_issues SET status='fixed', fixed_at=now(), fixed_by=auth.uid()`

---

### 6.6 Backlinks

#### `GET /api/v1/backlinks`

**Purpose:** List backlinks with full attributes
**Auth:** Authenticated + project scope

**Query:**
```text
project_id=<uuid>&page=1&limit=20&search=forbes&type=follow&sortBy=firstSeen&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "source": "forbes.com",
      "authority": 94,
      "target": "/blog/seo-guide-2025",
      "anchor": "comprehensive SEO guide",
      "type": "Follow",
      "firstSeen": "Jul 14, 2025",
      "change": 8.4
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 52140, "totalPages": 2607 }
}
```

---

#### `GET /api/v1/backlinks/stats`

**Purpose:** Aggregate backlink statistics
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "label": "Total Backlinks", "value": "52,140", "change": 5.3 },
    { "label": "Referring Domains", "value": "3,240", "change": 8.7 },
    { "label": "New Backlinks", "value": "1,840", "change": 14.2 },
    { "label": "Lost Backlinks", "value": "420", "change": -6.1 }
  ]
}
```

---

#### `GET /api/v1/backlinks/growth`

**Purpose:** New vs lost backlinks over time
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "month": "Feb", "new": 1240, "lost": 280 }
  ]
}
```

---

#### `GET /api/v1/backlinks/anchor-distribution`

**Purpose:** Anchor text distribution
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "name": "Branded", "value": 42, "fill": "hsl(var(--chart-1))" }
  ]
}
```

---

#### `GET /api/v1/backlinks/follow-nofollow`

**Purpose:** Follow vs nofollow link ratio
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "name": "Follow", "value": 68, "fill": "hsl(var(--chart-1))" }
  ]
}
```

---

#### `GET /api/v1/backlinks/top-domains`

**Purpose:** Top referring domains by authority
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "domain": "forbes.com", "authority": 94, "backlinks": 1240, "change": 8.4 }
  ]
}
```

---

#### `POST /api/v1/backlinks`

**Purpose:** Manually add a backlink or disavow a link
**Auth:** Authenticated (owner/member)

**Request (add):**
```json
{
  "projectId": "uuid",
  "mode": "add",
  "sourceUrl": "https://forbes.com/article",
  "targetPage": "/blog/seo-guide",
  "linkType": "follow",
  "anchorText": "comprehensive SEO guide",
  "domainAuthority": 94,
  "notes": "Manually added"
}
```

**Request (disavow):**
```json
{
  "projectId": "uuid",
  "mode": "disavow",
  "sourceUrl": "https://spam-site.com/bad-link",
  "notes": "Toxic link"
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "isDisavowed": false } }
```

**Validation:**
- `sourceUrl`: valid URL, required
- `linkType`: one of ['follow','nofollow','ugc','sponsored']
- `domainAuthority`: integer 0-100, optional

**DB Operations:** `INSERT backlinks` (add mode) or `INSERT backlink_disavows` (disavow mode)

---

### 6.7 Competitors

#### `GET /api/v1/competitors`

**Purpose:** List tracked competitors with metrics
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Your Site",
      "isYou": true,
      "traffic": "248.5K",
      "keywords": "18,420",
      "backlinks": "52.1K",
      "authority": 64,
      "trafficValue": "$84.2K"
    }
  ]
}
```

---

#### `GET /api/v1/competitors/keyword-comparison`

**Purpose:** Per-keyword rank comparison across competitors
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "keyword": "seo audit tool", "you": 3, "compA": 1, "compB": 8, "compC": 5 }
  ]
}
```

---

#### `GET /api/v1/competitors/gap-analysis`

**Purpose:** Keyword gap analysis (unique/shared/missed)
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unique": 4820,
    "shared": 1240,
    "missed": 3180
  }
}
```

---

#### `POST /api/v1/competitors`

**Purpose:** Add a competitor to track
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "projectId": "uuid",
  "domain": "competitor-a.com",
  "displayName": "Competitor A",
  "targetCountry": "US",
  "trackingScope": "organic"
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "status": "processing" } }
```

**Validation:**
- `domain`: valid domain, required
- `trackingScope`: one of ['organic','paid_organic','all']

**DB Operations:** `INSERT competitors`, enqueue competitor data fetch job

---

### 6.8 Content

#### `GET /api/v1/content`

**Purpose:** List content pages with performance metrics
**Auth:** Authenticated + project scope

**Query:**
```text
project_id=<uuid>&page=1&limit=20&search=seo&type=blog&status=published&sortBy=traffic&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "The Complete SEO Guide for 2025",
      "url": "/blog/seo-guide-2025",
      "type": "Guide",
      "traffic": 18420,
      "keywords": 248,
      "score": 92,
      "status": "Published",
      "updated": "3d ago"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 4820, "totalPages": 241 }
}
```

---

#### `GET /api/v1/content/stats`

**Purpose:** Aggregate content statistics
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "label": "Total Pages", "value": "4,820", "change": 3.1 },
    { "label": "Top Performers", "value": "142", "change": 8.4 },
    { "label": "Needs Update", "value": "38", "change": -2.1 },
    { "label": "Avg. Content Score", "value": "78", "change": 4.6 }
  ]
}
```

---

#### `POST /api/v1/content`

**Purpose:** Create a content entry
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "projectId": "uuid",
  "title": "New SEO Guide",
  "urlSlug": "/blog/new-seo-guide",
  "contentType": "blog",
  "status": "draft",
  "primaryKeyword": "seo guide",
  "targetKeywords": ["seo guide", "seo tips"],
  "metaDescription": "A comprehensive guide to SEO in 2025."
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "status": "draft" } }
```

**Validation:**
- `title`: required, min 2 chars
- `urlSlug`: required, valid path format
- `contentType`: one of ['blog','landing','tool','guide']
- `status`: one of ['draft','published','needs_update','outdated']

**DB Operations:** `INSERT content_pages`

---

#### `GET /api/v1/content/:id`

**Purpose:** Get content detail with performance metrics and optimization tips
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "The Complete SEO Guide for 2025",
    "url": "/blog/seo-guide-2025",
    "traffic": 18420,
    "keywords": 248,
    "contentScore": 92,
    "contentType": "Guide",
    "optimizationTips": [
      "Add internal links to related pillar pages",
      "Update publish date for freshness signals",
      "Add FAQ schema for better SERP visibility",
      "Improve meta description for higher CTR"
    ]
  }
}
```

---

### 6.9 AI SEO

#### `GET /api/v1/ai-seo/metrics`

**Purpose:** Get all AI/GEO visibility scores
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "label": "AI Visibility Score",
      "value": 76,
      "change": 9.4,
      "target": 85,
      "description": "How often your site appears in AI-generated answers"
    }
  ]
}
```

---

#### `GET /api/v1/ai-seo/trend`

**Purpose:** AI visibility and mentions trend over time
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "week": "W1", "visibility": 58, "mentions": 820 }
  ]
}
```

---

#### `GET /api/v1/ai-seo/mentions-by-platform`

**Purpose:** AI mentions broken down by platform
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "platform": "ChatGPT", "mentions": 480, "share": 39 }
  ]
}
```

---

#### `GET /api/v1/ai-seo/recommendations`

**Purpose:** AI optimization recommendations
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "title": "Add FAQ schema to top 20 pages", "impact": "High", "score": "+8 visibility" }
  ]
}
```

---

### 6.10 Reports

#### `GET /api/v1/reports`

**Purpose:** List reports with status
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Weekly SEO Performance — Jul 28",
      "type": "Weekly",
      "date": "Jul 28, 2025",
      "status": "Ready",
      "size": "2.4 MB"
    }
  ]
}
```

---

#### `GET /api/v1/reports/templates`

**Purpose:** List available report templates
**Auth:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Executive Summary", "description": "High-level KPIs and traffic overview", "icon": "FileText" }
  ]
}
```

---

#### `POST /api/v1/reports/generate`

**Purpose:** Generate a new report
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "projectId": "uuid",
  "templateId": "uuid",
  "dateRange": "30",
  "format": "pdf",
  "includeSections": ["kpis","traffic","keywords","backlinks","site_audit","competitors","ai_seo"]
}
```

**Response (202):**
```json
{
  "success": true,
  "data": { "reportId": "uuid", "status": "generating" }
}
```

**Validation:**
- `format`: one of ['pdf','csv','xlsx']
- `dateRange`: one of ['7','30','90','custom']
- `includeSections`: array of section keys

**DB Operations:** `INSERT reports`, enqueue report generation job

---

#### `GET /api/v1/reports/:id/download`

**Purpose:** Download a generated report file
**Auth:** Authenticated + owner check

**Response:** Binary file stream (PDF/CSV/XLSX) or redirect to signed URL

**Errors:** 404 (report not found), 409 (report not ready)

---

#### `GET /api/v1/reports/scheduled`

**Purpose:** List scheduled reports
**Auth:** Authenticated + project scope

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Weekly SEO Performance",
      "schedule": "Every Monday 9:00 AM",
      "recipients": ["team@acme.com"],
      "nextRun": "Aug 4, 2025",
      "status": "active"
    }
  ]
}
```

---

#### `POST /api/v1/reports/schedule`

**Purpose:** Create a scheduled report
**Auth:** Authenticated (owner/member)

**Request:**
```json
{
  "projectId": "uuid",
  "name": "Weekly SEO Performance",
  "scheduleCron": "0 9 * * 1",
  "recipients": ["team@acme.com"],
  "templateId": "uuid",
  "format": "pdf"
}
```

**Response (201):**
```json
{ "success": true, "data": { "id": "uuid", "status": "active", "nextRunAt": "2025-08-04T09:00:00Z" } }
```

---

### 6.11 Export

#### `POST /api/v1/export`

**Purpose:** Export current view as PDF
**Auth:** Authenticated + project scope

**Request:**
```json
{
  "projectId": "uuid",
  "sections": ["executive_summary","kpis","traffic","keywords","backlinks","site_audit","competitors","ai_seo"],
  "format": "pdf"
}
```

**Response (202):**
```json
{
  "success": true,
  "data": { "exportId": "uuid", "status": "preparing" }
}
```

**DB Operations:** Enqueue PDF generation job, return job ID. Client polls or receives webhook.

---

### 6.12 Settings

#### `GET /api/v1/settings/profile`

**Purpose:** Get user profile
**Auth:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jamie Doe",
    "email": "jamie@acme.com",
    "company": "Acme Corporation",
    "role": "SEO Manager",
    "profileImage": null,
    "plan": "Pro Plan"
  }
}
```

---

#### `PUT /api/v1/settings/profile`

**Purpose:** Update user profile
**Auth:** Authenticated

**Request:**
```json
{
  "name": "Jamie Doe",
  "email": "jamie@newemail.com",
  "company": "Acme Corporation",
  "role": "SEO Director"
}
```

**Response (200):**
```json
{ "success": true, "data": { "id": "uuid", "name": "Jamie Doe" } }
```

**Validation:** `email`: valid email, unique (excluding current user)

---

#### `GET /api/v1/settings/notifications`

**Purpose:** Get notification preferences
**Auth:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "label": "Site audit completed", "email": true, "push": true }
  ]
}
```

---

#### `PUT /api/v1/settings/notifications`

**Purpose:** Update notification preferences
**Auth:** Authenticated

**Request:**
```json
{
  "preferences": [
    { "eventType": "site_audit_completed", "email": true, "push": false }
  ]
}
```

---

#### `GET /api/v1/settings/integrations`

**Purpose:** List available integrations and connection status
**Auth:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Google Search Console", "connected": true, "description": "Search performance and indexing data" }
  ]
}
```

---

#### `POST /api/v1/settings/integrations/:provider/connect`

**Purpose:** Initiate OAuth connection for an integration
**Auth:** Authenticated (owner)

**Response (200):**
```json
{
  "success": true,
  "data": { "oauthUrl": "https://accounts.google.com/o/oauth2/auth?..." }
}
```

---

#### `DELETE /api/v1/settings/integrations/:provider`

**Purpose:** Disconnect an integration
**Auth:** Authenticated (owner)

---

#### `GET /api/v1/settings/billing`

**Purpose:** Get billing/plan info
**Auth:** Authenticated

**Response (200):**
```json
{
  "success": true,
  "data": {
    "plan": "Pro Plan",
    "price": "$99",
    "cycle": "/month",
    "projects": "10 projects",
    "keywords": "5,000 tracked keywords",
    "audits": "Weekly site audits",
    "renewal": "Aug 15, 2025"
  }
}
```

---

#### `GET /api/v1/settings/api-keys`

**Purpose:** List API keys (masked)
**Auth:** Authenticated (owner)

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Production API Key", "keyPrefix": "sk-prod-••••3f2a", "webhookUrl": "https://acme.com/webhooks/rankpulse" }
  ]
}
```

---

#### `POST /api/v1/settings/api-keys`

**Purpose:** Generate a new API key
**Auth:** Authenticated (owner)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "sk-prod-abc123fullkeyhere",
    "name": "Production API Key"
  }
}
```

**Note:** Full key is only shown once. Store hash in DB.

---

### 6.13 Notifications

#### `GET /api/v1/notifications`

**Purpose:** List user notifications
**Auth:** Authenticated

**Query:**
```text
page=1&limit=20&unread_only=false
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "1", "title": "Site audit complete", "description": "94% health score", "time": "12m", "isRead": false }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
}
```

---

#### `PATCH /api/v1/notifications/:id`

**Purpose:** Mark notification as read
**Auth:** Authenticated

**Request:**
```json
{ "isRead": true }
```

---

### 6.14 Activities

#### `GET /api/v1/activities`

**Purpose:** List recent activities
**Auth:** Authenticated + project scope

**Query:**
```text
project_id=<uuid>&limit=10&type=ranked
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "1", "type": "ranked", "title": "New Keyword Ranked", "description": "\"seo audit tool\" reached position 3", "time": "12 min ago" }
  ]
}
```

---

## 7. API Inventory Table

| Method | Endpoint | Purpose | Auth | Role | DB Tables |
|---|---|---|---|---|---|
| POST | /auth/register | Create account | Public | — | users |
| POST | /auth/login | Sign in | Public | — | users, audit_logs |
| POST | /auth/logout | Sign out | Auth | Any | audit_logs |
| POST | /auth/refresh | Refresh token | Public | — | — |
| POST | /auth/forgot-password | Request reset | Public | — | users |
| POST | /auth/reset-password | Reset password | Public | — | users |
| GET | /dashboard/summary | Dashboard KPIs | Auth | Any | keywords, backlinks, audits, ai_seo_metrics, core_web_vitals, activities, traffic_data |
| GET | /projects | List projects | Auth | Any | projects |
| POST | /projects | Create project | Auth | Owner/Member | projects, project_keywords |
| POST | /projects/import | Import project | Auth | Owner/Member | projects |
| GET | /projects/:id | Project detail | Auth | Any | projects, traffic_data |
| GET | /keywords | List keywords | Auth | Any | keywords, keyword_rankings |
| GET | /keywords/summary | Keyword stats | Auth | Any | keywords, keyword_rankings |
| POST | /keywords | Add keywords | Auth | Owner/Member | keywords, project_keywords |
| GET | /keywords/:id | Keyword detail | Auth | Any | keywords, keyword_rankings |
| GET | /audit/checks | Audit issues | Auth | Any | audit_issues |
| GET | /audit/history | Audit history | Auth | Any | audit_history |
| POST | /audit/run | Run audit | Auth | Owner/Member | audits |
| GET | /audit/issues/:id | Issue detail | Auth | Any | audit_issues |
| PATCH | /audit/issues/:id | Mark fixed | Auth | Owner/Member | audit_issues |
| GET | /backlinks | List backlinks | Auth | Any | backlinks |
| GET | /backlinks/stats | Backlink stats | Auth | Any | backlinks |
| GET | /backlinks/growth | Growth chart | Auth | Any | backlinks |
| GET | /backlinks/anchor-distribution | Anchor distribution | Auth | Any | backlinks |
| GET | /backlinks/follow-nofollow | Link ratio | Auth | Any | backlinks |
| GET | /backlinks/top-domains | Top domains | Auth | Any | backlinks |
| POST | /backlinks | Add/disavow | Auth | Owner/Member | backlinks, backlink_disavows |
| GET | /competitors | List competitors | Auth | Any | competitors |
| GET | /competitors/keyword-comparison | Rank comparison | Auth | Any | competitor_keyword_positions |
| GET | /competitors/gap-analysis | Gap analysis | Auth | Any | competitor_keyword_positions |
| POST | /competitors | Add competitor | Auth | Owner/Member | competitors |
| GET | /content | List content | Auth | Any | content_pages |
| GET | /content/stats | Content stats | Auth | Any | content_pages |
| POST | /content | Create content | Auth | Owner/Member | content_pages |
| GET | /content/:id | Content detail | Auth | Any | content_pages |
| GET | /ai-seo/metrics | AI scores | Auth | Any | ai_seo_metrics |
| GET | /ai-seo/trend | AI trend | Auth | Any | ai_seo_trend |
| GET | /ai-seo/mentions-by-platform | Platform mentions | Auth | Any | ai_mentions_by_platform |
| GET | /ai-seo/recommendations | AI recommendations | Auth | Any | ai_recommendations |
| GET | /reports | List reports | Auth | Any | reports |
| GET | /reports/templates | List templates | Auth | Any | report_templates |
| POST | /reports/generate | Generate report | Auth | Owner/Member | reports |
| GET | /reports/:id/download | Download report | Auth | Any | reports |
| GET | /reports/scheduled | Scheduled reports | Auth | Any | scheduled_reports |
| POST | /reports/schedule | Schedule report | Auth | Owner/Member | scheduled_reports |
| POST | /export | Export PDF | Auth | Any | reports |
| GET | /settings/profile | Get profile | Auth | Any | users |
| PUT | /settings/profile | Update profile | Auth | Any | users |
| GET | /settings/notifications | Get preferences | Auth | Any | notification_preferences |
| PUT | /settings/notifications | Update preferences | Auth | Any | notification_preferences |
| GET | /settings/integrations | List integrations | Auth | Any | integrations |
| POST | /settings/integrations/:provider/connect | Connect | Auth | Owner | integrations |
| DELETE | /settings/integrations/:provider | Disconnect | Auth | Owner | integrations |
| GET | /settings/billing | Billing info | Auth | Any | subscription_plans |
| GET | /settings/api-keys | List keys | Auth | Owner | api_keys |
| POST | /settings/api-keys | Generate key | Auth | Owner | api_keys |
| GET | /notifications | List notifications | Auth | Any | notifications |
| PATCH | /notifications/:id | Mark read | Auth | Any | notifications |
| GET | /activities | List activities | Auth | Any | activities |

---

## 8. Frontend Mock Data Mapping

All mock data currently lives in `src/lib/seo-data.ts`. Below is the complete mapping from each mock dataset to its backend equivalent.

### 8.1 `kpis` → Dashboard KPI cards

**Frontend mock:**
```javascript
export const kpis = [
  { id: 'seo-score', label: 'SEO Score', value: '82', change: 4.2, trend: [68,70,72,71,75,78,80,82], accent: 'primary' },
  { id: 'organic-traffic', label: 'Organic Traffic', value: '248.5K', change: 12.8, trend: [120,145,160,175,190,210,230,248], accent: 'accent' },
  // ... 8 total
];
```

**Backend entity:** Computed aggregate from `keywords`, `backlinks`, `projects`, `traffic_data`

**API:** `GET /dashboard/summary` → `data.kpis[]`

**Transformation:** Backend computes each KPI:
- SEO Score: average of `projects.health_score`
- Organic Traffic: sum of `traffic_data.organic` for current month
- Organic Keywords: count of `keywords` where rank ≤ 100
- Domain Authority: `projects.authority_score`
- Referring Domains: count distinct `backlinks.source_domain`
- Backlinks: count of `backlinks`
- Indexed Pages: from GSC integration or crawl count
- Site Health: `projects.health_score`
- `trend` array: last 8 data points from time-series
- `change`: percentage difference from previous period

---

### 8.2 `trafficTrend` → Traffic chart

**Frontend mock:**
```javascript
export const trafficTrend = [
  { month: 'Jan', organic: 142, direct: 88, referral: 34, social: 22 }
];
```

**Backend entity:** `traffic_data` table

**API:** `GET /dashboard/summary` → `data.trafficTrend[]`

---

### 8.3 `keywordDistribution` → Keyword distribution pie

**Frontend mock:**
```javascript
export const keywordDistribution = [
  { name: 'Top 3', value: 1240, fill: 'hsl(var(--chart-1))' }
];
```

**Backend:** `SELECT count(*) FROM keywords WHERE rank <= 3` grouped by rank bucket

---

### 8.4 `trafficSources` → Traffic sources pie

**Frontend mock:**
```javascript
export const trafficSources = [
  { name: 'Organic Search', value: 48, fill: 'hsl(var(--chart-1))' }
];
```

**Backend entity:** `traffic_sources` table

---

### 8.5 `countryTraffic` → Country traffic table

**Frontend mock:**
```javascript
export const countryTraffic = [
  { country: 'United States', code: 'US', traffic: 38, visits: '94.4K' }
];
```

**Backend entity:** `country_traffic` table (from GSC/GA4 integration)

---

### 8.6 `deviceBreakdown` → Device pie

**Frontend mock:**
```javascript
export const deviceBreakdown = [
  { name: 'Desktop', value: 58, fill: 'hsl(var(--chart-1))' }
];
```

**Backend entity:** `device_breakdown` table

---

### 8.7 `monthlyGrowth` → Growth bar chart

**Frontend mock:**
```javascript
export const monthlyGrowth = [
  { month: 'Feb', traffic: 4, keywords: 3, backlinks: 2 }
];
```

**Backend entity:** `monthly_growth` table

---

### 8.8 `topLandingPages` → Top pages table

**Frontend mock:**
```javascript
export const topLandingPages = [
  { page: '/blog/seo-guide-2025', traffic: 18420, change: 12.4, keywords: 248 }
];
```

**Backend entity:** `top_landing_pages` table (from GSC/GA4)

---

### 8.9 `keywordTable` → Keyword mini table (dashboard)

**Frontend mock:**
```javascript
export const keywordTable = [
  { keyword: 'seo audit tool', volume: 18100, difficulty: 68, cpc: '$4.20', rank: 3, previousRank: 5, url: '/tools/seo-audit' }
];
```

**Backend entity:** `keywords` + latest `keyword_rankings`

---

### 8.10 `auditIssues` → Audit issue pills (dashboard)

**Frontend mock:**
```javascript
export const auditIssues = [
  { type: 'error', title: 'Broken Links', count: 12 }
];
```

**Backend entity:** `audit_issues` from latest audit, grouped by type

---

### 8.11 `backlinkStats` → Backlink mini stats (dashboard)

**Frontend mock:**
```javascript
export const backlinkStats = [
  { label: 'Total Backlinks', value: '52,140', change: 5.3 }
];
```

**Backend:** Aggregate from `backlinks` table

---

### 8.12 `competitors` → Competitor mini cards (dashboard)

**Frontend mock:**
```javascript
export const competitors = [
  { name: 'Your Site', isYou: true, traffic: '248.5K', keywords: '18,420', backlinks: '52.1K', authority: 64, trafficValue: '$84.2K' }
];
```

**Backend entity:** `competitors` table

---

### 8.13 `aiSeoMetrics` → AI SEO mini cards (dashboard)

**Frontend mock:**
```javascript
export const aiSeoMetrics = [
  { label: 'AI Visibility Score', value: 76, change: 9.4, accent: 'primary' }
];
```

**Backend entity:** `ai_seo_metrics` table

---

### 8.14 `coreWebVitals` → Core Web Vitals cards

**Frontend mock:**
```javascript
export const coreWebVitals = [
  { metric: 'LCP', label: 'Largest Contentful Paint', value: '1.8s', score: 'good', target: '< 2.5s' }
];
```

**Backend entity:** `core_web_vitals` table (from CrUX API)

---

### 8.15 `recentActivities` → Activity timeline

**Frontend mock:**
```javascript
export const recentActivities = [
  { id: '1', type: 'ranked', title: 'New Keyword Ranked', description: '"seo audit tool" reached position 3', time: '12 min ago' }
];
```

**Backend entity:** `activities` table

---

### 8.16 `projectList` → Projects screen

**Frontend mock:**
```javascript
export const projectList = [
  { name: 'acme-corp.com', favicon: 'A', status: 'active', traffic: '248.5K', keywords: 18420, health: 94, authority: 64, lastAudit: '2h ago', trend: [180,195,210,225,230,240,248] }
];
```

**Backend entity:** `projects` table with computed aggregates

---

### 8.17 `keywordFullTable` → Keyword Rankings screen

**Frontend mock:**
```javascript
export const keywordFullTable = [
  { keyword: 'seo audit tool', volume: 18100, difficulty: 68, cpc: '$4.20', rank: 3, previousRank: 5, url: '/tools/seo-audit', intent: 'Commercial', serp: 'Featured snippet', trend30: [7,6,6,5,5,4,3] }
];
```

**Backend entity:** `keywords` + `keyword_rankings` (30-day history for `trend30`)

---

### 8.18 `keywordSummary` → Keyword Rankings stats

**Frontend mock:**
```javascript
export const keywordSummary = [
  { label: 'Tracked Keywords', value: '18,420', change: 6.4 }
];
```

**Backend:** Aggregate from `keywords` + `keyword_rankings`

---

### 8.19 `auditChecks` → Site Audit screen

**Frontend mock:**
```javascript
export const auditChecks = [
  { title: 'Broken Links', type: 'error', count: 12, pages: 9, description: 'Links returning 4xx/5xx status codes' }
];
```

**Backend entity:** `audit_issues` from latest audit

---

### 8.20 `auditHistory` → Audit history chart

**Frontend mock:**
```javascript
export const auditHistory = [
  { date: 'Jul 22', errors: 28, warnings: 92, notices: 96 }
];
```

**Backend entity:** `audit_history` table

---

### 8.21 `backlinkTable` → Backlinks screen table

**Frontend mock:**
```javascript
export const backlinkTable = [
  { source: 'forbes.com', authority: 94, target: '/blog/seo-guide-2025', anchor: 'comprehensive SEO guide', type: 'Follow', firstSeen: 'Jul 14, 2025', change: 8.4 }
];
```

**Backend entity:** `backlinks` table

---

### 8.22 `backlinkGrowth` → New vs lost chart

**Frontend mock:**
```javascript
export const backlinkGrowth = [
  { month: 'Feb', new: 1240, lost: 280 }
];
```

**Backend:** Computed from `backlinks` grouped by `first_seen_at` month vs lost detection

---

### 8.23 `anchorTextDistribution` → Anchor distribution

**Frontend mock:**
```javascript
export const anchorTextDistribution = [
  { name: 'Branded', value: 42, fill: 'hsl(var(--chart-1))' }
];
```

**Backend:** `SELECT anchor_text, count(*) FROM backlinks GROUP BY category`

---

### 8.24 `followNofollow` → Follow vs nofollow pie

**Frontend mock:**
```javascript
export const followNofollow = [
  { name: 'Follow', value: 68, fill: 'hsl(var(--chart-1))' }
];
```

**Backend:** `SELECT link_type, count(*) FROM backlinks GROUP BY link_type`

---

### 8.25 `topReferringDomains` → Top domains card

**Frontend mock:**
```javascript
export const topReferringDomains = [
  { domain: 'forbes.com', authority: 94, backlinks: 1240, change: 8.4 }
];
```

**Backend:** `SELECT source_domain, max(domain_authority), count(*) FROM backlinks GROUP BY source_domain ORDER BY count DESC LIMIT 5`

---

### 8.26 `competitorKeywords` → Competitor keyword chart

**Frontend mock:**
```javascript
export const competitorKeywords = [
  { keyword: 'seo audit tool', you: 3, compA: 1, compB: 8, compC: 5 }
];
```

**Backend entity:** `competitor_keyword_positions` table

---

### 8.27 `competitorGap` → Gap analysis

**Frontend mock:**
```javascript
export const competitorGap = { unique: 4820, shared: 1240, missed: 3180 };
```

**Backend:** Computed from set difference of keyword sets

---

### 8.28 `contentList` → Content screen table

**Frontend mock:**
```javascript
export const contentList = [
  { title: 'The Complete SEO Guide for 2025', url: '/blog/seo-guide-2025', type: 'Guide', traffic: 18420, keywords: 248, score: 92, status: 'Published', updated: '3d ago' }
];
```

**Backend entity:** `content_pages` table

---

### 8.29 `contentStats` → Content stats

**Frontend mock:**
```javascript
export const contentStats = [
  { label: 'Total Pages', value: '4,820', change: 3.1 }
];
```

**Backend:** Aggregate from `content_pages`

---

### 8.30 `aiSeoFullMetrics` → AI SEO screen metrics

**Frontend mock:**
```javascript
export const aiSeoFullMetrics = [
  { label: 'AI Visibility Score', value: 76, change: 9.4, target: 85, description: 'How often your site appears in AI-generated answers' }
];
```

**Backend entity:** `ai_seo_metrics` table

---

### 8.31 `aiMentionsByPlatform` → Platform mentions

**Frontend mock:**
```javascript
export const aiMentionsByPlatform = [
  { platform: 'ChatGPT', mentions: 480, share: 39 }
];
```

**Backend entity:** `ai_mentions_by_platform` table

---

### 8.32 `aiTrend` → AI visibility trend

**Frontend mock:**
```javascript
export const aiTrend = [
  { week: 'W1', visibility: 58, mentions: 820 }
];
```

**Backend entity:** `ai_seo_trend` table

---

### 8.33 `aiRecommendations` → AI recommendations

**Frontend mock:**
```javascript
export const aiRecommendations = [
  { title: 'Add FAQ schema to top 20 pages', impact: 'High', score: '+8 visibility' }
];
```

**Backend entity:** `ai_recommendations` table (generated by AI scoring job)

---

### 8.34 `reportList` → Reports screen

**Frontend mock:**
```javascript
export const reportList = [
  { name: 'Weekly SEO Performance — Jul 28', type: 'Weekly', date: 'Jul 28, 2025', status: 'Ready', size: '2.4 MB' }
];
```

**Backend entity:** `reports` table

---

### 8.35 `reportTemplates` → Report templates

**Frontend mock:**
```javascript
export const reportTemplates = [
  { name: 'Executive Summary', description: 'High-level KPIs and traffic overview', icon: 'FileText' }
];
```

**Backend entity:** `report_templates` table (seed data)

---

### 8.36 `settingsSections` → Settings sidebar

**Frontend mock:**
```javascript
export const settingsSections = [
  { id: 'profile', label: 'Profile', icon: 'User' }
];
```

**Backend:** Static config (no DB needed) — frontend-only

---

### 8.37 `integrations` → Integrations card

**Frontend mock:**
```javascript
export const integrations = [
  { name: 'Google Search Console', connected: true, description: 'Search performance and indexing data' }
];
```

**Backend entity:** `integrations` table

---

### 8.38 `notificationSettings` → Notification toggles

**Frontend mock:**
```javascript
export const notificationSettings = [
  { label: 'Site audit completed', email: true, push: true }
];
```

**Backend entity:** `notification_preferences` table

---

### 8.39 `planInfo` → Billing card

**Frontend mock:**
```javascript
export const planInfo = { name: 'Pro Plan', price: '$99', cycle: '/month', projects: '10 projects', keywords: '5,000 tracked keywords', audits: 'Weekly site audits', renewal: 'Aug 15, 2025' };
```

**Backend entity:** `subscription_plans` table + billing provider (Stripe)

---

### 8.40 Scheduled reports (inline in reports-screen.tsx)

**Frontend mock (inline):**
```javascript
const scheduledReports = [
  { name: 'Weekly SEO Performance', schedule: 'Every Monday 9:00 AM', recipients: 'team@acme.com', nextRun: 'Aug 4, 2025' }
];
```

**Backend entity:** `scheduled_reports` table

---

## 9. Forms & User Actions

### 9.1 Login Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Email | email input | YES | Valid email format | `POST /auth/login` |
| Password | password input | YES | Min 4 chars | `POST /auth/login` |
| Remember me | checkbox | NO | — | Token expiry adjustment |

**After success:** Return user + tokens, redirect to Dashboard
**Errors:** 401 invalid credentials, 403 account suspended

---

### 9.2 New Project Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Project Name | text | YES | Min 2 chars | `POST /projects` |
| Website URL | text (url) | YES | Valid URL | `POST /projects` |
| Industry | select | NO | Enum: saas/ecommerce/finance/health/education | `POST /projects` |
| Target Country | select | NO | ISO country code | `POST /projects` |
| Tracking Keywords | text (comma-sep) | NO | Max 100 keywords | `POST /projects` → `POST /keywords` |

**After success:** Create project, enqueue data fetch, navigate to Projects
**Errors:** 400 validation, 409 duplicate URL

---

### 9.3 Import Project Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Source | card select | YES | gsc / csv | — |
| CSV File | file upload | YES (if csv) | .csv, max 10MB | `POST /projects/import` (multipart) |
| GSC Property | OAuth redirect | YES (if gsc) | Valid GSC property | `POST /projects/import` |

**After success:** Return job ID, poll for completion
**Errors:** 400 invalid CSV, 502 GSC API error

---

### 9.4 Add Keyword Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Keywords | dynamic text list | NO* | Array of strings | `POST /keywords` |
| Bulk paste | textarea | NO* | One per line | `POST /keywords` |
| Search Engine | select | NO | google/bing/yahoo (default: google) | `POST /keywords` |
| Device | select | NO | desktop/mobile (default: desktop) | `POST /keywords` |

*At least one of keywords or bulkText required.

**After success:** Add keywords, enqueue rank tracking, refresh keyword list
**Errors:** 400 no keywords, 422 validation

---

### 9.5 Run Audit Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Crawl Depth | select | NO | quick/standard/full (default: standard) | `POST /audit/run` |
| Max Pages | number | NO | 1-10000 (default: 500) | `POST /audit/run` |
| User Agent | select | NO | desktop/mobile/googlebot (default: desktop) | `POST /audit/run` |

**After success:** Return audit ID, show progress animation, poll for completion
**Errors:** 429 rate limit (one audit per project per hour)

---

### 9.6 Add Backlink Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Mode | toggle | NO | add/disavow (default: add) | — |
| Source URL | text (url) | YES | Valid URL | `POST /backlinks` |
| Target Page | text | YES | Valid path | `POST /backlinks` |
| Link Type | select | NO | follow/nofollow/ugc/sponsored | `POST /backlinks` |
| Anchor Text | text | NO | — | `POST /backlinks` |
| Domain Authority | number | NO | 0-100 | `POST /backlinks` |
| Notes | textarea | NO | — | `POST /backlinks` |

---

### 9.7 Add Competitor Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Competitor Domain | text | YES | Valid domain | `POST /competitors` |
| Display Name | text | NO | — | `POST /competitors` |
| Target Country | select | NO | ISO code (default: US) | `POST /competitors` |
| Tracking Scope | select | NO | organic/paid_organic/all | `POST /competitors` |

---

### 9.8 New Content Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Content Title | text | YES | Min 2 chars | `POST /content` |
| URL Slug | text | YES | Valid path format | `POST /content` |
| Content Type | select | NO | blog/landing/tool/guide | `POST /content` |
| Status | select | NO | draft/published/needs_update/outdated | `POST /content` |
| Primary Keyword | text | NO | — | `POST /content` |
| Target Keywords | text (comma-sep) | NO | Array | `POST /content` |
| Meta Description | textarea | NO | Max 160 chars | `POST /content` |

---

### 9.9 Generate Report Form

| Field | Type | Required | Validation | Backend |
|---|---|---|---|---|
| Report Template | card select | YES | Template ID | `POST /reports/generate` |
| Date Range | select | NO | 7/30/90/custom | `POST /reports/generate` |
| Format | select | NO | pdf/csv/xlsx | `POST /reports/generate` |
| Include Sections | checkboxes | NO | 7 sections, all default | `POST /reports/generate` |

---

### 9.10 Export PDF Action

**Trigger:** Export button on multiple screens
**Backend:** `POST /export` with project_id + sections
**After success:** Poll for completion, return download URL
**No form fields** — 8 fixed sections included

---

### 9.11 Mark Audit Issue Fixed

**Trigger:** "Mark as Fixed" button in audit-issue modal
**Backend:** `PATCH /audit/issues/:id` with `{ status: 'fixed' }`
**After success:** Update issue status, create activity entry, refresh audit checks

---

### 9.12 Settings Actions

| Action | Backend |
|---|---|
| Save Profile | `PUT /settings/profile` |
| Toggle Notification | `PUT /settings/notifications` |
| Connect Integration | `POST /settings/integrations/:provider/connect` → OAuth redirect |
| Disconnect Integration | `DELETE /settings/integrations/:provider` |
| Change/Upgrade Plan | Stripe checkout session |
| Generate API Key | `POST /settings/api-keys` |
| Toggle Theme | Frontend-only (localStorage) |

---

## 10. Authentication & Authorization

### Implementation: Supabase Auth (email/password)

- **Registration:** Email + password, email confirmation OFF (per Bolt convention)
- **Login:** Email + password → JWT access token + refresh token
- **Logout:** Invalidate refresh token, clear client session
- **Password hashing:** Supabase Auth handles bcrypt-style hashing
- **Token expiration:** Access token 1 hour, refresh token 30 days
- **Session management:** `onAuthStateChange` with deadlock guard
- **Forgot/Reset password:** Supabase Auth `resetPasswordForEmail`
- **Email verification:** OFF (per Bolt convention)

### Authorization

- **RLS enabled on every table**
- **Ownership check:** `auth.uid() = user_id` on all user-scoped tables
- **Project-scoped data:** All tables with `project_id` must verify `project.user_id = auth.uid()`
- **Role checks:** `role` column in `users` table checked via RLS policy or edge function

### RLS Policy Template (per table)

```sql
-- SELECT
CREATE POLICY "select_own_<table>" ON <table> FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- For project-scoped tables:
CREATE POLICY "select_own_<table>" ON <table> FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = <table>.project_id AND projects.user_id = auth.uid())
  );

-- INSERT
CREATE POLICY "insert_own_<table>" ON <table> FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "update_own_<table>" ON <table> FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "delete_own_<table>" ON <table> FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
```

---

## 11. Security Requirements

### Authentication Security
- Password hashing via Supabase Auth (bcrypt)
- JWT tokens with short expiry (1 hour access, 30 day refresh)
- Refresh token rotation on each use
- Rate limiting on auth endpoints (5 attempts per minute per IP)

### Authorization
- RLS on all tables — no exceptions
- Project ownership verification for all project-scoped queries
- Role-based checks for admin operations (billing, integrations, API keys)

### Input Validation
- All API inputs validated server-side using Zod schemas
- SQL injection prevention via parameterized queries (Supabase client)
- No raw SQL from user input

### XSS Protection
- React escapes all rendered content by default
- No `dangerouslySetInnerHTML` usage in frontend
- Content-Type headers enforced on all API responses

### CSRF
- JWT-based auth (not cookies) — CSRF not applicable for API calls
- OAuth redirects use state parameter

### Rate Limiting
- Auth endpoints: 5 req/min per IP
- API endpoints: 100 req/min per user
- Audit run: 1 per project per hour
- Report generation: 5 per hour per user
- Export: 10 per hour per user

### File Upload Security
- CSV import: validate `.csv` extension, max 10MB
- MIME type verification server-side
- File content sanitized before parsing
- No executable file types allowed

### CORS
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
```

### Secrets Management
- All secrets in environment variables (never in code)
- API keys stored hashed in database
- OAuth tokens encrypted at rest
- `.env` file never committed to git

### Sensitive Data Protection
- Password hashes never returned in API responses
- API keys returned only once on creation (hashed thereafter)
- OAuth tokens encrypted in `integrations.connection_data`
- PII (email, name) only accessible to the owning user

---

## 12. File & Image Uploads

### CSV Import (Projects)

| Property | Value |
|---|---|
| Accepted types | `.csv` |
| Max size | 10 MB |
| Upload API | `POST /api/v1/projects/import` (multipart/form-data) |
| Processing | Server-side CSV parse → bulk project/keyword insert |
| Validation | Header row validation, row count limit (max 10,000 rows) |
| Storage | Temporary — file discarded after processing |

### Profile Image Upload (Implied)

| Property | Value |
|---|---|
| Accepted types | `.jpg`, `.png`, `.webp` |
| Max size | 5 MB |
| Upload API | `PUT /api/v1/settings/profile` (multipart or base64) |
| Storage | Supabase Storage bucket `avatars` |
| Access | Public read, owner write |

### Report Downloads

| Property | Value |
|---|---|
| Formats | PDF, CSV, XLSX |
| Generation | Server-side job (edge function or background worker) |
| Storage | Supabase Storage bucket `reports` with signed URLs |
| URL expiry | 24 hours |
| Download API | `GET /api/v1/reports/:id/download` → redirect to signed URL |

---

## 13. Real-Time Features

The frontend does not currently implement real-time features (no WebSocket, SSE, or polling). However, several features would benefit from real-time updates:

| Feature | Recommended Method | Reason |
|---|---|---|
| Notification badge (topbar bell) | Supabase Realtime (postgres changes) | Update unread count instantly |
| Audit progress (run-audit modal) | Polling (every 2s) or SSE | Show crawl progress steps |
| Report generation status | Polling (every 3s) | Check when report is ready |
| Keyword rank changes | Supabase Realtime | Live ranking updates |
| Dashboard KPI refresh | Polling (every 5 min) | Periodic data refresh |

### Supabase Realtime Events

```text
notifications.insert      → new notification for user
audit.status_changed      → audit completed/failed
reports.status_changed     → report ready/failed
keyword_rankings.insert   → new ranking data
```

---

## 14. GPS / Location Features

**Not applicable.** The frontend has no GPS, maps, geofencing, or location tracking features.

---

## 15. Analytics & Dashboards

### Dashboard KPIs (8 metrics)

| KPI | Source Tables | Calculation |
|---|---|---|
| SEO Score | projects.health_score | Average health_score across all projects |
| Organic Traffic | traffic_data | Sum of organic for current month |
| Organic Keywords | keywords | Count where rank ≤ 100 |
| Domain Authority | projects.authority_score | Average authority_score |
| Referring Domains | backlinks | Count distinct source_domain |
| Backlinks | backlinks | Total count |
| Indexed Pages | top_landing_pages or GSC | Count from integration |
| Site Health | projects.health_score | Latest health_score |

### Traffic Trend Chart
- **Source:** `traffic_data`
- **Grouping:** By month, split into organic/direct/referral/social
- **Range:** Last 8 months

### Keyword Distribution Pie
- **Source:** `keywords` + latest `keyword_rankings`
- **Buckets:** Top 3, 4-10, 11-20, 21-50, 51-100
- **Calculation:** `SELECT count(*) FILTER (WHERE rank <= 3)` etc.

### Traffic Sources Pie
- **Source:** `traffic_sources`
- **Calculation:** Percentage of total traffic by source

### Country Traffic
- **Source:** `country_traffic`
- **From:** GSC/GA4 integration data sync

### Device Breakdown
- **Source:** `device_breakdown`
- **From:** GA4 integration

### Monthly Growth Bar Chart
- **Source:** `monthly_growth`
- **Metrics:** Traffic growth %, keyword growth %, backlink growth %

### Top Landing Pages
- **Source:** `top_landing_pages`
- **From:** GSC integration
- **Sort:** By traffic descending

### Core Web Vitals
- **Source:** `core_web_vitals`
- **From:** CrUX API (Chrome User Experience Report)
- **Metrics:** LCP, CLS, INP, FCP, TTFB
- **Thresholds:** LCP <2.5s good, CLS <0.1 good, INP <200ms good

### AI SEO Metrics
- **Source:** `ai_seo_metrics`
- **Calculation:** AI scoring engine (background job) — see Section 20

---

## 16. Search, Filtering & Pagination

### Keyword Rankings

```text
GET /api/v1/keywords?
  project_id=<uuid>
  &search=seo              (search in keyword text)
  &intent=commercial       (filter by intent)
  &page=1
  &limit=20
  &sortBy=rank             (rank | volume | difficulty | change)
  &sortOrder=asc           (asc | desc)
```

### Backlinks

```text
GET /api/v1/backlinks?
  project_id=<uuid>
  &search=forbes           (search in source_domain or anchor_text)
  &type=follow             (filter by link_type)
  &page=1
  &limit=20
  &sortBy=firstSeen        (firstSeen | authority | change)
  &sortOrder=desc
```

### Content

```text
GET /api/v1/content?
  project_id=<uuid>
  &search=seo              (search in title or url)
  &type=blog               (filter by content_type)
  &status=published        (filter by status)
  &page=1
  &limit=20
  &sortBy=traffic          (traffic | score | updated)
  &sortOrder=desc
```

### Reports

```text
GET /api/v1/reports?
  project_id=<uuid>
  &type=weekly             (filter by report_type)
  &status=ready            (filter by status)
  &page=1
  &limit=20
```

### Standard Pagination Meta

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 18420,
    "totalPages": 921
  }
}
```

---

## 17. Notifications

### Notification Types

| Type | Trigger | Recipient | Default Email | Default Push |
|---|---|---|---|---|
| `audit_complete` | Audit job finishes | Project owner | YES | YES |
| `new_backlink` | New backlink discovered | Project owner | YES | NO |
| `keyword_ranked` | Keyword enters top 100 | Project owner | NO | YES |
| `keyword_lost` | Keyword drops out of top 100 | Project owner | YES | YES |
| `report_ready` | Report generation completes | Requester | YES | NO |
| `ai_score_updated` | AI SEO score changes | Project owner | NO | YES |
| `competitor_movement` | Competitor rank changes significantly | Project owner | NO | NO |

### Notification Entity

```text
id, user_id, project_id, type, title, description, is_read, created_at
```

### Delivery Channels
- **In-app:** Stored in `notifications` table, displayed in topbar bell dropdown
- **Email:** Sent via email service (Resend/SendGrid) based on `notification_preferences.email_enabled`
- **Push:** Web push notification based on `notification_preferences.push_enabled`

---

## 18. Audit Logging

### Actions Requiring Audit Log

| Action | Trigger | Entity |
|---|---|---|
| `auth.login` | User signs in | users |
| `auth.logout` | User signs out | users |
| `auth.register` | New account created | users |
| `project.create` | New project created | projects |
| `project.delete` | Project deleted | projects |
| `project.import` | Project imported | projects |
| `keyword.add` | Keywords added | keywords |
| `audit.run` | Site audit triggered | audits |
| `audit.issue.fixed` | Issue marked fixed | audit_issues |
| `backlink.add` | Backlink manually added | backlinks |
| `backlink.disavow` | Link disavowed | backlink_disavows |
| `competitor.add` | Competitor added | competitors |
| `content.create` | Content entry created | content_pages |
| `report.generate` | Report generated | reports |
| `report.schedule` | Report scheduled | scheduled_reports |
| `settings.profile.update` | Profile updated | users |
| `settings.notifications.update` | Notification prefs changed | notification_preferences |
| `integration.connect` | Integration connected | integrations |
| `integration.disconnect` | Integration disconnected | integrations |
| `api_key.generate` | API key generated | api_keys |
| `plan.change` | Subscription plan changed | users |

### Audit Log Entry

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "action": "project.create",
  "entity_type": "projects",
  "entity_id": "uuid",
  "old_value": null,
  "new_value": { "name": "acme-corp.com" },
  "ip_address": "192.168.1.1",
  "metadata": { "user_agent": "Mozilla/5.0..." },
  "created_at": "2025-09-15T10:00:00Z"
}
```

---

## 19. Background Jobs / Cron Jobs

### Keyword Rank Tracking

| Property | Value |
|---|---|
| Trigger | Cron — daily at 02:00 UTC |
| Input | All active `project_keywords` |
| Processing | For each keyword: query SERP API (Google/Bing), record current rank, compare to previous, detect new/lost keywords |
| Output | Insert `keyword_rankings`, create activities for rank changes, create notifications |
| Failure handling | Retry 3 times with exponential backoff, log failure |

### Site Audit Crawl

| Property | Value |
|---|---|
| Trigger | On-demand (`POST /audit/run`) |
| Input | project_id, crawl_depth, max_pages, user_agent |
| Processing | Crawl website, detect issues (broken links, meta tags, HTTPS, duplicates, slow pages, CWV, alt text, schema, thin content), compute health score |
| Output | Insert `audits` (completed), `audit_issues`, `audit_history`, update `projects.health_score`, create notification |
| Failure handling | Mark audit as failed, notify user |

### Backlink Discovery

| Property | Value |
|---|---|
| Trigger | Cron — daily at 03:00 UTC |
| Input | All active projects |
| Processing | Query backlink index API (Ahrefs/Moz), discover new/lost backlinks, update domain authority |
| Output | Insert/update `backlinks`, compute `backlinkGrowth` stats, create notifications for new backlinks |
| Failure handling | Retry, continue with cached data |

### Competitor Data Sync

| Property | Value |
|---|---|
| Trigger | Cron — weekly (Monday 04:00 UTC) |
| Input | All tracked competitors |
| Processing | Fetch competitor traffic/keywords/backlinks/authority from third-party API |
| Output | Update `competitors` table, refresh `competitor_keyword_positions` |
| Failure handling | Retry, log error |

### AI SEO Scoring

| Property | Value |
|---|---|
| Trigger | Cron — weekly (Sunday 01:00 UTC) |
| Input | All active projects |
| Processing | Query AI platforms (ChatGPT, Perplexity, Google AI Overviews, Claude, Copilot) for brand mentions, compute visibility/citation/GEO/LLM readiness scores |
| Output | Insert `ai_seo_metrics`, `ai_mentions_by_platform`, `ai_seo_trend`, generate `ai_recommendations` |
| Failure handling | Retry, use previous week's data |

### Core Web Vitals Sync

| Property | Value |
|---|---|
| Trigger | Cron — daily at 05:00 UTC |
| Input | All active projects |
| Processing | Query CrUX API for LCP, CLS, INP, FCP, TTFB |
| Output | Insert/update `core_web_vitals` |

### Report Generation

| Property | Value |
|---|---|
| Trigger | On-demand (`POST /reports/generate`) or scheduled (cron from `scheduled_reports`) |
| Input | report_id, template_id, date_range, format, include_sections |
| Processing | Aggregate data from all relevant tables, render PDF/CSV/XLSX, upload to storage |
| Output | Update `reports` (status=ready, file_url, file_size), create notification |
| Failure handling | Mark report as failed, notify user |

### Notification Dispatch

| Property | Value |
|---|---|
| Trigger | Event-driven (on notification insert) |
| Input | notification_id, user preferences |
| Processing | Check `notification_preferences`, send email/push if enabled |
| Output | Email sent / push delivered |

### Scheduled Report Runner

| Property | Value |
|---|---|
| Trigger | Cron — every minute |
| Input | `scheduled_reports` where `next_run_at <= now()` and `status = 'active'` |
| Processing | Generate report, send to recipients, update `next_run_at` |
| Output | New `reports` entry, email sent to recipients |

---

## 20. AI Features

### AI SEO Scoring Engine

**Purpose:** Compute how visible a website is across AI-powered search platforms.

**Input:** Project website URL, tracked keywords, content pages

**Processing:**
1. For each AI platform (ChatGPT, Perplexity, Google AI Overviews, Claude, Copilot):
   - Query platform with tracked keywords as prompts
   - Detect if the project's domain appears in the AI-generated answer
   - Count mentions and citations
2. Compute scores:
   - AI Visibility Score: % of queries where domain appears in AI answers
   - GEO Score: Structured data + content clarity for LLMs
   - Citation Score: Frequency of being cited as a source
   - LLM Readiness: Content structure clarity (heading hierarchy, schema, FAQ)
   - Structured Data Score: Schema markup coverage
   - Content Quality Score: E-E-A-T signal strength
   - Entity Recognition: Brand entity identification by AI
3. Generate recommendations based on score gaps

**Output:** `ai_seo_metrics`, `ai_mentions_by_platform`, `ai_seo_trend`, `ai_recommendations`

**API:** Internal job only — no direct API endpoint for scoring. Results read via `GET /ai-seo/*`

**Rate limiting:** 1 scoring run per project per week

**Cost optimization:** Cache AI responses, batch queries, use cheaper models for initial detection

### AI Recommendations Generation

**Purpose:** Generate actionable optimization recommendations.

**Input:** Current AI scores, content gaps, missing schema, keyword opportunities

**Prompt structure:**
```text
Given the following SEO metrics for {domain}:
- AI Visibility Score: {value}/100
- Structured Data Score: {value}/100
- Content Quality Score: {value}/100
- Missing schema types: {list}
- Low-scoring pages: {list}

Generate 5 specific, actionable recommendations to improve AI search visibility.
Each recommendation should include a title, impact level (High/Medium/Low), and expected score improvement.
```

**Output:** Array of `{ title, impact, score_delta }`

**Note:** The schema generator page is purely client-side and does NOT require AI. It builds JSON-LD from form input using template substitution.

---

## 21. Offline Sync

**Not applicable.** The frontend does not implement offline functionality. All data is fetched live from the backend. No service worker, no local queue, no conflict resolution needed.

---

## 22. Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "KEYWORD_NOT_FOUND",
    "message": "Keyword not found",
    "details": { "keywordId": "uuid" }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `VALIDATION_FAILED` | 422 | Business rule validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `BAD_GATEWAY` | 502 | Third-party API error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

### Domain-Specific Codes

| Code | Description |
|---|---|
| `EMAIL_ALREADY_EXISTS` | Registration with existing email |
| `INVALID_CREDENTIALS` | Wrong email/password |
| `ACCOUNT_SUSPENDED` | Account is suspended |
| `PROJECT_NOT_FOUND` | Project ID doesn't exist or not owned |
| `PROJECT_URL_EXISTS` | Website URL already tracked |
| `KEYWORD_LIMIT_EXCEEDED` | Plan keyword limit reached |
| `PROJECT_LIMIT_EXCEEDED` | Plan project limit reached |
| `AUDIT_IN_PROGRESS` | Audit already running for project |
| `REPORT_NOT_READY` | Report generation not complete |
| `INTEGRATION_NOT_CONNECTED` | Required integration not connected |
| `GSC_OAUTH_FAILED` | Google Search Console OAuth failed |
| `INVALID_CSV_FORMAT` | CSV file format invalid |

---

## 23. Response Format

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Created Response (201)

```json
{
  "success": true,
  "data": { "id": "uuid" },
  "message": "Resource created successfully"
}
```

### Accepted Response (202 — async jobs)

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "processing"
  },
  "message": "Job queued for processing"
}
```

---

## 24. Backend Architecture Recommendation

```
Client (React SPA)
    ↓
API Gateway / Supabase Edge Functions
    ↓
Authentication Middleware (JWT verification)
    ↓
Authorization / RLS (Supabase Row Level Security)
    ↓
Route Handlers / Edge Functions
    ↓
Service Layer (business logic)
    ↓
Supabase PostgreSQL (data access + RLS)
    ↓
Storage (Supabase Storage for reports/avatars)
```

### Folder Structure (Edge Functions)

```text
supabase/
├── functions/
│   ├── auth/
│   │   ├── register/index.ts
│   │   ├── login/index.ts
│   │   ├── logout/index.ts
│   │   ├── refresh/index.ts
│   │   ├── forgot-password/index.ts
│   │   └── reset-password/index.ts
│   ├── dashboard/
│   │   └── summary/index.ts
│   ├── projects/
│   │   ├── index.ts          (GET list, POST create)
│   │   ├── [id]/index.ts     (GET detail)
│   │   └── import/index.ts   (POST import)
│   ├── keywords/
│   │   ├── index.ts          (GET list, POST add)
│   │   ├── summary/index.ts
│   │   └── [id]/index.ts
│   ├── audit/
│   │   ├── checks/index.ts
│   │   ├── history/index.ts
│   │   ├── run/index.ts
│   │   └── issues/[id]/index.ts
│   ├── backlinks/
│   │   ├── index.ts
│   │   ├── stats/index.ts
│   │   ├── growth/index.ts
│   │   ├── anchor-distribution/index.ts
│   │   ├── follow-nofollow/index.ts
│   │   └── top-domains/index.ts
│   ├── competitors/
│   │   ├── index.ts
│   │   ├── keyword-comparison/index.ts
│   │   └── gap-analysis/index.ts
│   ├── content/
│   │   ├── index.ts
│   │   ├── stats/index.ts
│   │   └── [id]/index.ts
│   ├── ai-seo/
│   │   ├── metrics/index.ts
│   │   ├── trend/index.ts
│   │   ├── mentions-by-platform/index.ts
│   │   └── recommendations/index.ts
│   ├── reports/
│   │   ├── index.ts
│   │   ├── templates/index.ts
│   │   ├── generate/index.ts
│   │   ├── [id]/download/index.ts
│   │   └── scheduled/index.ts
│   ├── export/index.ts
│   ├── settings/
│   │   ├── profile/index.ts
│   │   ├── notifications/index.ts
│   │   ├── integrations/index.ts
│   │   ├── billing/index.ts
│   │   └── api-keys/index.ts
│   ├── notifications/
│   │   ├── index.ts
│   │   └── [id]/index.ts
│   ├── activities/index.ts
│   └── _shared/
│       ├── cors.ts
│       ├── auth.ts
│       ├── supabase.ts
│       └── validation.ts
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_projects.sql
│   ├── 003_create_keywords.sql
│   ├── 004_create_audits.sql
│   ├── 005_create_backlinks.sql
│   ├── 006_create_competitors.sql
│   ├── 007_create_content.sql
│   ├── 008_create_ai_seo.sql
│   ├── 009_create_reports.sql
│   ├── 010_create_notifications.sql
│   ├── 011_create_settings.sql
│   ├── 012_create_activities.sql
│   ├── 013_create_audit_logs.sql
│   ├── 014_create_subscription_plans.sql
│   ├── 015_seed_data.sql
│   └── 016_rls_policies.sql
└── config.toml
```

### Modules

| Module | Responsibility |
|---|---|
| auth | Registration, login, logout, token refresh, password reset |
| dashboard | Aggregated KPI computation, traffic trends, activity feed |
| projects | CRUD, import (GSC/CSV), detail with metrics |
| keywords | CRUD, bulk add, rank tracking, 30-day history, summary stats |
| audit | Run crawl, issue detection, history, mark fixed |
| backlinks | CRUD, stats, growth, distribution, top domains, disavow |
| competitors | CRUD, keyword comparison, gap analysis |
| content | CRUD, stats, performance scoring, optimization tips |
| ai-seo | Metrics, trend, platform mentions, recommendations |
| reports | Generate, schedule, download, templates |
| export | PDF generation from dashboard data |
| settings | Profile, notifications, integrations, billing, API keys |
| notifications | List, mark read, dispatch (email/push) |
| activities | Event log feed |
| audit-logs | Action tracking |

---

## 25. Recommended Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Backend framework | Supabase Edge Functions (Deno) | Already provisioned; native integration with frontend |
| Database | Supabase PostgreSQL | Already provisioned; RLS support |
| Authentication | Supabase Auth (email/password) | Native, no additional service needed |
| ORM / Data Access | Supabase JS client + raw SQL via MCP | Direct DB access with RLS |
| File storage | Supabase Storage | Reports, avatars, CSV uploads |
| Real-time | Supabase Realtime (postgres changes) | Notification badge, live updates |
| Background jobs | Supabase Scheduled Functions (cron) + pg_cron | Rank tracking, audits, AI scoring, report generation |
| AI integration | OpenAI API / Anthropic API (via edge function) | AI SEO scoring, recommendations |
| Third-party SEO data | Ahrefs API / Moz API / DataForSEO | Backlink discovery, keyword metrics, competitor data |
| SERP tracking | DataForSEO / SerpAPI / Google Search Console API | Keyword rank tracking |
| Core Web Vitals | Chrome CrUX API | Real-user metrics |
| Email service | Resend / SendGrid | Notification emails, password reset |
| Push notifications | Web Push API | Browser push notifications |
| PDF generation | server-side library (puppeteer/jsPDF/handlebars) | Report rendering |
| Payment processing | Stripe | Subscription billing (Pro Plan $99/mo) |
| Maps/location | Not required | No GPS features |
| Logging | Supabase logs + structured console logging | Edge function logs |
| Monitoring | Supabase dashboard + Uptime monitoring | Health checks |

---

## 26. Environment Variables

```text
# Supabase (already provisioned)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_DB_URL=postgresql://<connection_string>

# JWT
JWT_SECRET=<supabase_jwt_secret>
JWT_EXPIRES_IN=3600

# Third-party SEO APIs
DATAFORSEO_API_KEY=          # Keyword rank tracking, SERP data
AHREFS_API_KEY=              # Backlink discovery and metrics
MOZ_API_KEY=                 # Domain authority, backlink data
SERPAPI_API_KEY=             # Alternative SERP tracking

# Google integrations
GOOGLE_CLIENT_ID=            # GSC + GA4 OAuth
GOOGLE_CLIENT_SECRET=        # GSC + GA4 OAuth
GOOGLE_REDIRECT_URI=        # OAuth callback URL

# AI platforms
OPENAI_API_KEY=              # AI SEO scoring (ChatGPT mentions)
ANTHROPIC_API_KEY=           # AI SEO scoring (Claude mentions)

# Core Web Vitals
CRUX_API_KEY=                # Chrome User Experience Report API

# Email
RESEND_API_KEY=              # Transactional emails (notifications, password reset)

# Push notifications
VAPID_PUBLIC_KEY=            # Web Push
VAPID_PRIVATE_KEY=           # Web Push

# Payments
STRIPE_SECRET_KEY=           # Subscription billing
STRIPE_WEBHOOK_SECRET=       # Stripe webhook verification
STRIPE_PRICE_ID_PRO=         # Pro plan price ID

# Storage
STORAGE_BUCKET_REPORTS=reports
STORAGE_BUCKET_AVATARS=avatars

# Rate limiting
RATE_LIMIT_AUTH=5            # Auth attempts per minute
RATE_LIMIT_API=100           # API requests per minute
```

---

## 27. Seed Data

### Subscription Plans

```sql
INSERT INTO subscription_plans (name, price, cycle, max_projects, max_keywords, audit_frequency, features) VALUES
  ('Free', '$0', '/month', 1, 50, 'on_demand', '{"features": ["1 project", "50 keywords", "manual audits"]}'),
  ('Pro', '$99', '/month', 10, 5000, 'weekly', '{"features": ["10 projects", "5,000 keywords", "weekly audits", "AI SEO", "competitor tracking"]}'),
  ('Enterprise', 'Custom', '/month', 100, 50000, 'daily', '{"features": ["unlimited projects", "50,000 keywords", "daily audits", "API access", "custom reports"]}');
```

### Report Templates

```sql
INSERT INTO report_templates (name, description, icon, sections) VALUES
  ('Executive Summary', 'High-level KPIs and traffic overview', 'FileText', '{"kpis","traffic"}'),
  ('Technical Audit', 'Full site health and Core Web Vitals', 'ShieldCheck', '{"site_audit"}'),
  ('Keyword Performance', 'Ranking changes and opportunities', 'Search', '{"keywords"}'),
  ('Backlink Report', 'Link profile growth and quality', 'Link2', '{"backlinks"}'),
  ('Competitor Benchmark', 'Side-by-side competitor analysis', 'Users', '{"competitors"}'),
  ('AI SEO Report', 'AI visibility and GEO metrics', 'Sparkles', '{"ai_seo"}');
```

### Integrations (catalog)

```sql
INSERT INTO integrations (user_id, provider, is_connected, description) VALUES
  (auth.uid(), 'google_search_console', false, 'Search performance and indexing data'),
  (auth.uid(), 'google_analytics_4', false, 'Traffic and user behavior metrics'),
  (auth.uid(), 'google_looker_studio', false, 'Build custom SEO dashboards'),
  (auth.uid(), 'slack', false, 'Send alerts and reports to channels'),
  (auth.uid(), 'zapier', false, 'Automate workflows with 5,000+ apps'),
  (auth.uid(), 'ahrefs_api', false, 'Pull backlink and keyword data');
```

### Notification Preferences (default)

```sql
INSERT INTO notification_preferences (user_id, event_type, email_enabled, push_enabled) VALUES
  (auth.uid(), 'site_audit_completed', true, true),
  (auth.uid(), 'new_backlink_found', true, false),
  (auth.uid(), 'keyword_ranking_changed', false, true),
  (auth.uid(), 'lost_keyword_ranking', true, true),
  (auth.uid(), 'weekly_report_ready', true, false),
  (auth.uid(), 'ai_score_updated', false, true),
  (auth.uid(), 'competitor_movement_detected', false, false);
```

### Demo Project (optional)

```sql
INSERT INTO projects (user_id, name, website_url, favicon, industry, target_country, status, health_score, authority_score)
VALUES (auth.uid(), 'acme-corp.com', 'https://acme-corp.com', 'A', 'saas', 'US', 'active', 94, 64);
```

---

## 28. API → Frontend Mapping

```text
Login Screen
 └── POST /auth/login

Dashboard
 ├── GET /dashboard/summary (kpis, trafficTrend, trafficSources, countryTraffic, deviceBreakdown, monthlyGrowth, topLandingPages, keywordDistribution)
 ├── GET /keywords?limit=5 (keywordTable mini)
 ├── GET /audit/checks (auditIssues mini)
 ├── GET /backlinks/stats (backlinkStats mini)
 ├── GET /competitors (competitors mini)
 ├── GET /ai-seo/metrics?limit=7 (aiSeoMetrics mini)
 ├── GET /activities?limit=6 (recentActivities)
 └── GET /core-web-vitals (coreWebVitals)

Schema Generator
 └── (no backend — client-side only)

Projects Screen
 ├── GET /projects
 ├── POST /projects (via new-project modal)
 ├── POST /projects/import (via import-project modal)
 └── GET /projects/:id (via project-detail modal)

Keyword Rankings Screen
 ├── GET /keywords?project_id=&page=&limit=&search=&intent=&sortBy=&sortOrder=
 ├── GET /keywords/summary
 ├── POST /keywords (via add-keyword modal)
 ├── GET /keywords/:id (via keyword-detail modal)
 └── POST /export (via export-pdf modal)

Site Audit Screen
 ├── GET /audit/checks
 ├── GET /audit/history
 ├── POST /audit/run (via run-audit modal)
 ├── GET /audit/issues/:id (via audit-issue modal)
 ├── PATCH /audit/issues/:id (mark fixed)
 └── POST /export (via export-pdf modal)

Backlinks Screen
 ├── GET /backlinks
 ├── GET /backlinks/stats
 ├── GET /backlinks/growth
 ├── GET /backlinks/anchor-distribution
 ├── GET /backlinks/follow-nofollow
 ├── GET /backlinks/top-domains
 ├── POST /backlinks (via add-backlink modal)
 └── POST /export (via export-pdf modal)

Competitors Screen
 ├── GET /competitors
 ├── GET /competitors/keyword-comparison
 ├── GET /competitors/gap-analysis
 ├── POST /competitors (via add-competitor modal)
 └── POST /export (via export-pdf modal)

Content Screen
 ├── GET /content
 ├── GET /content/stats
 ├── POST /content (via new-content modal)
 └── GET /content/:id (via content-detail modal)

AI SEO Screen
 ├── GET /ai-seo/metrics
 ├── GET /ai-seo/trend
 ├── GET /ai-seo/mentions-by-platform
 ├── GET /ai-seo/recommendations
 └── POST /export (via export-pdf modal)

Reports Screen
 ├── GET /reports
 ├── GET /reports/templates
 ├── POST /reports/generate (via generate-report modal)
 ├── GET /reports/:id/download
 ├── GET /reports/scheduled
 └── POST /reports/schedule

Settings (via profile dropdown)
 ├── GET /settings/profile
 ├── PUT /settings/profile
 ├── GET /settings/notifications
 ├── PUT /settings/notifications
 ├── GET /settings/integrations
 ├── POST /settings/integrations/:provider/connect
 ├── DELETE /settings/integrations/:provider
 ├── GET /settings/billing
 ├── GET /settings/api-keys
 └── POST /settings/api-keys

Topbar
 ├── GET /notifications (bell dropdown)
 ├── PATCH /notifications/:id (mark read)
 └── POST /auth/logout (log out)
```

---

## 29. End-to-End User Flows

### Login Flow

```text
User enters email + password
  ↓
POST /auth/login
  ↓
Validate credentials → verify password hash
  ↓
Generate JWT access + refresh tokens
  ↓
Return user + tokens
  ↓
Frontend stores tokens, sets auth context
  ↓
Render Dashboard
  ↓
GET /dashboard/summary
  ↓
Render KPIs, charts, tables
```

### Create Project Flow

```text
User clicks "New Project"
  ↓
Open new-project modal
  ↓
User fills: name, URL, industry, country, keywords
  ↓
POST /projects
  ↓
Validate input (URL format, plan limits)
  ↓
INSERT projects + project_keywords
  ↓
Enqueue initial data fetch job (SERP, backlinks, audit)
  ↓
Return project ID
  ↓
Close modal, refresh project list
  ↓
Create audit log: project.create
  ↓
Create notification: project created
```

### Run Site Audit Flow

```text
User clicks "Re-run Audit"
  ↓
Open run-audit modal
  ↓
User selects: crawl depth, max pages, user agent
  ↓
POST /audit/run
  ↓
INSERT audits (status=pending)
  ↓
Enqueue crawl job
  ↓
Return audit ID
  ↓
Frontend shows progress animation (4 steps)
  ↓
Poll GET /audit/run/:id/status (or realtime)
  ↓
Crawl job: fetch pages, detect issues, compute health
  ↓
INSERT audit_issues, audit_history
  ↓
UPDATE projects.health_score
  ↓
UPDATE audits (status=completed)
  ↓
Create notification: audit_complete
  ↓
Create activity: audit
  ↓
Frontend refreshes audit checks
```

### Generate Report Flow

```text
User clicks "New Report"
  ↓
Open generate-report modal
  ↓
User selects: template, date range, format, sections
  ↓
POST /reports/generate
  ↓
INSERT reports (status=generating)
  ↓
Enqueue report generation job
  ↓
Return report ID
  ↓
Job: aggregate data from selected sections
  ↓
Render PDF/CSV/XLSX
  ↓
Upload to Supabase Storage (reports bucket)
  ↓
Generate signed URL
  ↓
UPDATE reports (status=ready, file_url, file_size)
  ↓
Create notification: report_ready
  ↓
Frontend shows download button
  ↓
User clicks download → GET /reports/:id/download
  ↓
Redirect to signed URL
```

### Add Keywords Flow

```text
User clicks "Add Keywords" (Filter button on Keyword Rankings)
  ↓
Open add-keyword modal
  ↓
User enters keywords (individual or bulk paste)
  ↓
Selects search engine + device
  ↓
POST /keywords (bulk)
  ↓
Validate: at least 1 keyword, max 1000
  ↓
Check plan keyword limit
  ↓
INSERT keywords (skip duplicates)
  ↓
Enqueue rank tracking job
  ↓
Return added count + duplicates count
  ↓
Close modal, refresh keyword list
  ↓
Create audit log: keyword.add
```

### Mark Audit Issue Fixed Flow

```text
User clicks an issue in Site Audit
  ↓
Open audit-issue modal
  ↓
Display: severity, count, affected pages, recommendations
  ↓
User clicks "Mark as Fixed"
  ↓
PATCH /audit/issues/:id { status: 'fixed' }
  ↓
UPDATE audit_issues SET status='fixed', fixed_at=now(), fixed_by=auth.uid()
  ↓
Create audit log: audit.issue.fixed
  ↓
Close modal, refresh audit checks
  ↓
Recompute audit health score
```

### Export PDF Flow

```text
User clicks "Export" on any screen
  ↓
Open export-pdf modal
  ↓
Show 8 included sections (static)
  ↓
User clicks "Download PDF"
  ↓
POST /export { project_id, sections }
  ↓
Enqueue PDF generation job
  ↓
Return export ID
  ↓
Frontend shows "Preparing..." state
  ↓
Poll for completion (or webhook)
  ↓
PDF generated server-side
  ↓
Upload to storage, generate signed URL
  ↓
Frontend triggers download
```

---

## 30. Backend Implementation Order

### Phase 1: Foundation

- Supabase project setup
- Database migrations (all 34 tables)
- RLS policies on every table
- Authentication (register, login, logout, refresh)
- User profile CRUD
- Seed data (plans, templates, integrations catalog, notification defaults)

### Phase 2: Core Entities

- Projects CRUD + import
- Keywords CRUD + bulk add + summary stats
- Content CRUD + stats
- Competitors CRUD + gap analysis
- Backlinks CRUD + stats + distribution + top domains

### Phase 3: Dashboard & Analytics

- Dashboard summary endpoint (aggregate all KPIs)
- Traffic trends, sources, country, device data
- Activities feed
- Core Web Vitals

### Phase 4: Audits

- Audit run (trigger crawl)
- Audit checks listing
- Audit history
- Issue detail + mark fixed
- Health score computation

### Phase 5: Reports & Export

- Report templates
- Report generation (PDF/CSV/XLSX)
- Report listing + download
- Scheduled reports (cron runner)
- Export PDF (dashboard sections)

### Phase 6: AI SEO

- AI metrics computation (background job)
- AI trend tracking
- Platform mentions
- Recommendation generation
- AI scoring engine integration

### Phase 7: Settings & Notifications

- Notification preferences CRUD
- Integrations connect/disconnect (OAuth)
- Billing/plan (Stripe integration)
- API key generation
- Notification dispatch (email/push)
- Real-time notification updates

### Phase 8: Background Jobs

- Keyword rank tracking (daily cron)
- Backlink discovery (daily cron)
- Competitor data sync (weekly cron)
- AI SEO scoring (weekly cron)
- Core Web Vitals sync (daily cron)
- Scheduled report runner (every minute)

### Phase 9: Security & Polish

- Rate limiting
- Audit logging on all actions
- Input validation on all endpoints
- Error handling standardization
- CORS configuration
- API key authentication for external access

---

## 31. Testing Requirements

### Unit Tests

| Module | Test Cases |
|---|---|
| Auth | Valid login, invalid password, suspended account, token generation, token refresh, password reset flow |
| Projects | Create with valid data, create with invalid URL, duplicate URL, import CSV parse, import GSC OAuth |
| Keywords | Bulk add, duplicate detection, plan limit enforcement, search/filter, pagination |
| Audit | Crawl trigger, issue detection logic, health score computation, mark fixed |
| Backlinks | Add backlink, disavow link, anchor distribution calculation, follow/nofollow ratio |
| Reports | Generate PDF, generate CSV, generate XLSX, schedule report, template selection |

### Integration Tests

| Area | Test Cases |
|---|---|
| Auth + RLS | User can only access own data, cross-user access denied, unauthenticated access denied |
| Project scoping | All project-scoped queries respect project ownership |
| Background jobs | Rank tracking updates rankings, audit crawl creates issues, report generation creates file |
| Notifications | Audit complete creates notification, notification respects preferences |
| Audit logs | All CRUD operations create audit log entries |

### API Tests

| Area | Test Cases |
|---|---|
| Every endpoint | 200 success, 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 429 rate limited |
| Pagination | Page 1, last page, beyond total, empty results |
| Filtering | Single filter, multiple filters, invalid filter values |
| Sorting | Asc, desc, invalid sort field |

### RBAC Tests

| Role | Test Cases |
|---|---|
| Owner | Can access billing, generate API keys, connect integrations |
| Member | Cannot access billing, cannot generate API keys, cannot connect integrations |
| Viewer | Cannot create/edit/delete any resource, can only view and export |

### Validation Tests

| Area | Test Cases |
|---|---|
| Email format | Invalid emails rejected |
| URL format | Invalid URLs rejected |
| Password strength | Weak passwords rejected |
| Enum values | Invalid enum values rejected |
| Array limits | Keyword array > 1000 rejected |
| File upload | Non-CSV file rejected, oversized file rejected |

---

## 32. Production Readiness

### Checklist

- [ ] All 34 database tables created with proper indexes
- [ ] RLS enabled on every table with 4 policies each (SELECT, INSERT, UPDATE, DELETE)
- [ ] All API endpoints implemented with input validation (Zod schemas)
- [ ] Authentication with JWT (access + refresh tokens)
- [ ] Rate limiting on auth (5/min) and API (100/min) endpoints
- [ ] CORS headers on all edge function responses
- [ ] Audit logging on all state-changing operations
- [ ] Background jobs scheduled (rank tracking, audits, AI scoring, report generation)
- [ ] File upload validation (type, size, content)
- [ ] Signed URLs for report downloads (24h expiry)
- [ ] API keys stored hashed, shown once on creation
- [ ] OAuth tokens encrypted at rest
- [ ] Environment variables configured (no secrets in code)
- [ ] Error responses follow standard format
- [ ] Pagination on all list endpoints
- [ ] Notification dispatch (email + push) respecting user preferences
- [ ] Stripe integration for subscription billing
- [ ] Third-party API integrations (DataForSEO, Ahrefs, CrUX, OpenAI, Anthropic)
- [ ] Health check endpoint
- [ ] Structured logging on all edge functions
- [ ] Database backup strategy
- [ ] Monitoring and alerting

### Performance Considerations

- Add indexes on all foreign keys and frequently filtered columns
- Use materialized views for dashboard aggregates (refresh hourly)
- Cache AI SEO scores (weekly computation, cache results)
- Implement cursor-based pagination for large tables (backlinks, keywords)
- Batch insert for bulk keyword operations
- Use Supabase Realtime subscriptions instead of polling where possible
- Compress PDF reports before storage
- Implement connection pooling for database access

### Scalability Considerations

- Partition `keyword_rankings` by date (daily partitions)
- Archive old audit issues (> 90 days) to cold storage
- Implement queue-based job processing for audits and report generation
- Use read replicas for dashboard queries (if scale requires)
- Implement CDN for report file downloads
- Consider dedicated crawl workers for large sites (> 10,000 pages)

---

*End of Backend Engineering Specification*
