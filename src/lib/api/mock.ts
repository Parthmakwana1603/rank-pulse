// Mock responses keyed by API path (see the API inventory in BACKEND_SPECIFICATION.md §7).
// Each value is what the endpoint's `data` field would contain.
import * as seo from '@/lib/seo-data';

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
    keywordTable: seo.keywordTable,
    auditIssues: seo.auditIssues,
    backlinkStats: seo.backlinkStats,
    anchorTextDistribution: seo.anchorTextDistribution,
    followNofollow: seo.followNofollow,
    topReferringDomains: seo.topReferringDomains,
    competitors: seo.competitors,
    aiSeoMetrics: seo.aiSeoMetrics,
    coreWebVitals: seo.coreWebVitals,
  }),
  '/activities': () => seo.recentActivities,
  '/notifications': () => seo.notifications,

  '/projects': () => seo.projectList,

  '/keywords': () => seo.keywordFullTable,
  '/keywords/summary': () => seo.keywordSummary,

  '/audit/checks': () => seo.auditChecks,
  '/audit/history': () => seo.auditHistory,

  '/backlinks': () => seo.backlinkTable,
  '/backlinks/stats': () => seo.backlinkStats,
  '/backlinks/growth': () => seo.backlinkGrowth,
  '/backlinks/anchor-distribution': () => seo.anchorTextDistribution,
  '/backlinks/follow-nofollow': () => seo.followNofollow,
  '/backlinks/top-domains': () => seo.topReferringDomains,

  '/competitors': () => seo.competitors,
  '/competitors/keyword-comparison': () => seo.competitorKeywords,
  '/competitors/gap-analysis': () => seo.competitorGap,

  '/content': () => seo.contentList,
  '/content/stats': () => seo.contentStats,

  '/ai-seo/metrics': () => seo.aiSeoFullMetrics,
  '/ai-seo/trend': () => seo.aiTrend,
  '/ai-seo/mentions-by-platform': () => seo.aiMentionsByPlatform,
  '/ai-seo/recommendations': () => seo.aiRecommendations,

  '/reports': () => seo.reportList,
  '/reports/templates': () => seo.reportTemplates,

  '/settings/notifications': () => seo.notificationSettings,
  '/settings/integrations': () => seo.integrations,
  '/settings/billing': () => seo.planInfo,
};
