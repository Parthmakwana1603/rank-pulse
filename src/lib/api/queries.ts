import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type * as seo from '@/lib/seo-data';
import { useProjectScope } from '@/lib/project-scope';
import { apiGet, apiSend, apiUpload, dataMode, fetchEndpoint, type Endpoint } from './client';
import * as map from './mappers';
import { createProject, deleteProject, importProjects, updateProject } from './projects';
import type * as api from './types';
import type { AiMetric, AuditIssueDetail, AuditOverview, CompetitorComparison, NotificationsView } from './views';

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

export interface DashboardSummary {
  kpis: seo.Kpi[];
  trafficTrend: typeof seo.trafficTrend;
  keywordDistribution: typeof seo.keywordDistribution;
  trafficSources: typeof seo.trafficSources;
  countryTraffic: typeof seo.countryTraffic;
  deviceBreakdown: typeof seo.deviceBreakdown;
  monthlyGrowth: typeof seo.monthlyGrowth;
  topLandingPages: typeof seo.topLandingPages;
  keywordTable: seo.KeywordRow[];
  auditIssues: seo.AuditIssue[];
  backlinkStats: seo.StatCard[];
  anchorTextDistribution: typeof seo.anchorTextDistribution;
  followNofollow: typeof seo.followNofollow;
  topReferringDomains: seo.TopDomain[];
  competitors: seo.Competitor[];
  aiSeoMetrics: typeof seo.aiSeoMetrics;
  coreWebVitals: typeof seo.coreWebVitals;
}

// ── Endpoints: API path, project scoping and response → display mapping ─────

const ep = <Raw, View>(path: string, scoped: boolean, mapFn: (raw: Raw) => View): Endpoint<Raw, View> => ({
  path,
  scoped,
  map: mapFn,
});

export const endpoints = {
  dashboardSummary: ep('/dashboard/summary', true, map.toDashboard),
  activities: ep('/activities', true, map.toActivities),
  notifications: ep('/notifications', false, map.toNotifications),
  projects: ep('/projects', false, map.toProjects),
  keywords: ep('/keywords', true, map.toKeywords),
  keywordSummary: ep('/keywords/summary', true, map.toKeywordSummary),
  auditChecks: ep('/audit/checks', true, map.toAuditChecks),
  auditHistory: ep('/audit/history', true, map.toAuditHistory),
  auditLatest: ep('/audit/latest', true, map.toAuditOverview),
  backlinks: ep('/backlinks', true, map.toBacklinks),
  backlinkStats: ep('/backlinks/stats', true, map.toBacklinkStats),
  backlinkGrowth: ep('/backlinks/growth', true, map.toBacklinkGrowth),
  anchorDistribution: ep('/backlinks/anchor-distribution', true, map.toAnchorDistribution),
  followNofollow: ep('/backlinks/follow-nofollow', true, map.toFollowNofollow),
  topReferringDomains: ep('/backlinks/top-domains', true, map.toTopDomains),
  competitors: ep('/competitors', true, map.toCompetitors),
  competitorKeywords: ep('/competitors/keyword-comparison', true, map.toComparison),
  competitorGap: ep('/competitors/gap-analysis', true, map.toGap),
  content: ep('/content', true, map.toContent),
  contentStats: ep('/content/stats', true, map.toContentStats),
  aiSeoMetrics: ep('/ai-seo/metrics', true, map.toAiMetrics),
  aiSeoTrend: ep('/ai-seo/trend', true, map.toAiTrend),
  aiMentions: ep('/ai-seo/mentions-by-platform', true, map.toAiMentions),
  aiRecommendations: ep('/ai-seo/recommendations', true, map.toAiRecommendations),
  reports: ep('/reports', true, map.toReports),
  reportTemplates: ep('/reports/templates', false, map.toTemplates),
  notificationSettings: ep('/settings/notifications', false, map.toNotificationSettings),
  integrations: ep('/settings/integrations', false, map.toIntegrations),
  billing: ep('/settings/billing', false, map.toBilling),
  profile: ep('/profile', false, (p: api.ProfileDto) => p),
};

