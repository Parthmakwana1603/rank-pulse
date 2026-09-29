import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type * as seo from '@/lib/seo-data';
import { apiGet } from './client';
import { addSampleProjects, createProject, deleteProject } from './projects';

function useApi<T>(path: string) {
  return useQuery<T, Error>({
    queryKey: [path],
    queryFn: ({ signal }) => apiGet<T>(path, signal),
  });
}

export interface CombinedQuery<T> {
  data: T | undefined;
  error: Error | null;
  isPending: boolean;
  refetch: () => void;
}

type Results = Record<string, UseQueryResult<unknown, Error>>;
type DataOf<R extends Results> = { [K in keyof R]: NonNullable<R[K]['data']> };

/** Merges several queries into one result that has data only when all of them do. */
export function combine<R extends Results>(results: R): CombinedQuery<DataOf<R>> {
  const list = Object.values(results);
  const error = list.find((r) => r.error)?.error ?? null;
  const ready = list.every((r) => r.data !== undefined);
  return {
    data: ready
      ? (Object.fromEntries(Object.entries(results).map(([key, r]) => [key, r.data])) as DataOf<R>)
      : undefined,
    error,
    isPending: !ready && !error,
    refetch: () => {
      for (const r of list) if (r.error || r.data === undefined) void r.refetch();
    },
  };
}

// ── Endpoint hooks (one per GET in BACKEND_SPECIFICATION.md §7) ─────────────

export interface DashboardSummary {
  kpis: typeof seo.kpis;
  trafficTrend: typeof seo.trafficTrend;
  keywordDistribution: typeof seo.keywordDistribution;
  trafficSources: typeof seo.trafficSources;
  countryTraffic: typeof seo.countryTraffic;
  deviceBreakdown: typeof seo.deviceBreakdown;
  monthlyGrowth: typeof seo.monthlyGrowth;
  topLandingPages: typeof seo.topLandingPages;
  keywordTable: typeof seo.keywordTable;
  auditIssues: typeof seo.auditIssues;
  backlinkStats: typeof seo.backlinkStats;
  anchorTextDistribution: typeof seo.anchorTextDistribution;
  followNofollow: typeof seo.followNofollow;
  topReferringDomains: typeof seo.topReferringDomains;
  competitors: typeof seo.competitors;
  aiSeoMetrics: typeof seo.aiSeoMetrics;
  coreWebVitals: typeof seo.coreWebVitals;
}

export const useDashboardSummary = () => useApi<DashboardSummary>('/dashboard/summary');
export const useActivities = () => useApi<typeof seo.recentActivities>('/activities');
export const useNotifications = () => useApi<typeof seo.notifications>('/notifications');
export const useProjects = () => useApi<typeof seo.projectList>('/projects');
export const useKeywords = () => useApi<typeof seo.keywordFullTable>('/keywords');
export const useKeywordSummary = () => useApi<typeof seo.keywordSummary>('/keywords/summary');
export const useAuditChecks = () => useApi<typeof seo.auditChecks>('/audit/checks');
export const useAuditHistory = () => useApi<typeof seo.auditHistory>('/audit/history');
export const useBacklinks = () => useApi<typeof seo.backlinkTable>('/backlinks');
export const useBacklinkStats = () => useApi<typeof seo.backlinkStats>('/backlinks/stats');
export const useBacklinkGrowth = () => useApi<typeof seo.backlinkGrowth>('/backlinks/growth');
export const useAnchorDistribution = () =>
  useApi<typeof seo.anchorTextDistribution>('/backlinks/anchor-distribution');
export const useFollowNofollow = () => useApi<typeof seo.followNofollow>('/backlinks/follow-nofollow');
export const useTopReferringDomains = () =>
  useApi<typeof seo.topReferringDomains>('/backlinks/top-domains');
export const useCompetitors = () => useApi<typeof seo.competitors>('/competitors');
export const useCompetitorKeywords = () =>
  useApi<typeof seo.competitorKeywords>('/competitors/keyword-comparison');
export const useCompetitorGap = () => useApi<typeof seo.competitorGap>('/competitors/gap-analysis');
export const useContent = () => useApi<typeof seo.contentList>('/content');
export const useContentStats = () => useApi<typeof seo.contentStats>('/content/stats');
export const useAiSeoMetrics = () => useApi<typeof seo.aiSeoFullMetrics>('/ai-seo/metrics');
export const useAiSeoTrend = () => useApi<typeof seo.aiTrend>('/ai-seo/trend');
export const useAiMentions = () =>
  useApi<typeof seo.aiMentionsByPlatform>('/ai-seo/mentions-by-platform');
export const useAiRecommendations = () =>
  useApi<typeof seo.aiRecommendations>('/ai-seo/recommendations');
export const useReports = () => useApi<typeof seo.reportList>('/reports');
export const useReportTemplates = () => useApi<typeof seo.reportTemplates>('/reports/templates');
export const useNotificationSettings = () =>
  useApi<typeof seo.notificationSettings>('/settings/notifications');
export const useIntegrations = () => useApi<typeof seo.integrations>('/settings/integrations');
export const useBilling = () => useApi<typeof seo.planInfo>('/settings/billing');

// ── Screen hooks: everything one screen needs, as a single loading state ────

export const useDashboardData = () =>
  combine({ summary: useDashboardSummary(), activities: useActivities(), projects: useProjects() });

export const useKeywordRankingsData = () =>
  combine({ keywords: useKeywords(), summary: useKeywordSummary() });

export const useSiteAuditData = () =>
  combine({ checks: useAuditChecks(), history: useAuditHistory() });

export const useBacklinksData = () =>
  combine({
    backlinks: useBacklinks(),
    stats: useBacklinkStats(),
    growth: useBacklinkGrowth(),
    anchors: useAnchorDistribution(),
    followNofollow: useFollowNofollow(),
    topDomains: useTopReferringDomains(),
  });

export const useCompetitorsData = () =>
  combine({ competitors: useCompetitors(), keywords: useCompetitorKeywords(), gap: useCompetitorGap() });

export const useContentData = () => combine({ content: useContent(), stats: useContentStats() });

export const useAiSeoData = () =>
  combine({
    metrics: useAiSeoMetrics(),
    trend: useAiSeoTrend(),
    mentions: useAiMentions(),
    recommendations: useAiRecommendations(),
  });

export const useReportsData = () => combine({ reports: useReports(), templates: useReportTemplates() });

export const useSettingsData = () =>
  combine({
    notificationSettings: useNotificationSettings(),
    integrations: useIntegrations(),
    billing: useBilling(),
  });

// ── Mutations ───────────────────────────────────────────────────────────────

function useProjectMutation<TInput>(mutationFn: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, TInput>({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/projects'] }),
  });
}

export const useCreateProject = () => useProjectMutation(createProject);
export const useDeleteProject = () => useProjectMutation(deleteProject);
export const useAddSampleProjects = () => useProjectMutation<void>(addSampleProjects);
