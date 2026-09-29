# Supabase backend

RankPulse uses [Supabase](https://supabase.com) for accounts (sign-up, login, sessions) and its
PostgreSQL database. Without Supabase keys the app runs in **demo mode**: any email logs in and all
data is sample data.

What is stored in Supabase so far:

| Table | Purpose |
|---|---|
| `profiles` | One row per user (name, plan, role). Created automatically on sign-up. |
| `projects` | The websites each user tracks. |
| `project_keywords` | Keywords entered when creating a project. |

Every table has **row-level security**: a signed-in user can only read and change their own rows.
All other screens (keywords, backlinks, audits…) still show sample data until their tables are added.

## Connect your own Supabase project (about 5 minutes)

1. **Create a project.** Sign in at [supabase.com](https://supabase.com), click **New project**, pick a
   name, a database password (save it somewhere) and a region near you. Wait until it finishes
   setting up.

2. **Create the tables.** In the project, open **SQL Editor** → **New query**. Open
   `supabase/migrations/20260929000000_auth_and_projects.sql` from this repo in VS Code, copy all of
   it, paste it into the editor and click **Run**. You should see "Success. No rows returned".

3. **Copy your keys.** Open **Project Settings** → **API** (called **API Keys** / **Data API** in newer
   dashboards) and copy the **Project URL** and the **anon public** key.

4. **Add them to the app.** In the project root (next to `package.json`) create a file named
   `.env.local` containing:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   `.env.local` is ignored by git, so the keys are not committed. The anon key is meant to be
   public; row-level security is what protects the data. **Never** put the `service_role` key here.

5. **Tell Supabase where the app runs.** Open **Authentication** → **URL Configuration** and set
   **Site URL** to `http://localhost:5173`. Confirmation emails link back to this address.

6. **Restart the app.** Stop `npm run dev` (Ctrl + C) and start it again, because Vite only reads
   `.env.local` on start-up. The login page no longer shows the "Demo mode" note.

7. **Create an account** with **Create one** on the login page. By default Supabase emails you a
   confirmation link first; click it, then sign in. To skip that while developing, turn off
   **Confirm email** under **Authentication** → **Sign In / Providers** → **Email**.

8. Open **Projects**. You start with none: add your own with **New Project**, or click
   **Add sample projects** to load the demo projects into your account.

To go back to demo mode, delete or rename `.env.local` and restart `npm run dev`.

## Tests

- `npm test` runs the unit tests. The Supabase integration tests in
  `src/lib/api/supabase.integration.test.ts` are skipped unless Supabase keys are set.
- To run them against a **local** Supabase (needs Docker and the
  [Supabase CLI](https://supabase.com/docs/guides/local-development)):

  ```
  npx supabase init        # once; keep the existing migrations folder
  npx supabase start       # prints the local API URL and anon key
  npx supabase db reset    # applies supabase/migrations
  ```

  Then run `npm test` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set to the printed
  values. Don't point these tests at your real project: they create throwaway accounts.
- `supabase/tests/rls_test.sql` checks the security rules directly in PostgreSQL. It runs on any
  empty PostgreSQL 15+ database after `supabase/tests/auth_stub.sql` (a minimal stand-in for
  Supabase's `auth` schema) and the migration, and stops at the first failing check:

  ```
  psql -v ON_ERROR_STOP=1 -d <empty test db> -f supabase/tests/auth_stub.sql \
    -f supabase/migrations/20260929000000_auth_and_projects.sql \
    -f supabase/tests/rls_test.sql
  ```
