/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the RankPulse API, e.g. https://api.example.com/api/v1. Unset = mock data. */
  readonly VITE_API_URL?: string;
  /** Supabase project URL, e.g. https://abcd1234.supabase.co. Unset = demo mode. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase "anon" public key (safe to expose; access is enforced by row-level security). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
