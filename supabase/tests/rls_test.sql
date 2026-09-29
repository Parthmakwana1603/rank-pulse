-- Tests for supabase/migrations: row-level security, validation and triggers.
-- Run against a throwaway database after supabase/tests/auth_stub.sql and the migrations
-- (see supabase/README.md). Any failure raises an error and stops the script.
\set ON_ERROR_STOP on
\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''

create function pg_temp.check(ok boolean, label text) returns text language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAIL: %', label; end if;
  return 'pass: ' || label;
end $$;

create function pg_temp.fails_with(sql text, code text, label text) returns text language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlstate = code then return 'pass: ' || label; end if;
    raise exception 'FAIL: % (expected %, got %: %)', label, code, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL: % (expected error %, but it succeeded)', label, code;
end $$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- Sign-up creates a profile, using the name from sign-up metadata or the email prefix.
insert into auth.users (id, email, raw_user_meta_data) values (:A, 'parth@example.com', '{"name":"Parth M"}');
insert into auth.users (id, email) values (:B, 'bob@example.com');
select pg_temp.check((select name = 'Parth M' and role = 'owner' and plan = 'free' from public.profiles where id = :A),
  'profile created from sign-up name');
select pg_temp.check((select name = 'bob' from public.profiles where id = :B), 'profile name falls back to email prefix');

-- ── User A ─────────────────────────────────────────────────────────────────
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);

select pg_temp.check(
  (select name = 'acme-corp.com' and favicon = 'A' and industry = 'saas' and target_country = 'US' and user_id = :A
     from public.create_project('acme-corp.com', 'https://acme-corp.com', 'saas', 'us',
                                array['SEO audit ', 'seo audit', '', 'backlink checker'])),
  'create_project stores the project for the caller');
select pg_temp.check(
  (select array_agg(keyword order by keyword) = array['backlink checker', 'seo audit'] from public.project_keywords),
  'tracking keywords are trimmed, lowercased and de-duplicated');

select pg_temp.fails_with($$select public.create_project('dup', 'https://ACME-corp.com')$$, '23505',
  'duplicate website (case-insensitive) is rejected');
select pg_temp.fails_with($$select public.create_project('bad', 'acme.com')$$, '23514', 'URL without http(s) is rejected');
select pg_temp.fails_with($$select public.create_project('bad', 'https://x.com', null, 'USA')$$, '23514',
  'country must be a 2-letter code');
select pg_temp.fails_with($$select public.create_project('bad', 'https://y.com', 'crypto')$$, '23514', 'unknown industry is rejected');
select pg_temp.fails_with($$select public.create_project(' a ', 'https://z.com')$$, '23514', 'name shorter than 2 chars is rejected');
select pg_temp.fails_with(
  format('select public.create_project(%L, %L, null, null, %L::text[])', 'many', 'https://many.com',
         (select array_agg('kw' || g) from generate_series(1, 101) g)),
  '22023', 'more than 100 keywords is rejected');
select pg_temp.check((select count(*) = 1 from public.projects), 'failed creates leave nothing behind');

update public.profiles set name = 'Parth Makwana' where id = :A;
select pg_temp.check((select name = 'Parth Makwana' from public.profiles where id = :A), 'user can rename themselves');
select pg_temp.fails_with($$update public.profiles set plan = 'enterprise'$$, '42501', 'user cannot change their own plan');
select pg_temp.fails_with($$update public.profiles set role = 'viewer'$$, '42501', 'user cannot change their own role');

select id as a_project from public.projects limit 1 \gset

-- ── User B cannot see or change A's data ───────────────────────────────────
select set_config('request.jwt.claim.sub', :B, false);

select pg_temp.check((select count(*) = 0 from public.projects), 'B sees none of A''s projects');
select pg_temp.check((select count(*) = 0 from public.project_keywords), 'B sees none of A''s keywords');
select pg_temp.check((select array_agg(email) = array['bob@example.com'] from public.profiles), 'B sees only their own profile');
select pg_temp.fails_with(
  format('insert into public.projects (user_id, name, website_url) values (%L, %L, %L)', :A, 'evil', 'https://evil.com'),
  '42501', 'B cannot create a project owned by A');
select pg_temp.fails_with(
  format('insert into public.project_keywords (project_id, keyword) values (%L, %L)', :'a_project', 'x'),
  '42501', 'B cannot add keywords to A''s project');
update public.projects set name = 'hacked' where id = :'a_project';
delete from public.projects where id = :'a_project';
select pg_temp.check((select count(*) = 1 from public.create_project('acme', 'https://acme-corp.com')),
  'the same website can be tracked by different users');

-- ── Anonymous visitors ─────────────────────────────────────────────────────
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.check((select count(*) = 0 from public.projects), 'anonymous visitors see no projects');
select pg_temp.fails_with($$select public.create_project('x', 'https://anon.com')$$, '42501', 'anonymous visitors cannot create projects');

-- ── A's data survived B; deletes cascade ───────────────────────────────────
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);
select pg_temp.check((select name = 'acme-corp.com' from public.projects where id = :'a_project'), 'B''s update and delete did not touch A''s project');
delete from public.projects where id = :'a_project';
reset role;
select pg_temp.check((select count(*) = 0 from public.project_keywords where project_id = :'a_project'), 'deleting a project deletes its keywords');

delete from auth.users where id = :B;
select pg_temp.check(
  (select count(*) = 0 from public.profiles where id = :B) and (select count(*) = 0 from public.projects where user_id = :B),
  'deleting an account removes its profile and projects');

select 'ALL TESTS PASSED' as result;
