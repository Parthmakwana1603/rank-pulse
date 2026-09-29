-- RankPulse — Phase 1: user profiles, projects and tracked keywords.
-- Tables follow BACKEND_SPECIFICATION.md §4.1–4.3. Supabase Auth (auth.users) stores
-- email and password, so the spec's `users` table becomes `profiles`, one row per auth user.

-- ── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles (spec §4.1 `users`) ───────────────────────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  name          text not null default '',
  role          text not null default 'owner' check (role in ('owner', 'member', 'viewer')),
  plan          text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  profile_image text,
  company       text,
  job_title     text,
  status        text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_status_idx on public.profiles (status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile whenever someone signs up. The display name comes from the
-- `name` field passed to supabase.auth.signUp({ options: { data: { name } } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Users may edit their own details but not their role, plan, status or email.
revoke update on public.profiles from anon, authenticated;
grant update (name, profile_image, company, job_title) on public.profiles to authenticated;

-- ── projects (spec §4.2) ───────────────────────────────────────────────────

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name            text not null check (char_length(trim(name)) between 2 and 100),
  website_url     text not null check (website_url ~* '^https?://[^\s/]+\.[^\s]+$'),
  favicon         text,
  industry        text check (industry in ('saas', 'ecommerce', 'finance', 'health', 'education', 'other')),
  target_country  text check (target_country ~ '^[A-Z]{2}$'),
  status          text not null default 'active' check (status in ('active', 'paused', 'warning')),
  health_score    integer not null default 0 check (health_score between 0 and 100),
  authority_score integer not null default 0 check (authority_score between 0 and 100),
  traffic_value   text,
  last_audit_at   timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index projects_user_id_idx on public.projects (user_id);
create index projects_status_idx on public.projects (status);
-- One project per website per user (spec: 409 on duplicate project URL).
create unique index projects_user_website_key on public.projects (user_id, lower(website_url));

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "Users can read their own projects"
  on public.projects for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own projects"
  on public.projects for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own projects"
  on public.projects for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own projects"
  on public.projects for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ── project_keywords (spec §4.3) ───────────────────────────────────────────

create table public.project_keywords (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  keyword       text not null check (char_length(trim(keyword)) between 1 and 200),
  search_engine text not null default 'google' check (search_engine in ('google', 'bing', 'yahoo')),
  device        text not null default 'desktop' check (device in ('desktop', 'mobile')),
  unique (project_id, keyword, search_engine, device)
);

create index project_keywords_project_id_idx on public.project_keywords (project_id);

alter table public.project_keywords enable row level security;

create policy "Users can manage keywords of their own projects"
  on public.project_keywords for all
  to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

-- ── create_project: POST /projects in one transaction ──────────────────────
-- Runs as the caller (security invoker), so the RLS policies above still apply.

create or replace function public.create_project(
  p_name              text,
  p_website_url       text,
  p_industry          text default null,
  p_target_country    text default null,
  p_tracking_keywords text[] default '{}'
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  kw      text[];
  project public.projects;
begin
  select coalesce(array_agg(distinct lower(trim(k))), '{}')
    into kw
    from unnest(coalesce(p_tracking_keywords, '{}')) as k
   where trim(k) <> '';

  if cardinality(kw) > 100 then
    raise exception 'A project can track at most 100 keywords' using errcode = '22023';
  end if;

  insert into public.projects (name, website_url, favicon, industry, target_country)
  values (
    trim(p_name),
    trim(p_website_url),
    upper(left(trim(p_name), 1)),
    nullif(p_industry, ''),
    nullif(upper(p_target_country), '')
  )
  returning * into project;

  insert into public.project_keywords (project_id, keyword)
  select project.id, k from unnest(kw) as k;

  return project;
end;
$$;

revoke execute on function public.create_project(text, text, text, text, text[]) from public, anon;
grant execute on function public.create_project(text, text, text, text, text[]) to authenticated;
