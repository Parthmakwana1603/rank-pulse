import type { NextFunction, Request, Response } from 'express';
import { createUserClient } from '../config/supabase.js';
import { verifyAccessToken } from '../services/auth.service.js';
import { unauthorized } from '../utils/http-error.js';

/**
 * Requires `Authorization: Bearer <Supabase access token>`. On success sets req.user and
 * req.db (a Supabase client acting as that user); otherwise responds 401.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '');
  if (!match) throw unauthorized();
  const token = match[1];
  req.user = await verifyAccessToken(token);
  req.db = createUserClient(token);
  next();
}
