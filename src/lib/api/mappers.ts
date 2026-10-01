// API responses (raw numbers, ISO dates, nulls) → the display shapes the screens render.
// Formatting and chart colours live here, not in the backend.
import { format, formatDistanceToNowStrict } from 'date-fns';
import type * as seo from '@/lib/seo-data';
import { formatBytes, formatCompactNumber, NO_VALUE } from '@/lib/utils';
import type { DashboardSummary } from './queries';
import type * as api from './types';
import type { AiMetric, AuditIssueDetail, AuditOverview, CompetitorComparison, NotificationsView } from './views';

const chartFill = (i: number) => `hsl(var(--chart-${(i % 5) + 1}))`;
const compact = (v: number | null) => (v === null ? NO_VALUE : formatCompactNumber(v));
export const relativeTime = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
const shortDate = (iso: string) => format(new Date(iso), 'MMM d, yyyy');
const percentChange = (value: number | null, previous: number | null) =>
  value === null || previous === null || previous === 0 ? null : Math.round(((value - previous) / previous) * 1000) / 10;

/** Turns counts into whole-number percentages of the total. */
function shares<T extends { count: number }>(items: T[]) {
  const total = items.reduce((n, i) => n + i.count, 0);
  return items.map((i) => ({ item: i, value: total ? Math.round((i.count / total) * 100) : 0 }));
}

// ── Projects ───────────────────────────────────────────────────────────────

export const toProjectItem = (p: api.ProjectDto): seo.ProjectItem => ({
  id: p.id,
  name: p.name,
  websiteUrl: p.websiteUrl,
  favicon: p.favicon,
  status: p.status,
  traffic: compact(p.organicTraffic),
  keywords: p.keywordCount,
  health: p.healthScore,
  authority: p.authorityScore,
  lastAudit: p.lastAuditAt ? relativeTime(p.lastAuditAt) : 'not run yet',
  trend: [],
});

export const toProjects = (list: api.ProjectDto[]) => list.map(toProjectItem);

// ── Keywords ───────────────────────────────────────────────────────────────

export const toKeyword = (k: api.KeywordDto): seo.KeywordFull => ({
  id: k.id,
  keyword: k.keyword,
  volume: k.volume,
  difficulty: k.difficulty,
  cpc: k.cpc === null ? NO_VALUE : `$${k.cpc.toFixed(2)}`,
  rank: k.rank,
  previousRank: k.previousRank,
  url: k.rankingUrl ?? NO_VALUE,
  intent: k.intent,
  serp: k.serpFeature ?? NO_VALUE,
  trend30: k.rankHistory,
  searchEngine: k.searchEngine,
  device: k.device,
  addedAt: k.createdAt,
});

export const toKeywords = (list: api.KeywordDto[]) => list.map(toKeyword);

export const toKeywordSummary = (s: api.KeywordSummaryDto): seo.StatCard[] => [
  { label: 'Tracked Keywords', value: s.tracked.toLocaleString('en'), change: null },
  { label: 'Added (30 days)', value: s.addedLast30Days.toLocaleString('en'), change: null },
  { label: 'Top 10 Rankings', value: compact(s.top10), change: null },
  { label: 'Top 3 Rankings', value: compact(s.top3), change: null },
  { label: 'Lost Keywords', value: compact(s.lost), change: null },
  { label: 'Avg. Position', value: s.averagePosition === null ? NO_VALUE : s.averagePosition.toFixed(1), change: null },
];

// ── Site audit ─────────────────────────────────────────────────────────────

export const toAuditChecks = (list: api.AuditIssueDto[]): seo.AuditCheck[] =>
  list.map((i) => ({
    id: i.id,
    status: i.status,
    title: i.title,
    type: i.type,
    count: i.occurrences,
    pages: i.pages,
    description: i.description,
  }));

export const toAuditHistory = (list: api.AuditHistoryDto[]) =>
  list.map((h) => ({ date: format(new Date(h.finishedAt), 'MMM d'), errors: h.errors, warnings: h.warnings, notices: h.notices }));

