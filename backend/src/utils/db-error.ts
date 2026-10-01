import type { PostgrestError } from '@supabase/supabase-js';
import { HttpError } from './http-error.js';

type DbError = Pick<PostgrestError, 'code' | 'message'>;

/**
 * Maps a PostgREST/Postgres error to an HttpError. `conflictMessage` is used for unique
 * violations, which callers usually know how to describe ("already tracked", …).
 */
export function fromDbError(error: DbError, conflictMessage = 'That already exists.'): HttpError {
  switch (error.code) {
    case '23505':
      return new HttpError(409, conflictMessage);
    case '23514':
    case '23502':
    case '22P02':
      return new HttpError(400, 'Some of the details are invalid.');
    case '22023':
      return new HttpError(400, error.message);
    case '23503':
      return new HttpError(404, 'A related record no longer exists.');
    case '42501':
      return new HttpError(403, "You don't have permission to do that.");
    case 'PGRST301':
    case 'PGRST303':
      return new HttpError(401, 'Your session has expired. Please sign in again.');
    default:
      return new HttpError(500, 'Something went wrong while saving your data. Please try again.', error);
  }
}

/** Unwraps a Supabase query result, throwing an HttpError on failure. */
export function unwrap<T>(result: { data: T; error: DbError | null }, conflictMessage?: string): T {
  if (result.error) throw fromDbError(result.error, conflictMessage);
  return result.data;
}
