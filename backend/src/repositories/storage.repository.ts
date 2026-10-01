import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '../utils/http-error.js';

export type Bucket = 'reports' | 'avatars';

/** Uploads (or replaces) a file. Storage policies only allow paths under "<user id>/". */
export async function uploadFile(db: SupabaseClient, bucket: Bucket, path: string, body: Buffer, contentType: string) {
  const { error } = await db.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw new HttpError(500, 'Could not store the file. Please try again.', error);
}

export async function signedUrl(db: SupabaseClient, bucket: Bucket, path: string, expiresInSeconds: number, download?: string) {
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, expiresInSeconds, download ? { download } : undefined);
  if (error || !data) throw new HttpError(500, 'Could not create a download link. Please try again.', error);
  return data.signedUrl;
}

export async function removeFile(db: SupabaseClient, bucket: Bucket, path: string) {
  const { error } = await db.storage.from(bucket).remove([path]);
  if (error) throw new HttpError(500, 'Could not delete the file. Please try again.', error);
}
