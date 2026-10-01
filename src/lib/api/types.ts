// Response shapes of the RankPulse API (backend/src/services/*). Raw values only: numbers,
// ISO timestamps and nulls. Display formatting happens in ./mappers.ts.

export interface ProjectDto {
  id: string;
  name: string;
  websiteUrl: string;
  favicon: string;
  industry: string | null;
  targetCountry: string | null;
  status: 'active' | 'paused' | 'warning';
  keywordCount: number;
  healthScore: number | null;
  authorityScore: number | null;
  organicTraffic: number | null;
  lastAuditAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordDto {
  id: string;
  keyword: string;
  searchEngine: 'google' | 'bing' | 'yahoo';
  device: 'desktop' | 'mobile';
  createdAt: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  rank: number | null;
  previousRank: number | null;
  rankingUrl: string | null;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' | null;
  serpFeature: string | null;
  rankHistory: number[];
}

export interface KeywordSummaryDto {
  tracked: number;
  addedLast30Days: number;
  top10: number | null;
  top3: number | null;
  lost: number | null;
  averagePosition: number | null;
}

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AuditRunDto {
  id: string;
  projectId: string;
  status: AuditStatus;
  phase: 'queued' | 'crawling' | 'analyzing' | 'done' | null;
  crawlDepth: 'quick' | 'standard' | 'full';
  maxPages: number;
  userAgent: 'desktop' | 'mobile' | 'googlebot';
  pagesCrawled: number;
  healthScore: number | null;
  errors: number;
  warnings: number;
  notices: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface LatestAuditsDto {
  latest: AuditRunDto | null;
  lastCompleted: AuditRunDto | null;
  previousCompleted: AuditRunDto | null;
}

export interface AuditIssueDto {
  id: string;
  auditId: string;
  checkKey: string;
  type: 'error' | 'warning' | 'notice';
  title: string;
  description: string;
  occurrences: number;
  pages: number;
  status: 'open' | 'fixed';
  fixedAt: string | null;
}

export interface AuditIssueDetailDto extends AuditIssueDto {
  affectedPages: { url: string; statusCode: number | null; detail: string | null }[];
  recommendations: string[];
}

export interface AuditHistoryDto {
  id: string;
  finishedAt: string;
  healthScore: number | null;
  pagesCrawled: number;
  errors: number;
  warnings: number;
  notices: number;
}

export type LinkType = 'follow' | 'nofollow' | 'ugc' | 'sponsored';
export type AnchorCategory = 'branded' | 'exact' | 'partial' | 'naked-url' | 'generic';

export interface BacklinkDto {
  id: string;
  sourceUrl: string;
  sourceDomain: string;
  targetPage: string;
  anchorText: string;
  linkType: LinkType;
  domainAuthority: number | null;
  notes: string | null;
  disavowed: boolean;
  firstSeenAt: string;
}

export interface BacklinkStatsDto {
  total: number;
  referringDomains: number;
  newLast30Days: number;
  disavowed: number;
}

export type BacklinkGrowthDto = { month: string; new: number; lost: number }[];
export type AnchorDistributionDto = { category: AnchorCategory; count: number }[];
export type LinkTypesDto = { type: LinkType; count: number }[];
export type TopDomainsDto = { domain: string; backlinks: number; authority: number | null }[];

export interface CompetitorDto {
  id: string;
  domain: string;
  displayName: string;
  targetCountry: string | null;
  trackingScope: 'organic' | 'paid' | 'all' | null;
  isYou: boolean;
  organicTraffic: number | null;
  keywords: number | null;
  backlinks: number | null;
  authority: number | null;
  trafficValue: number | null;
  createdAt: string;
}

export interface KeywordComparisonDto {
  competitors: { id: string; displayName: string; isYou: boolean }[];
  rows: { keyword: string; positions: Record<string, number | null> }[];
}

export interface GapDto {
  unique: number | null;
  shared: number | null;
  missed: number | null;
}

export interface ContentDto {
  id: string;
  projectId: string;
  title: string;
  urlPath: string;
  contentType: 'blog' | 'landing' | 'tool' | 'guide';
  status: 'draft' | 'published' | 'needs-update' | 'outdated';
  primaryKeyword: string | null;
  targetKeywords: string[];
  metaDescription: string | null;
  traffic: number | null;
  rankingKeywords: number | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStatsDto {
  total: number;
  published: number;
  needsUpdate: number;
  drafts: number;
}

export type KpiKey =
  | 'site-health'
  | 'open-issues'
  | 'pages-crawled'
  | 'tracked-keywords'
  | 'backlinks'
  | 'referring-domains'
  | 'competitors'
  | 'content-pages';

export interface DashboardSummaryDto {
  project: { id: string; name: string; websiteUrl: string; lastAuditAt: string | null };
  kpis: { key: KpiKey; value: number | null; previous: number | null; history: number[] }[];
  keywords: KeywordDto[];
  auditIssues: AuditIssueDto[];
  backlinks: { stats: BacklinkStatsDto; anchors: AnchorDistributionDto; linkTypes: LinkTypesDto; topDomains: TopDomainsDto };
  competitors: CompetitorDto[];
  traffic: null;
  coreWebVitals: null;
  aiSeo: null;
}

export interface ActivityDto {
  id: string;
  projectId: string | null;
  type: 'project' | 'keyword' | 'audit' | 'backlink' | 'competitor' | 'content' | 'report';
  title: string;
  description: string;
  createdAt: string;
}

export interface NotificationsDto {
  unreadCount: number;
  items: { id: string; projectId: string | null; eventKey: string; title: string; description: string; read: boolean; createdAt: string }[];
}

export interface AiSeoMetricDto {
  key: string;
  value: number;
  change: number | null;
  target: number | null;
}

export interface ReportDto {
  id: string;
  projectId: string;
  name: string;
  template: string;
  format: 'pdf' | 'csv' | 'xlsx';
  dateRangeDays: number;
  sections: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  fileSize: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ReportTemplateDto {
  key: string;
  name: string;
  description: string;
  icon: string;
  defaultSections: string[];
}

export type NotificationPreferencesDto = { key: string; email: boolean; push: boolean }[];
export type IntegrationsDto = { key: string; name: string; description: string; connected: boolean; available: boolean }[];

export interface BillingDto {
  plan: 'free' | 'pro' | 'enterprise';
  usage: { projects: number; keywords: number; reportsThisMonth: number };
  price: number | null;
  renewalDate: string | null;
  invoices: never[];
  billingAvailable: boolean;
}

export interface ProfileDto {
  id: string;
  email: string;
  name: string;
  company: string | null;
  jobTitle: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'owner' | 'member' | 'viewer';
  avatarUrl: string | null;
}

export interface ImportResultDto {
  created: ProjectDto[];
  skipped: { row: number; website: string; reason: string }[];
}