type Options<View> = { refetchInterval?: number | false | ((data: View | undefined) => number | false) };

/**
 * Loads an endpoint. Project-scoped endpoints send the selected project's id and include it in
 * the query key, so switching projects loads that project's data.
 */
function useEndpoint<Raw, View>(endpoint: Endpoint<Raw, View>, options: Options<View> = {}) {
  const { projectId } = useProjectScope();
  const pid = endpoint.scoped ? projectId : undefined;
  const interval = options.refetchInterval;
  return useQuery<View, Error>({
    queryKey: endpoint.scoped ? [endpoint.path, pid] : [endpoint.path],
    queryFn: ({ signal }) => fetchEndpoint(endpoint, pid, signal),
    enabled: !endpoint.scoped || dataMode === 'demo' || !!pid,
    refetchInterval: typeof interval === 'function' ? (query) => interval(query.state.data) : interval,
  });
}

export const useDashboardSummary = () => useEndpoint(endpoints.dashboardSummary);
export const useActivities = () => useEndpoint(endpoints.activities);
export const useNotifications = () => useEndpoint(endpoints.notifications, { refetchInterval: 60_000 });
export const useProjects = () => useEndpoint(endpoints.projects);
export const useKeywords = () => useEndpoint(endpoints.keywords);
export const useKeywordSummary = () => useEndpoint(endpoints.keywordSummary);
export const useAuditChecks = () => useEndpoint(endpoints.auditChecks);
export const useAuditHistory = () => useEndpoint(endpoints.auditHistory);
/** Refreshes every few seconds while an audit is running. */
export const useAuditOverview = () =>
  useEndpoint<api.LatestAuditsDto, AuditOverview>(endpoints.auditLatest, { refetchInterval: (d) => (d?.runningId ? 3000 : false) });
export const useBacklinks = () => useEndpoint(endpoints.backlinks);
export const useBacklinkStats = () => useEndpoint(endpoints.backlinkStats);
export const useBacklinkGrowth = () => useEndpoint(endpoints.backlinkGrowth);
export const useAnchorDistribution = () => useEndpoint(endpoints.anchorDistribution);
export const useFollowNofollow = () => useEndpoint(endpoints.followNofollow);
export const useTopReferringDomains = () => useEndpoint(endpoints.topReferringDomains);
export const useCompetitors = () => useEndpoint(endpoints.competitors);
export const useCompetitorKeywords = () => useEndpoint<api.KeywordComparisonDto, CompetitorComparison>(endpoints.competitorKeywords);
export const useCompetitorGap = () => useEndpoint(endpoints.competitorGap);
export const useContent = () => useEndpoint(endpoints.content);
export const useContentStats = () => useEndpoint(endpoints.contentStats);
export const useAiSeoMetrics = () => useEndpoint<api.AiSeoMetricDto[], AiMetric[]>(endpoints.aiSeoMetrics);
export const useAiSeoTrend = () => useEndpoint(endpoints.aiSeoTrend);
export const useAiMentions = () => useEndpoint(endpoints.aiMentions);
export const useAiRecommendations = () => useEndpoint(endpoints.aiRecommendations);
/** Refreshes every few seconds while a report is being generated. */
export const useReports = () =>
  useEndpoint(endpoints.reports, { refetchInterval: (d) => (d?.some((r) => r.status === 'Generating') ? 3000 : false) });
export const useReportTemplates = () => useEndpoint(endpoints.reportTemplates);
export const useNotificationSettings = () => useEndpoint(endpoints.notificationSettings);
export const useIntegrations = () => useEndpoint(endpoints.integrations);
export const useBilling = () => useEndpoint(endpoints.billing);
export const useProfile = () => useEndpoint<api.ProfileDto, api.ProfileDto>(endpoints.profile);

