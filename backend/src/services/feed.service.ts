// Activity feed and notifications.
import * as repo from '../repositories/feed.repository.js';
import type { ActivityType } from '../repositories/feed.repository.js';
import type { Ctx } from '../utils/context.js';
import { notFound } from '../utils/http-error.js';
import { errorFields, logger } from '../utils/logger.js';

export interface ActivityDto {
  id: string;
  projectId: string | null;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  projectId: string | null;
  eventKey: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}

/**
 * Records an activity. Best effort: a failure is logged but never fails the action that caused
 * it (the user's project was still created even if the feed entry wasn't).
 */
export async function recordActivity(
  ctx: Ctx,
  entry: { projectId: string | null; type: ActivityType; title: string; description?: string }
) {
  try {
    await repo.insertActivity(ctx.db, {
      project_id: entry.projectId,
      type: entry.type,
      title: entry.title,
      description: entry.description ?? '',
    });
  } catch (err) {
    logger.warn('Could not record activity', { userId: ctx.userId, type: entry.type, ...errorFields(err) });
  }
}

/** Creates an in-app notification. Best effort, like recordActivity. */
export async function notify(
  ctx: Ctx,
  entry: { projectId: string | null; eventKey: string; title: string; description?: string }
) {
  try {
    await repo.insertNotification(ctx.db, {
      project_id: entry.projectId,
      event_key: entry.eventKey,
      title: entry.title,
      description: entry.description ?? '',
    });
  } catch (err) {
    logger.warn('Could not create notification', { userId: ctx.userId, eventKey: entry.eventKey, ...errorFields(err) });
  }
}

export async function listActivities(ctx: Ctx, projectId?: string): Promise<ActivityDto[]> {
  const rows = await repo.listActivities(ctx.db, projectId, 20);
  return rows.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    type: r.type,
    title: r.title,
    description: r.description,
    createdAt: r.created_at,
  }));
}

export async function listNotifications(ctx: Ctx): Promise<{ items: NotificationDto[]; unreadCount: number }> {
  const [rows, unreadCount] = await Promise.all([repo.listNotifications(ctx.db, 20), repo.countUnread(ctx.db)]);
  return {
    unreadCount,
    items: rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      eventKey: r.event_key,
      title: r.title,
      description: r.description,
      read: r.read_at !== null,
      createdAt: r.created_at,
    })),
  };
}

export async function markRead(ctx: Ctx, id: string) {
  const changed = await repo.markNotificationsRead(ctx.db, id);
  if (changed === 0) {
    // Either already read (fine) or not the user's notification: check which.
    const { items } = await listNotifications(ctx);
    if (!items.some((n) => n.id === id)) throw notFound('Notification not found.');
  }
}

export async function markAllRead(ctx: Ctx) {
  await repo.markNotificationsRead(ctx.db);
}