export const toAuditOverview = (d: api.LatestAuditsDto): AuditOverview => {
  const active = d.latest && (d.latest.status === 'pending' || d.latest.status === 'running') ? d.latest : null;
  const health = d.lastCompleted?.healthScore ?? null;
  const prev = d.previousCompleted?.healthScore ?? null;
  return {
    health,
    change: health !== null && prev !== null ? health - prev : null,
    lastAuditAt: d.lastCompleted?.finishedAt ?? null,
    runningId: active?.id ?? null,
    lastError: d.latest?.status === 'failed' ? d.latest.errorMessage : null,
  };
};

export const toIssueDetail = (i: api.AuditIssueDetailDto): AuditIssueDetail => ({
  id: i.id,
  title: i.title,
  description: i.description,
  type: i.type,
  status: i.status,
  occurrences: i.occurrences,
  pages: i.pages,
  affectedPages: i.affectedPages,
  recommendations: i.recommendations,
});

// ── Backlinks ──────────────────────────────────────────────────────────────

const linkTypeLabel: Record<api.LinkType, seo.BacklinkRow['type']> = {
  follow: 'Follow',
  nofollow: 'Nofollow',
  ugc: 'UGC',
  sponsored: 'Sponsored',
};

const anchorLabel: Record<api.AnchorCategory, string> = {
  branded: 'Branded',
  exact: 'Exact Match',
  partial: 'Partial Match',
  'naked-url': 'Naked URL',
  generic: 'Generic',
};

export const toBacklinks = (list: api.BacklinkDto[]): seo.BacklinkRow[] =>
  list.map((b) => ({
    id: b.id,
    source: b.sourceDomain,
    authority: b.domainAuthority,
    target: b.targetPage,
    anchor: b.anchorText || NO_VALUE,
    type: linkTypeLabel[b.linkType],
    firstSeen: shortDate(b.firstSeenAt),
    change: null,
    disavowed: b.disavowed,
  }));

export const toBacklinkStats = (s: api.BacklinkStatsDto): seo.StatCard[] => [
  { label: 'Total Backlinks', value: s.total.toLocaleString('en'), change: null },
  { label: 'Referring Domains', value: s.referringDomains.toLocaleString('en'), change: null },
  { label: 'New Backlinks (30 days)', value: s.newLast30Days.toLocaleString('en'), change: null },
  { label: 'Disavowed', value: s.disavowed.toLocaleString('en'), change: null },
];

export const toBacklinkGrowth = (list: api.BacklinkGrowthDto) =>
  list.map((g) => ({ month: format(new Date(`${g.month}-01T00:00:00`), 'MMM'), new: g.new, lost: g.lost }));

export const toAnchorDistribution = (list: api.AnchorDistributionDto) =>
  shares(list).map(({ item, value }, i) => ({ name: anchorLabel[item.category], value, fill: chartFill(i) }));

export const toFollowNofollow = (list: api.LinkTypesDto) =>
  shares(list).map(({ item, value }, i) => ({ name: linkTypeLabel[item.type], value, fill: chartFill(i) }));

export const toTopDomains = (list: api.TopDomainsDto): seo.TopDomain[] =>
  list.map((d) => ({ domain: d.domain, authority: d.authority, backlinks: d.backlinks, change: null }));

// ── Competitors ────────────────────────────────────────────────────────────

export const toCompetitors = (list: api.CompetitorDto[]): seo.Competitor[] =>
  list.map((c) => ({
    id: c.id,
    name: c.displayName,
    isYou: c.isYou,
    traffic: compact(c.organicTraffic),
    keywords: compact(c.keywords),
    backlinks: compact(c.backlinks),
    authority: c.authority,
    trafficValue: c.trafficValue === null ? NO_VALUE : `$${formatCompactNumber(c.trafficValue)}`,
  }));

export const toComparison = (d: api.KeywordComparisonDto): CompetitorComparison => ({
  series: d.competitors.map((c) => ({ key: c.id, name: c.isYou ? 'You' : c.displayName, isYou: c.isYou })),
  rows: d.rows.map((r) => ({ keyword: r.keyword, ...r.positions })),
});

export const toGap = (g: api.GapDto): seo.GapView => g;

// ── Content ────────────────────────────────────────────────────────────────

