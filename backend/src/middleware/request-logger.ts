import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/** Logs method, path, status and duration. Never logs headers, bodies or query strings. */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      method: req.method,
      path: req.baseUrl + req.path,
      status: res.statusCode,
      ms: Math.round(ms),
      userId: req.user?.id,
    });
  });
  next();
}
