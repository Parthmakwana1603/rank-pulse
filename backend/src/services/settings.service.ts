import * as feedRepo from '../repositories/feed.repository.js';
import * as keywordsRepo from '../repositories/keywords.repository.js';
import * as profilesRepo from '../repositories/profiles.repository.js';
import * as projectsRepo from '../repositories/projects.repository.js';
import * as reportsRepo from '../repositories/reports.repository.js';
import type { Ctx } from '../utils/context.js';
import { notificationEventKeys } from '../validators/resources.js';

type EventKey = (typeof notificationEventKeys)[number];

/** Defaults shown before a user changes anything (the values the settings screen started with). */
export const preferenceDefaults: Record<EventKey, { email: boolean; push: boolean }> = {
  audit_completed: { email: true, push: true },
  new_backlink: { email: true, push: false },
  keyword_ranking_changed: { email: false, push: true },
  lost_ranking: { email: true, push: true },
  report_ready: { email: true, push: false },
  ai_score_updated: { email: false, push: true },
  competitor_movement: { email: false, push: false },
};

export async function getNotificationPreferences(ctx: Ctx) {
  const saved = new Map((await feedRepo.listPreferences(ctx.db)).map((p) => [p.event_key, p]));
  return notificationEventKeys.map((key) => ({
    key,
    email: saved.get(key)?.email ?? preferenceDefaults[key].email,
    push: saved.get(key)?.push ?? preferenceDefaults[key].push,
  }));
}

export async function setNotificationPreference(ctx: Ctx, key: EventKey, value: { email: boolean; push: boolean }) {
  await feedRepo.upsertPreference(ctx.db, ctx.userId, { event_key: key, ...value });
  return { key, ...value };
}

/**
 * Third-party integrations are listed so the settings screen can show them, but none can be
 * connected yet: each needs OAuth app credentials and a provider decision (BACKEND_BLOCKERS.md).
 */
export const integrationCatalog = [
  { key: 'google-search-console', name: 'Google Search Console', description: 'Search performance and indexing data' },
  { key: 'google-analytics-4', name: 'Google Analytics 4', description: 'Traffic and user behavior metrics' },
  { key: 'looker-studio', name: 'Google Looker Studio', description: 'Build custom SEO dashboards' },
  { key: 'slack', name: 'Slack', description: 'Send alerts and reports to channels' },
  { key: 'zapier', name: 'Zapier', description: 'Automate workflows with other apps' },
  { key: 'ahrefs', name: 'Ahrefs API', description: 'Pull backlink and keyword data' },
];

export function listIntegrations() {
  return integrationCatalog.map((i) => ({ ...i, connected: false, available: false }));
}

/** Plan and real usage. Prices, renewals and invoices need a billing provider (not set up). */
export async function getBilling(ctx: Ctx) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [profile, projects, keywords, reports] = await Promise.all([
    profilesRepo.findProfile(ctx.db, ctx.userId),
    projectsRepo.listProjects(ctx.db),
    keywordsRepo.countKeywords(ctx.db),
    reportsRepo.countReportsSince(ctx.db, monthStart.toISOString()),
  ]);
  return {
    plan: profile?.plan ?? 'free',
    usage: { projects: projects.length, keywords, reportsThisMonth: reports },
    price: null,
    renewalDate: null,
    invoices: [] as never[],
    billingAvailable: false,
  };
}