/** One audit issue with its affected pages (GET /audit/issues/:id). */
export function useAuditIssue(id: string) {
  return useQuery<AuditIssueDetail, Error>({
    queryKey: ['/audit/issues', id],
    queryFn: async ({ signal }) => {
      const raw = await apiGet<api.AuditIssueDetailDto>(`/audit/issues/${encodeURIComponent(id)}`, { signal });
      return dataMode === 'demo' ? (raw as unknown as AuditIssueDetail) : map.toIssueDetail(raw);
    },
  });
}

/** An audit run, polled until it finishes. */
export function useAuditRun(id: string | null) {
  return useQuery<api.AuditRunDto, Error>({
    queryKey: ['/audit/runs', id],
    queryFn: ({ signal }) => apiGet<api.AuditRunDto>(`/audit/runs/${encodeURIComponent(id!)}`, { signal }),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data && ['completed', 'failed'].includes(query.state.data.status) ? false : 1500),
  });
}

/** A report, polled until its file is ready. */
export function useReportStatus(id: string | null) {
  return useQuery<api.ReportDto, Error>({
    queryKey: ['/reports/status', id],
    queryFn: ({ signal }) => apiGet<api.ReportDto>(`/reports/${encodeURIComponent(id!)}`, { signal }),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data && ['completed', 'failed'].includes(query.state.data.status) ? false : 1500),
  });
}

// ── Screen hooks: everything one screen needs, as a single loading state ────

export const useDashboardData = () =>
  combine({ summary: useDashboardSummary(), activities: useActivities(), projects: useProjects() });

export const useKeywordRankingsData = () => combine({ keywords: useKeywords(), summary: useKeywordSummary() });

export const useSiteAuditData = () =>
  combine({ checks: useAuditChecks(), history: useAuditHistory(), overview: useAuditOverview() });

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
    profile: useProfile(),
  });

// ── Mutations ───────────────────────────────────────────────────────────────

/** A mutation that refreshes the given API paths (for every project) when it succeeds. */
function useWrite<TInput, TResult = unknown>(mutationFn: (input: TInput) => Promise<TResult>, paths: string[]) {
  const queryClient = useQueryClient();
  return useMutation<TResult, Error, TInput>({
    mutationFn,
    onSuccess: () => Promise.all(paths.map((path) => queryClient.invalidateQueries({ queryKey: [path] }))).then(() => {}),
  });
}

const projectPaths = ['/projects', '/dashboard/summary', '/activities', '/settings/billing'];
const keywordPaths = ['/keywords', '/keywords/summary', ...projectPaths];
const auditPaths = ['/audit/latest', '/audit/checks', '/audit/history', '/audit/issues', ...projectPaths, '/notifications'];
const backlinkPaths = [
  '/backlinks',
  '/backlinks/stats',
  '/backlinks/growth',
  '/backlinks/anchor-distribution',
  '/backlinks/follow-nofollow',
  '/backlinks/top-domains',
  '/competitors',
  '/dashboard/summary',
  '/activities',
];
const competitorPaths = ['/competitors', '/competitors/keyword-comparison', '/competitors/gap-analysis', '/dashboard/summary', '/activities'];
const contentPaths = ['/content', '/content/stats', '/dashboard/summary', '/activities'];

export const useCreateProject = () => useWrite(createProject, projectPaths);
export const useDeleteProject = () => useWrite(deleteProject, projectPaths);
export const useUpdateProject = () => useWrite(updateProject, projectPaths);
export const useImportProjects = () => useWrite(importProjects, projectPaths);

export interface AddKeywordsInput {
  projectId: string;
  keywords: string[];
  searchEngine: 'google' | 'bing' | 'yahoo';
  device: 'desktop' | 'mobile';
}
export const useAddKeywords = () =>
  useWrite((input: AddKeywordsInput) => apiSend<{ added: number; skipped: number }>('POST', '/keywords', input), keywordPaths);
export const useDeleteKeyword = () =>
  useWrite((id: string) => apiSend('DELETE', `/keywords/${encodeURIComponent(id)}`), keywordPaths);

