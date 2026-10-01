# Supabase

RankPulse uses [Supabase](https://supabase.com) for accounts (Supabase Auth), its PostgreSQL
database and file storage. The browser signs in with Supabase directly; everything else goes
through the Express API in `backend/`, which talks to Supabase *as the signed-in user*. For the
full setup (frontend + backend), see [`BACKEND_SETUP.md`](../BACKEND_SETUP.md).

Without Supabase keys the frontend runs in **demo mode**: any email logs in and every screen shows
built-in sample data.

## What is stored

| Migration | Tables / objects |
|---|---|
| `20260929000000_auth_and_projects.sql` | `profiles` (created on sign-up), `projects`, `project_keywords`, `create_project()` |
| `20260930000000_seo_data.sql` | `audit_runs`, `audit_issues`, `audit_issue_pages`, `backlinks`, `competitors`, `content_pages`, `activities`, `notifications`, `notification_preferences`, `reports`, `owns_project()`; adds `project_keywords.created_at` |
| `20260930000100_storage.sql` | Private Storage buckets `reports` and `avatars` with per-user folder policies |

Every table has **row-level security**. Project data is visible only to the project's owner
(`owns_project()`), and activities/notifications/preferences only to their user. Users can't change
their own role, plan or status, and can only mark notifications as read.

## Connect your own Supabase project (about 5 minutes)

1. **Create a project** at [supabase.com](https://supabase.com) (**New project**; save the database
   password somewhere).
2. **Create the tables.** Open **SQL Editor** → **New query**, paste the contents of each file in
   `supabase/migrations/` **in filename order**, and click **Run** for each. Each should report
   "Success. No rows returned". (With the Supabase CLI: `npx supabase db push`.)
3. **Copy your keys** from **Project Settings** → **API**: the **Project URL** and the **anon public** key.
   You don't need the `service_role` key; never put it in the frontend.
4. **Set the site URL.** **Authentication** → **URL Configuration** → **Site URL** =
   `http://localhost:5173` (confirmation and password-reset emails link back here).
5. Optional for development: turn off **Confirm email** under **Authentication** → **Sign In /
   Providers** → **Email** so new accounts can sign in immediately.
6. Put the keys in `.env.local` (frontend) and `backend/.env`, as described in `BACKEND_SETUP.md`.

## Tests

- `cd backend && npm test` applies `supabase/tests/auth_stub.sql` and every migration to an
  in-memory PostgreSQL ([PGlite](https://pglite.dev)) and checks the row-level-security rules and
  constraints (`backend/test/db/migrations.test.ts`). No Docker or Supabase account needed.
- `supabase/tests/rls_test.sql` is the original psql-based check of the first migration:

  ```
  psql -v ON_ERROR_STOP=1 -d <empty test db> -f supabase/tests/auth_stub.sql \
    -f supabase/migrations/20260929000000_auth_and_projects.sql \
    -f supabase/tests/rls_test.sql
  ```

- `backend/test/integration.supabase.test.ts` runs the whole API against a real (local or
  throwaway) Supabase project when `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY` are set. It
  creates accounts, so don't point it at production.