const contentTypeLabel: Record<api.ContentDto['contentType'], seo.ContentItem['type']> = {
  blog: 'Blog',
  landing: 'Landing',
  tool: 'Tool',
  guide: 'Guide',
};

const contentStatusLabel: Record<api.ContentDto['status'], seo.ContentItem['status']> = {
  draft: 'Draft',
  published: 'Published',
  'needs-update': 'Needs Update',
  outdated: 'Outdated',
};

export const toContent = (list: api.ContentDto[]): seo.ContentItem[] =>
  list.map((c) => ({
    id: c.id,
    title: c.title,
    url: c.urlPath,
    type: contentTypeLabel[c.contentType],
    traffic: c.traffic,
    keywords: c.rankingKeywords,
    score: c.score ?? 0,
    status: contentStatusLabel[c.status],
    updated: relativeTime(c.updatedAt),
    primaryKeyword: c.primaryKeyword,
    targetKeywords: c.targetKeywords,
    metaDescription: c.metaDescription,
  }));

export const toContentStats = (s: api.ContentStatsDto): seo.StatCard[] => [
  { label: 'Total Pages', value: s.total.toLocaleString('en'), change: null },
  { label: 'Published', value: s.published.toLocaleString('en'), change: null },
  { label: 'Needs Update', value: s.needsUpdate.toLocaleString('en'), change: null },
  { label: 'Drafts', value: s.drafts.toLocaleString('en'), change: null },
];

// ── Dashboard ──────────────────────────────────────────────────────────────

const kpiDisplay: Record<api.KpiKey, { label: string; accent: seo.Kpi['accent']; format: (v: number) => string; showChange?: boolean }> = {
  'site-health': { label: 'Site Health', accent: 'accent', format: (v) => `${v}%`, showChange: true },
  'open-issues': { label: 'Open Audit Issues', accent: 'warning', format: (v) => v.toLocaleString('en') },
  'pages-crawled': { label: 'Pages Crawled', accent: 'primary', format: (v) => v.toLocaleString('en'), showChange: true },
  'tracked-keywords': { label: 'Tracked Keywords', accent: 'chart-4', format: (v) => v.toLocaleString('en') },
  backlinks: { label: 'Backlinks', accent: 'chart-4', format: (v) => v.toLocaleString('en') },
  'referring-domains': { label: 'Referring Domains', accent: 'accent', format: (v) => v.toLocaleString('en') },
  competitors: { label: 'Competitors', accent: 'primary', format: (v) => v.toLocaleString('en') },
  'content-pages': { label: 'Content Pages', accent: 'primary', format: (v) => v.toLocaleString('en') },
};

export const toDashboard = (d: api.DashboardSummaryDto): DashboardSummary => ({
  kpis: d.kpis.map((k) => {
    const display = kpiDisplay[k.key];
    return {
      id: k.key,
      label: display.label,
      value: k.value === null ? NO_VALUE : display.format(k.value),
      change: display.showChange ? percentChange(k.value, k.previous) : null,
      trend: k.history,
      accent: display.accent,
    };
  }),
  trafficTrend: [],
  keywordDistribution: [],
  trafficSources: [],
  countryTraffic: [],
  deviceBreakdown: [],
  monthlyGrowth: [],
  topLandingPages: [],
  keywordTable: toKeywords(d.keywords),
  auditIssues: d.auditIssues.filter((i) => i.status === 'open').map((i) => ({ id: i.id, type: i.type, title: i.title, count: i.occurrences })),
  backlinkStats: toBacklinkStats(d.backlinks.stats),
  anchorTextDistribution: toAnchorDistribution(d.backlinks.anchors),
  followNofollow: toFollowNofollow(d.backlinks.linkTypes),
  topReferringDomains: toTopDomains(d.backlinks.topDomains),
  competitors: toCompetitors(d.competitors),
  aiSeoMetrics: [],
  coreWebVitals: [],
});

// ── Feed ───────────────────────────────────────────────────────────────────

export const toActivities = (list: api.ActivityDto[]): seo.Activity[] =>
  list.map((a) => ({ id: a.id, type: a.type, title: a.title, description: a.description, time: relativeTime(a.createdAt) }));