export interface StartAuditInput {
  projectId: string;
  crawlDepth: 'quick' | 'standard' | 'full';
  maxPages: number;
  userAgent: 'desktop' | 'mobile' | 'googlebot';
}
export const useStartAudit = () =>
  useWrite((input: StartAuditInput) => apiSend<api.AuditRunDto>('POST', '/audit/runs', input), ['/audit/latest']);
/** Call when an audit finishes, to refresh everything it changed. */
export function useRefreshAfterAudit() {
  const queryClient = useQueryClient();
  return () => Promise.all(auditPaths.map((path) => queryClient.invalidateQueries({ queryKey: [path] })));
}
export const useSetIssueStatus = () =>
  useWrite(
    ({ id, status }: { id: string; status: 'open' | 'fixed' }) =>
      apiSend<api.AuditIssueDetailDto>('PATCH', `/audit/issues/${encodeURIComponent(id)}`, { status }),
    ['/audit/checks', '/audit/issues', '/dashboard/summary']
  );

export interface AddBacklinkInput {
  projectId: string;
  sourceUrl: string;
  targetPage: string;
  linkType: 'follow' | 'nofollow' | 'ugc' | 'sponsored';
  anchorText: string;
  domainAuthority: number | null;
  notes?: string;
  disavow: boolean;
}
export const useAddBacklink = () =>
  useWrite((input: AddBacklinkInput) => apiSend<api.BacklinkDto>('POST', '/backlinks', input), backlinkPaths);

export interface AddCompetitorInput {
  projectId: string;
  domain: string;
  displayName?: string;
  targetCountry?: string;
  trackingScope: 'organic' | 'paid' | 'all';
}
export const useAddCompetitor = () =>
  useWrite((input: AddCompetitorInput) => apiSend<api.CompetitorDto>('POST', '/competitors', input), competitorPaths);

export interface ContentInput {
  title: string;
  urlPath: string;
  contentType: 'blog' | 'landing' | 'tool' | 'guide';
  status: 'draft' | 'published' | 'needs-update' | 'outdated';
  primaryKeyword: string | null;
  targetKeywords: string[];
  metaDescription: string | null;
}
export const useCreateContent = () =>
  useWrite((input: ContentInput & { projectId: string }) => apiSend<api.ContentDto>('POST', '/content', input), contentPaths);
export const useUpdateContent = () =>
  useWrite(
    ({ id, ...patch }: ContentInput & { id: string }) => apiSend<api.ContentDto>('PATCH', `/content/${encodeURIComponent(id)}`, patch),
    contentPaths
  );

export interface CreateReportInput {
  projectId: string;
  template: string;
  format: 'pdf' | 'csv' | 'xlsx';
  dateRangeDays: 7 | 30 | 90;
  sections: string[];
}
export const useCreateReport = () =>
  useWrite((input: CreateReportInput) => apiSend<api.ReportDto>('POST', '/reports', input), ['/reports', '/activities']);

/** Gets a short-lived download link for a finished report and opens it. */
export const useDownloadReport = () =>
  useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { url } = await apiGet<{ url: string; fileName: string }>(`/reports/${encodeURIComponent(id)}/download`);
      window.location.assign(url);
    },
  });

export const useUpdateProfile = () =>
  useWrite(
    (patch: { name?: string; company?: string | null; jobTitle?: string | null }) => apiSend<api.ProfileDto>('PATCH', '/profile', patch),
    ['/profile']
  );
export const useUploadAvatar = () => useWrite((file: File) => apiUpload<api.ProfileDto>('/profile/avatar', 'avatar', file), ['/profile']);

export const useSetNotificationPreference = () =>
  useWrite(
    ({ key, email, push }: { key: string; email: boolean; push: boolean }) =>
      apiSend('PUT', `/settings/notifications/${encodeURIComponent(key)}`, { email, push }),
    ['/settings/notifications']
  );

export const useMarkNotificationsRead = () =>
  useWrite(() => apiSend('POST', '/notifications/read-all'), ['/notifications']);

export type { NotificationsView };
