// Activities, notifications and notification preferences.
import type { SupabaseClient } from '@supabase/supabase-js';
import { unwrap } from '../utils/db-error.js';

export type ActivityType = 'project' | 'keyword' | 'audit' | 'backlink' | 'competitor' | 'content' | 'report';

export interface ActivityRow {
  id: string;
  project_id: string | null;
  type: ActivityType;
  title: string;
  description: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  project_id: string | null;
  event_key: string;
  title: string;
  description: string;
  read_at: string | null;
  created_at: string;
}

export interface PreferenceRow {
  event_key: string;
  email: boolean;
  push: boolean;
}

export async function insertActivity(
  db: SupabaseClient,
  row: Pick<ActivityRow, 'project_id' | 'type' | 'title' | 'description'>
): Promise<void> {
  unwrap(await db.from('activities').insert(row));
}

export async function listActivities(db: SupabaseClient, projectId: string | undefined, limit: number): Promise<ActivityRow[]> {
  let query = db.from('activities').select('id, project_id, type, title, description, created_at');
  if (projectId) query = query.eq('project_id', projectId);
  return unwrap(await query.order('created_at', { ascending: false }).limit(limit)) as ActivityRow[];
}

export async function insertNotification(
  db: SupabaseClient,
  row: Pick<NotificationRow, 'project_id' | 'event_key' | 'title' | 'description'>
): Promise<void> {
  unwrap(await db.from('notifications').insert(row));
}

export async function listNotifications(db: SupabaseClient, limit: number): Promise<NotificationRow[]> {
  return unwrap(
    await db
      .from('notifications')
      .select('id, project_id, event_key, title, description, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
  ) as NotificationRow[];
}

export async function countUnread(db: SupabaseClient): Promise<number> {
  const { count, error } = await db.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  unwrap({ data: null, error });
  return count ?? 0;
}

export async function markNotificationsRead(db: SupabaseClient, id?: string): Promise<number> {
  let query = db.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (id) query = query.eq('id', id);
  const rows = unwrap(await query.select('id')) as unknown[];
  return rows.length;
}

export async function listPreferences(db: SupabaseClient): Promise<PreferenceRow[]> {
  return unwrap(await db.from('notification_preferences').select('event_key, email, push')) as PreferenceRow[];
}

export async function upsertPreference(db: SupabaseClient, userId: string, row: PreferenceRow): Promise<void> {
  unwrap(await db.from('notification_preferences').upsert({ user_id: userId, ...row }, { onConflict: 'user_id,event_key' }));
}