export const toNotifications = (d: api.NotificationsDto): NotificationsView => ({
  unreadCount: d.unreadCount,
  items: d.items.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    time: formatDistanceToNowStrict(new Date(n.createdAt)),
    read: n.read,
  })),
});

// ── AI SEO (empty until a provider is connected) ───────────────────────────

export const toAiMetrics = (list: api.AiSeoMetricDto[]): AiMetric[] =>
  list.map((m) => ({ label: m.key, value: m.value, change: m.change ?? 0, target: m.target ?? 100, description: '' }));
export const toAiTrend = (list: { weekStart: string; visibility: number; mentions: number }[]) =>
  list.map((t) => ({ week: format(new Date(t.weekStart), 'MMM d'), visibility: t.visibility, mentions: t.mentions }));
export const toAiMentions = (list: { platform: string; mentions: number }[]) => {
  const total = list.reduce((n, p) => n + p.mentions, 0);
  return list.map((p) => ({ platform: p.platform, mentions: p.mentions, share: total ? Math.round((p.mentions / total) * 100) : 0 }));
};
export const toAiRecommendations = (list: { title: string; impact: 'High' | 'Medium' | 'Low'; expectedGain: string }[]) =>
  list.map((r) => ({ title: r.title, impact: r.impact, score: r.expectedGain }));

// ── Reports ────────────────────────────────────────────────────────────────

const templateType: Record<string, seo.ReportItem['type']> = {
  'technical-audit': 'Audit',
  'competitor-benchmark': 'Competitor',
};

const reportStatus: Record<api.ReportDto['status'], seo.ReportItem['status']> = {
  pending: 'Generating',
  running: 'Generating',
  completed: 'Ready',
  failed: 'Failed',
};

export const toReport = (r: api.ReportDto): seo.ReportItem => ({
  id: r.id,
  name: `${r.name} (${r.format.toUpperCase()})`,
  type: templateType[r.template] ?? 'Custom',
  date: shortDate(r.createdAt),
  status: reportStatus[r.status],
  size: r.fileSize === null ? NO_VALUE : formatBytes(r.fileSize),
  errorMessage: r.errorMessage,
});

export const toReports = (list: api.ReportDto[]) => list.map(toReport);

export const toTemplates = (list: api.ReportTemplateDto[]): seo.ReportTemplate[] =>
  list.map((t) => ({ key: t.key, name: t.name, description: t.description, icon: t.icon, defaultSections: t.defaultSections }));

// ── Settings ───────────────────────────────────────────────────────────────

export const notificationLabels: Record<string, string> = {
  audit_completed: 'Site audit completed',
  new_backlink: 'New backlink found',
  keyword_ranking_changed: 'Keyword ranking changed',
  lost_ranking: 'Lost keyword ranking',
  report_ready: 'Report ready',
  ai_score_updated: 'AI score updated',
  competitor_movement: 'Competitor movement detected',
};

export const toNotificationSettings = (list: api.NotificationPreferencesDto): seo.NotificationSetting[] =>
  list.map((p) => ({ key: p.key, label: notificationLabels[p.key] ?? p.key, email: p.email, push: p.push }));

export const toIntegrations = (list: api.IntegrationsDto): seo.Integration[] =>
  list.map((i) => ({ key: i.key, name: i.name, description: i.description, connected: i.connected, available: i.available }));

const planNames: Record<api.BillingDto['plan'], string> = { free: 'Free Plan', pro: 'Pro Plan', enterprise: 'Enterprise Plan' };

export const toBilling = (b: api.BillingDto): seo.BillingView => ({
  name: planNames[b.plan],
  price: b.price === null ? null : `$${b.price}`,
  cycle: b.price === null ? '' : '/month',
  renewal: b.renewalDate ? shortDate(b.renewalDate) : null,
  limits: [
    { label: 'Projects', value: `${b.usage.projects} in use` },
    { label: 'Keywords', value: `${b.usage.keywords.toLocaleString('en')} tracked` },
    { label: 'Reports', value: `${b.usage.reportsThisMonth} this month` },
  ],
  billingAvailable: b.billingAvailable,
  invoices: [],
});
