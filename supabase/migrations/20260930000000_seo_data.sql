-- RankPulse — Phase 2: the per-project data behind the dashboard screens (site audits, backlinks,
-- competitors, content), plus activity feed, notifications, notification preferences and reports.
-- Builds on 20260929000000_auth_and_projects.sql; does not change its tables except for adding
-- project_keywords.created_at.
--
-- Every project-owned row carries project_id and is protected by public.owns_project(), so a user
-- can only ever read or write rows of their own projects. The Express API talks to Supabase with the
-- caller's own access token, so these policies apply to every API request as well.

-- ── Helpers ────────────────────────────────────────────────────────────────

-- True when the signed-in user owns the project. Runs as the caller, so it goes through the
-- projects RLS policy too.
create or replace function public.owns_project(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.user_id = (select auth.uid())
  );
$$;

-- ── project_keywords: remember when each keyword was added ─────────────────

alter table public.project_keywords add column created_at timestamptz not null default now();

-- ── Site audits ────────────────────────────────────────────────────────────

create table public.audit_runs (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects (id) on delete cascade,
  status         text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  phase          text check (phase in ('queued', 'crawling', 'analyzing', 'done')),
  crawl_depth    text not null check (crawl_depth in ('quick', 'standard', 'full')),
  max_pages      integer not null check (max_pages between 1 and 1000),
  user_agent     text not null check (user_agent in ('desktop', 'mobile', 'googlebot')),
  pages_crawled  integer not null default 0 check (pages_crawled >= 0),
  health_score   integer check (health_score between 0 and 100),
  errors         integer not null default 0 check (errors >= 0),
  warnings       integer not null default 0 check (warnings >= 0),
  notices        integer not null default 0 check (notices >= 0),
  error_message  text,
  created_at     timestamptz not null default now(),
  started_at     timestamptz,
  finished_at    timestamptz,
  unique (id, project_id)
);

create index audit_runs_project_created_idx on public.audit_runs (project_id, created_at desc);
-- At most one queued or running audit per project (the API turns a violation into 409).
create unique index audit_runs_one_active_idx on public.audit_runs (project_id) where status in ('pending', 'running');

create table public.audit_issues (
  id           uuid primary key default gen_random_uuid(),
  audit_id     uuid not null,
  project_id   uuid not null references public.projects (id) on delete cascade,
  check_key    text not null check (check_key ~ '^[a-z_]+$'),
  type         text not null check (type in ('error', 'warning', 'notice')),
  title        text not null,
  description  text not null default '',
  occurrences  integer not null check (occurrences >= 0),
  pages        integer not null check (pages >= 0),
  status       text not null default 'open' check (status in ('open', 'fixed')),
  fixed_at     timestamptz,
  unique (audit_id, check_key),
  unique (id, project_id),
  foreign key (audit_id, project_id) references public.audit_runs (id, project_id) on delete cascade
);

create index audit_issues_project_idx on public.audit_issues (project_id);

create table public.audit_issue_pages (
  id           uuid primary key default gen_random_uuid(),
  issue_id     uuid not null,
  project_id   uuid not null references public.projects (id) on delete cascade,
  url          text not null,
  status_code  integer,
  detail       text,
  foreign key (issue_id, project_id) references public.audit_issues (id, project_id) on delete cascade
);

create index audit_issue_pages_issue_idx on public.audit_issue_pages (issue_id);

-- ── Backlinks ──────────────────────────────────────────────────────────────

create table public.backlinks (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  source_url        text not null check (source_url ~* '^https?://[^\s/]+\.[^\s]+$'),
  source_domain     text not null,
  target_page       text not null check (char_length(target_page) between 1 and 2048),
  anchor_text       text not null default '' check (char_length(anchor_text) <= 500),
  link_type         text not null default 'follow' check (link_type in ('follow', 'nofollow', 'ugc', 'sponsored')),
  domain_authority  integer check (domain_authority between 0 and 100),
  notes             text check (char_length(notes) <= 2000),
  disavowed         boolean not null default false,
  disavowed_at      timestamptz,
  first_seen_at     timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  unique (project_id, source_url, target_page)
);

create index backlinks_project_idx on public.backlinks (project_id);

-- ── Competitors ────────────────────────────────────────────────────────────

create table public.competitors (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  domain          text not null check (domain ~* '^[a-z0-9.-]+\.[a-z]{2,}$'),
  display_name    text not null check (char_length(trim(display_name)) between 1 and 100),
  target_country  text check (target_country ~ '^[A-Z]{2}$'),
  tracking_scope  text not null default 'organic' check (tracking_scope in ('organic', 'paid', 'all')),
  created_at      timestamptz not null default now()
);

