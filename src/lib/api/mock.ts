// Demo-mode data keyed by API path (used only when Supabase isn't configured).
// Each value is already in the display shape the screens render.
import * as seo from '@/lib/seo-data';
import type { AuditIssueDetail, AuditOverview, CompetitorComparison, NotificationsView } from './views';

/** Stable ids for demo rows, so detail views can look them up like real data. */
const withIds = <T extends object>(list: T[], prefix: string) => list.map((item, i) => ({ id: `${prefix}-${i}`, ...item }));

const demoFixes = [
  'Run a full site crawl to identify all affected URLs',
  'Set up 301 redirects for broken links to relevant pages',
  'Update internal links pointing to removed pages',
  'Submit an updated XML sitemap to Google Search Console',
];

const demoAffectedPages = [
  { url: '/blog/old-post-1', statusCode: 404, detail: 'High severity' },
  { url: '/products/discontinued', statusCode: 404, detail: 'High severity' },
  { url: '/landing/campaign-2023', statusCode: 500, detail: 'Critical' },
  { url: '/help/faq-old', statusCode: 404, detail: 'Medium severity' },
];

export const mockRoutes: Record<string, () => unknown> = {
  '/dashboard/summary': () => ({
    kpis: seo.kpis,
    trafficTrend: seo.trafficTrend,
    keywordDistribution: seo.keywordDistribution,
    trafficSources: seo.trafficSources,
    countryTraffic: seo.countryTraffic,
    deviceBreakdown: seo.deviceBreakdown,
    monthlyGrowth: seo.monthlyGrowth,
    topLandingPages: seo.topLandingPages,
    keywordTable: withIds(seo.keywordTable, 'demo-kw'),
    auditIssues: withIds(seo.auditIssues, 'demo-check'),
    backlinkStats: seo.backlinkStats,
    anchorTextDistribution: seo.anchorTextDistribution,
    followNofollow: seo.followNofollow,
    topReferringDomains: seo.topReferringDomains,
    competitors: seo.competitors,
    aiSeoMetrics: seo.aiSeoMetrics,
    coreWebVitals: seo.coreWebVitals,
  }),
  '/activities': () => seo.recentActivities,
  '/notifications': (): NotificationsView => ({ items: seo.notifications, unreadCount: seo.notifications.length }),

  '/projects': () => seo.projectList,

  '/keywords': () => withIds(seo.keywordFullTable, 'demo-kw'),
  '/keywords/summary': () => seo.keywordSummary,

  '/audit/checks': () => withIds(seo.auditChecks, 'demo-check').map((c) => ({ status: 'open', ...c })),
  '/audit/history': () => seo.auditHistory,
  '/audit/latest': (): AuditOverview => ({
    health: 94,
    change: 2,
    lastAuditAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    runningId: null,
    lastError: null,
  }),

  '/backlinks': () => withIds(seo.backlinkTable, 'demo-bl'),
  '/backlinks/stats': () => seo.backlinkStats,
  '/backlinks/growth': () => seo.backlinkGrowth,
  '/backlinks/anchor-distribution': () => seo.anchorTextDistribution,
  '/backlinks/follow-nofollow': () => seo.followNofollow,
  '/backlinks/top-domains': () => seo.topReferringDomains,

  '/competitors': () => seo.competitors,
  '/competitors/keyword-comparison': (): CompetitorComparison => ({
    series: [
      { key: 'you', name: 'You', isYou: true },
      { key: 'compA', name: 'Competitor A', isYou: false },
      { key: 'compB', name: 'Competitor B', isYou: false },
      { key: 'compC', name: 'Competitor C', isYou: false },
    ],
    rows: seo.competitorKeywords,
  }),
  '/competitors/gap-analysis': () => seo.competitorGap,

  '/content': () => withIds(seo.contentList, 'demo-content'),
  '/content/stats': () => seo.contentStats,

  '/ai-seo/metrics': () => seo.aiSeoFullMetrics,
  '/ai-seo/trend': () => seo.aiTrend,
  '/ai-seo/mentions-by-platform': () => seo.aiMentionsByPlatform,
  '/ai-seo/recommendations': () => seo.aiRecommendations,

  '/reports': () => withIds(seo.reportList, 'demo-report'),
  '/reports/templates': () => seo.reportTemplates,

  '/settings/notifications': () => seo.notificationSettings,
  '/settings/integrations': () => seo.integrations,
  '/settings/billing': () => seo.planInfo,

  '/profile': () => ({
    id: 'demo',
    email: 'jamie@acme.com',
    name: 'Jamie Doe',
    company: 'Acme Corporation',
    jobTitle: 'SEO Manager',
    plan: 'pro',
    role: 'owner',
    avatarUrl: null,
  }),
};

/** Demo data for paths with an id in them. */
export function mockDynamic(path: string): unknown {
  const issue = /^\/audit\/issues\/(.+)$/.exec(path);
  if (issue) {
    const check = withIds(seo.auditChecks, 'demo-check').find((c) => c.id === issue[1]);
    if (!check) return undefined;
    const detail: AuditIssueDetail = {
      id: check.id,
      title: check.title,
      description: check.description,
      type: check.type,
      status: 'open',
      occurrences: check.count,
      pages: check.pages,
      affectedPages: demoAffectedPages,
      recommendations: demoFixes,
    };
    return detail;
  }
  return undefined;
}
