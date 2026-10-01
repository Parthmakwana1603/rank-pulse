import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth from the verified Supabase access token. */
      user?: { id: string; email: string };
      /** Supabase client acting as req.user (row-level security applies). Set by requireAuth. */
      db?: SupabaseClient;
    }
  }
}

export {};