create index competitors_project_idx on public.competitors (project_id);
create unique index competitors_project_domain_key on public.competitors (project_id, lower(domain));

-- ── Content pages ──────────────────────────────────────────────────────────

create table public.content_pages (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  title             text not null check (char_length(trim(title)) between 1 and 200),
  url_path          text not null check (url_path ~ '^/[^\s]*$' and char_length(url_path) <= 2048),
  content_type      text not null default 'blog' check (content_type in ('blog', 'landing', 'tool', 'guide')),
  status            text not null default 'draft' check (status in ('draft', 'published', 'needs-update', 'outdated')),
  primary_keyword   text check (char_length(primary_keyword) <= 200),
  target_keywords   text[] not null default '{}' check (cardinality(target_keywords) <= 50),
  meta_description  text check (char_length(meta_description) <= 500),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (project_id, url_path)
);

create index content_pages_project_idx on public.content_pages (project_id);

create trigger content_pages_set_updated_at
  before update on public.content_pages
  for each row execute function public.set_updated_at();

-- ── Activity feed ──────────────────────────────────────────────────────────

create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  type         text not null check (type in ('project', 'keyword', 'audit', 'backlink', 'competitor', 'content', 'report')),
  title        text not null,
  description  text not null default '',
  created_at   timestamptz not null default now()
);

create index activities_user_created_idx on public.activities (user_id, created_at desc);
create index activities_project_created_idx on public.activities (project_id, created_at desc);

-- ── Notifications ──────────────────────────────────────────────────────────

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  event_key    text not null,
  title        text not null,
  description  text not null default '',
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  event_key   text not null check (event_key in (
                'audit_completed', 'new_backlink', 'keyword_ranking_changed', 'lost_ranking',
                'report_ready', 'ai_score_updated', 'competitor_movement')),
  email       boolean not null,
  push        boolean not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, event_key)
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ── Reports ────────────────────────────────────────────────────────────────

create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  user_id          uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 200),
  template         text not null check (template in (
                     'executive-summary', 'technical-audit', 'keyword-performance',
                     'backlink-report', 'competitor-benchmark', 'ai-seo-report')),
  format           text not null check (format in ('pdf', 'csv', 'xlsx')),
  date_range_days  integer not null check (date_range_days in (7, 30, 90)),
  sections         text[] not null check (cardinality(sections) between 1 and 10),
  status           text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  file_path        text,
  file_size        bigint check (file_size >= 0),
  error_message    text,
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index reports_project_created_idx on public.reports (project_id, created_at desc);

-- ── Row-level security ─────────────────────────────────────────────────────

alter table public.audit_runs enable row level security;
alter table public.audit_issues enable row level security;
alter table public.audit_issue_pages enable row level security;
alter table public.backlinks enable row level security;
alter table public.competitors enable row level security;
alter table public.content_pages enable row level security;
alter table public.activities enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reports enable row level security;

create policy "Users manage audits of their own projects"
  on public.audit_runs for all to authenticated
  using ((select public.owns_project(project_id))) with check ((select public.owns_project(project_id)));

create policy "Users manage audit issues of their own projects"
  on public.audit_issues for all to authenticated
  using ((select public.owns_project(project_id))) with check ((select public.owns_project(project_id)));

create policy "Users manage audit issue pages of their own projects"
  on public.audit_issue_pages for all to authenticated
  using ((select public.owns_project(project_id))) with check ((select public.owns_project(project_id)));

create policy "Users manage backlinks of their own projects"
  on public.backlinks for all to authenticated
  using ((select public.owns_project(project_id))) with check ((select public.owns_project(project_id)));

create policy "Users manage competitors of their own projects"
  on public.competitors for all to authenticated
  using ((select public.owns_project(project_id))) with check ((select public.owns_project(project_id)));

create policy "Users manage content of their own projects"
  on public.content_pages for all to authenticated
  using ((select public.owns_project(project_id))) with check ((select public.owns_project(project_id)));

create policy "Users manage reports of their own projects"
  on public.reports for all to authenticated
  using ((select public.owns_project(project_id)))
  with check (user_id = (select auth.uid()) and (select public.owns_project(project_id)));

-- Activities and notifications belong to a user; a project, when given, must be theirs too.
create policy "Users read their own activities"
  on public.activities for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users record their own activities"
  on public.activities for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (project_id is null or (select public.owns_project(project_id)))
  );

create policy "Users read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users receive their own notifications"
  on public.notifications for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (project_id is null or (select public.owns_project(project_id)))
  );

create policy "Users mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Notifications can only be marked read, not rewritten.
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "Users manage their own notification preferences"
  on public.notification_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
