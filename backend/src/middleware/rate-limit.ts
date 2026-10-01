import type { Request } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const message = { success: false, message: 'Too many requests. Please wait a moment and try again.' };

/** Whole-API limit per client IP. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message,
});

/**
 * Limit for endpoints that start expensive work (crawls, report files, imports). Keyed by
 * user so one account can't monopolise the server. Mount after requireAuth.
 */
export const jobLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  message,
});
