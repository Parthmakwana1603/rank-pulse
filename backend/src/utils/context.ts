import type { Request } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unauthorized } from './http-error.js';

/** Everything a service needs to act on behalf of the signed-in user. */
export interface Ctx {
  userId: string;
  email: string;
  db: SupabaseClient;
}

export function ctxOf(req: Request): Ctx {
  if (!req.user || !req.db) throw unauthorized();
  return { userId: req.user.id, email: req.user.email, db: req.db };
}
