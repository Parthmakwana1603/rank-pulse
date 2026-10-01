# RankPulse: running the full stack

```
rank-pulse/
├── src/, index.html, package.json   frontend (React + Vite)          → http://localhost:5173
├── backend/                         REST API (Express + TypeScript)  → http://localhost:5000/api
└── supabase/                        database migrations and SQL tests
```

```
Browser ──(sign in/up, session)──────────────────► Supabase Auth
   │
   │ TanStack Query → src/lib/api (fetch + Authorization: Bearer <Supabase access token>)
   ▼
Express API (backend/) → requireAuth (verifies the token with Supabase Auth)
   → controllers → services → repositories → Supabase PostgreSQL / Storage (as the user, RLS on)
```

## 1. Prerequisites

- Node.js 20 or newer (tested with 22) and npm.
- A Supabase project (free tier is fine), or run in **demo mode** without one (step 6).

## 2. Database (Supabase)

Follow [`supabase/README.md`](supabase/README.md): create the project, run the three files in
`supabase/migrations/` in filename order, set the Site URL to `http://localhost:5173`, and copy the
**Project URL** and **anon public** key.

## 3. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `backend/.env`:

| Variable | Required | Meaning |
|---|---|---|
| `SUPABASE_URL` | yes | Project URL |
| `SUPABASE_ANON_KEY` | yes | anon public key (the backend does **not** use the service_role key) |
| `PORT` | no (5000) | API port |
| `CORS_ORIGINS` | no (`http://localhost:5173`) | Comma-separated browser origins allowed to call the API |
| `RATE_LIMIT_MAX` | no (600) | Requests per 15 min per IP |
| `TRUST_PROXY` | no | Set (e.g. `1`) behind a load balancer |
| `AUDIT_ALLOW_PRIVATE_HOSTS` | no | Testing only: lets the crawler reach localhost/private IPs |

```bash
npm run dev                 # http://localhost:5000/api/health → {"success":true,"data":{"status":"ok"}}
```

## 4. Frontend

From the project root:

```bash
npm install
cp .env.example .env.local  # Windows PowerShell: Copy-Item .env.example .env.local
```

Edit `.env.local` (all `VITE_*` values are public and end up in the browser bundle):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev                 # http://localhost:5173
```

Vite reads `.env.local` only at start-up, so restart it after changing the file.

## 5. Try it

1. **Create one** on the login page (confirm the email unless you turned that off), then sign in.
2. **New Project** → enter a real website you're allowed to crawl → it becomes the selected project
   (top-bar picker; your choice is remembered).
3. **Keyword Rankings → Add Keywords**, **Backlinks → Add Backlink**, **Competitors → Add
   Competitor**, **Content → New Content**: each is saved and appears immediately.
4. **Site Audit → Run First Audit**: watch the crawl progress; results, history and the dashboard's
   site-health KPI update when it finishes. Open an issue to see affected pages and mark it fixed.
5. **Reports → New Report** (or **Export** on any page): the file is generated in the background,
   stored in Supabase Storage and downloadable when **Ready**.
6. Refresh the browser: everything is still there. Sign in as a second user: none of it is visible.

## 6. Demo mode

Leave `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` unset (no `.env.local`): any email + 6-character
password logs in, all screens show the built-in sample data (clearly labelled), projects can be
created/deleted in memory, and other changes are refused with an explanation. The backend isn't
needed in this mode.

If Supabase is configured but `VITE_API_URL` isn't, the app shows a configuration error instead of
sample data.

## 7. Authentication

- Sign-up, sign-in, sign-out, session restore, email confirmation and **password reset** ("Forgot
  password?" → email link → choose a new password) all use Supabase Auth from the browser
  (`src/lib/auth-context.tsx`). There is no second login system.
- Every API call sends `Authorization: Bearer <access token>` (`src/lib/api/http.ts`, token from
  `supabase.auth.getSession()`, refreshed automatically by supabase-js). No cookies are used.
- The API verifies the token with Supabase Auth on each request (`backend/src/middleware/auth.ts`),
  derives the user from it (never from the request body), and queries the database with that token,
  so row-level security enforces isolation. Services also check that the requested project belongs
  to the caller and answer 404 otherwise.

## 8. How the frontend uses the API

- `src/lib/api/queries.ts`: one entry per endpoint (path, whether it needs `?projectId=`, and a
  mapper). Project-scoped queries include the selected project id in their TanStack Query key, so
  switching projects loads that project's data.
- `src/lib/api/mappers.ts` turns raw API values (numbers, ISO dates, nulls) into what the screens
  display ("248.5K", "2 hours ago", chart colours, "—" for data no source provides yet).
- `src/lib/project-context.tsx`: the selected project (top bar), shared by all screens.
- Long jobs are polled: audit runs every 1.5 s, the Site Audit screen every 3 s while an audit runs,
  the report list every 3 s while a report is generating, notifications every 60 s.

## 9. Tests and checks

```bash
# frontend (project root)
npm run typecheck && npm run lint && npm test && npm run build

# backend
cd backend
npm run typecheck && npm run lint && npm test && npm run build
```

The backend suite includes SQL/row-level-security tests on an in-memory PostgreSQL (PGlite) and a
real crawl of a local test server. The end-to-end test against a real Supabase project
(`backend/test/integration.supabase.test.ts`) runs when `TEST_SUPABASE_URL` and
`TEST_SUPABASE_ANON_KEY` point at a throwaway or local project with "Confirm email" off.

## 10. Production notes

- **Backend:** `npm ci && npm run build && npm start` on any Node host. Set `NODE_ENV=production`,
  `CORS_ORIGINS=https://your-frontend.example`, `TRUST_PROXY` if behind a proxy. Stack traces are
  never sent to clients, and logs never include tokens or bodies. Put it behind HTTPS.
- **Jobs** run inside the API process (2 at a time). For several instances or heavy use, move them
  to a queue/worker (see `backend/README.md`).
- **Frontend:** `npm run build` → static `dist/`. The host must rewrite unknown paths to
  `index.html` (the app uses browser routing), e.g. Netlify `_redirects`: `/* /index.html 200`.
- **Supabase:** set Site URL / redirect URLs to the production frontend URL, keep "Confirm email"
  on, and apply new migrations before deploying new backend code.
- The site-audit crawler makes outbound requests to user-supplied sites; it blocks private
  networks, but consider running the API where outbound traffic is expected and allowed.
