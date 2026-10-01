// Display shapes for screens that the original mock data didn't cover.
import type { NotificationItem } from '@/lib/seo-data';

export interface NotificationsView {
  items: NotificationItem[];
  unreadCount: number;
}

/** Site health card + running-audit banner on the Site Audit screen. */
export interface AuditOverview {
  health: number | null;
  /** Change in health points since the previous audit. */
  change: number | null;
  lastAuditAt: string | null;
  /** The audit in progress, if any. */
  runningId: string | null;
  /** Message of the latest audit if it failed. */
  lastError: string | null;
}

export interface CompetitorComparison {
  series: { key: string; name: string; isYou: boolean }[];
  rows: Record<string, string | number | null>[];
}

export interface AuditIssueDetail {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'notice';
  status: 'open' | 'fixed';
  occurrences: number;
  pages: number;
  affectedPages: { url: string; statusCode: number | null; detail: string | null }[];
  recommendations: string[];
}

export interface AiMetric {
  label: string;
  value: number;
  change: number;
  target: number;
  description: string;
}
