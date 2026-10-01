import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { HttpError } from '../utils/http-error.js';
import { errorFields, logger } from '../utils/logger.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `No endpoint for ${req.method} ${req.path}.` });
}

// Express recognises error handlers by their four parameters, so `_next` must stay.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let status = 500;
  let message = 'Something went wrong. Please try again.';
  let details: unknown;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    if (status < 500) details = err.details;
  } else if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large.' : 'The upload could not be read.';
  } else if (isBodyParserError(err)) {
    status = err.status;
    message = err.type === 'entity.too.large' ? 'The request is too large.' : 'The request body is not valid JSON.';
  }

  if (status >= 500) {
    logger.error('Request failed', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ...errorFields(err),
      ...(err instanceof HttpError && err.details ? { cause: err.details } : {}),
    });
  }

  if (res.headersSent) return;
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}

function isBodyParserError(err: unknown): err is { status: number; type: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number' &&
    String((err as { type: unknown }).type).startsWith('entity.')
  );
}
