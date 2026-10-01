import type { Response } from 'express';

/** Success envelope expected by the frontend's src/lib/api/http.ts: { success: true, data }. */
export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export const created = <T>(res: Response, data: T) => ok(res, data, 201);
export const accepted = <T>(res: Response, data: T) => ok(res, data, 202);
export const noContent = (res: Response) => res.status(204).end();
