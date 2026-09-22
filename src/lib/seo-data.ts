export interface Kpi {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: number[];
  accent: 'primary' | 'accent' | 'warning' | 'destructive' | 'chart-4';
}

export const kpis: Kpi[] = [
  {
    id: 'seo-score',
    label: 'SEO Score',
    value: '82',
    change: 4.2,
    trend: [68, 70, 72, 71, 75, 78, 80, 82],
    accent: 'primary',
  },
  {
    id: 'organic-traffic',
    label: 'Organic Traffic',
    value: '248.5K',
    change: 12.8,
    trend: [120, 145, 160, 175, 190, 210, 230, 248],
    accent: 'accent',
  },
  {
    id: 'organic-keywords',
    label: 'Organic Keywords',
    value: '18,420',
    change: 6.4,
    trend: [14200, 14800, 15300, 15900, 16400, 17000, 17800, 18420],
    accent: 'chart-4',
  },
  {
    id: 'domain-authority',
    label: 'Domain Authority',
    value: '64',
    change: 2.1,
    trend: [58, 59, 60, 61, 62, 63, 63, 64],
    accent: 'primary',
  },
  {
    id: 'referring-domains',
    label: 'Referring Domains',
    value: '3,240',
    change: 8.7,
    trend: [2800, 2900, 2980, 3050, 3110, 3170, 3210, 3240],
    accent: 'accent',
  },
  {
    id: 'backlinks',
    label: 'Backlinks',
    value: '52.1K',
    change: 5.3,
    trend: [42000, 44000, 46000, 47500, 48800, 50000, 51000, 52100],
    accent: 'chart-4',
  },
  {
    id: 'indexed-pages',
    label: 'Indexed Pages',
    value: '4,820',
    change: 3.1,
    trend: [4400, 4480, 4550, 4620, 4690, 4750, 4790, 4820],
    accent: 'primary',
  },
  {
    id: 'site-health',
    label: 'Site Health',
    value: '94%',
    change: 1.8,
    trend: [88, 89, 90, 91, 92, 93, 93, 94],
    accent: 'accent',
  },
];

export const trafficTrend = [
  { month: 'Jan', organic: 142, direct: 88, referral: 34, social: 22 },
  { month: 'Feb', organic: 156, direct: 92, referral: 38, social: 26 },
  { month: 'Mar', organic: 168, direct: 98, referral: 42, social: 30 },
  { month: 'Apr', organic: 185, direct: 104, referral: 45, social: 34 },
  { month: 'May', organic: 198, direct: 112, referral: 48, social: 38 },
  { month: 'Jun', organic: 214, direct: 118, referral: 52, social: 42 },
  { month: 'Jul', organic: 232, direct: 126, referral: 56, social: 46 },
  { month: 'Aug', organic: 248, direct: 134, referral: 60, social: 50 },
];

export const keywordDistribution = [
  { name: 'Top 3', value: 1240, fill: 'hsl(var(--chart-1))' },
  { name: '4-10', value: 3480, fill: 'hsl(var(--chart-2))' },
  { name: '11-20', value: 5210, fill: 'hsl(var(--chart-3))' },
  { name: '21-50', value: 6120, fill: 'hsl(var(--chart-4))' },
  { name: '51-100', value: 2370, fill: 'hsl(var(--chart-5))' },
];

export const trafficSources = [
  { name: 'Organic Search', value: 48, fill: 'hsl(var(--chart-1))' },
  { name: 'Direct', value: 24, fill: 'hsl(var(--chart-2))' },
  { name: 'Referral', value: 14, fill: 'hsl(var(--chart-3))' },
  { name: 'Social', value: 9, fill: 'hsl(var(--chart-4))' },
  { name: 'Paid', value: 5, fill: 'hsl(var(--chart-5))' },
];

export const countryTraffic = [
  { country: 'United States', code: 'US', traffic: 38, visits: '94.4K' },
  { country: 'United Kingdom', code: 'GB', traffic: 16, visits: '39.8K' },
  { country: 'India', code: 'IN', traffic: 12, visits: '29.8K' },
  { country: 'Germany', code: 'DE', traffic: 9, visits: '22.4K' },
  { country: 'Canada', code: 'CA', traffic: 7, visits: '17.4K' },
  { country: 'Australia', code: 'AU', traffic: 6, visits: '14.9K' },
  { country: 'France', code: 'FR', traffic: 5, visits: '12.4K' },
  { country: 'Other', code: '—', traffic: 7, visits: '17.4K' },
];

export const deviceBreakdown = [
  { name: 'Desktop', value: 58, fill: 'hsl(var(--chart-1))' },
  { name: 'Mobile', value: 34, fill: 'hsl(var(--chart-2))' },
  { name: 'Tablet', value: 8, fill: 'hsl(var(--chart-3))' },
];

export const monthlyGrowth = [
  { month: 'Feb', traffic: 4, keywords: 3, backlinks: 2 },
  { month: 'Mar', traffic: 8, keywords: 5, backlinks: 4 },
  { month: 'Apr', traffic: 10, keywords: 6, backlinks: 5 },
  { month: 'May', traffic: 7, keywords: 4, backlinks: 3 },
  { month: 'Jun', traffic: 8, keywords: 6, backlinks: 5 },
  { month: 'Jul', traffic: 9, keywords: 5, backlinks: 4 },
  { month: 'Aug', traffic: 7, keywords: 4, backlinks: 3 },
];

export const topLandingPages = [
  { page: '/blog/seo-guide-2025', traffic: 18420, change: 12.4, keywords: 248 },
  { page: '/services/seo-audit', traffic: 14210, change: 8.1, keywords: 186 },
  { page: '/blog/keyword-research', traffic: 11840, change: -3.2, keywords: 142 },
  { page: '/tools/backlink-checker', traffic: 9420, change: 15.8, keywords: 98 },
  { page: '/blog/core-web-vitals', traffic: 7210, change: 6.4, keywords: 76 },
  { page: '/pricing', traffic: 5980, change: 2.1, keywords: 54 },
];

export interface KeywordRow {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: string;
  rank: number;
  previousRank: number;
  url: string;
}

export const keywordTable: KeywordRow[] = [
  { keyword: 'seo audit tool', volume: 18100, difficulty: 68, cpc: '$4.20', rank: 3, previousRank: 5, url: '/tools/seo-audit' },
  { keyword: 'keyword research', volume: 22200, difficulty: 72, cpc: '$3.80', rank: 7, previousRank: 9, url: '/blog/keyword-research' },
  { keyword: 'backlink checker', volume: 9900, difficulty: 54, cpc: '$2.90', rank: 2, previousRank: 2, url: '/tools/backlink-checker' },
  { keyword: 'core web vitals', volume: 14800, difficulty: 61, cpc: '$5.10', rank: 11, previousRank: 14, url: '/blog/core-web-vitals' },
  { keyword: 'seo score checker', volume: 6600, difficulty: 48, cpc: '$3.40', rank: 4, previousRank: 6, url: '/tools/seo-score' },
  { keyword: 'organic traffic estimator', volume: 4400, difficulty: 42, cpc: '$2.10', rank: 9, previousRank: 8, url: '/tools/traffic-estimator' },
  { keyword: 'domain authority check', volume: 8100, difficulty: 56, cpc: '$3.60', rank: 6, previousRank: 4, url: '/tools/da-checker' },
  { keyword: 'serp analysis tool', volume: 3600, difficulty: 44, cpc: '$2.80', rank: 14, previousRank: 18, url: '/tools/serp-analysis' },
  { keyword: 'meta tag generator', volume: 12100, difficulty: 38, cpc: '$1.90', rank: 1, previousRank: 3, url: '/tools/meta-generator' },
  { keyword: 'schema markup validator', volume: 2900, difficulty: 35, cpc: '$2.40', rank: 5, previousRank: 7, url: '/tools/schema-validator' },
];

export interface AuditIssue {
  type: 'error' | 'warning' | 'notice';
  title: string;
  count: number;
}

export const auditIssues: AuditIssue[] = [
  { type: 'error', title: 'Broken Links', count: 12 },
  { type: 'error', title: 'Missing Meta Title', count: 8 },
  { type: 'error', title: 'HTTPS Issues', count: 3 },
  { type: 'warning', title: 'Missing Description', count: 24 },
  { type: 'warning', title: 'Duplicate Content', count: 18 },
  { type: 'warning', title: 'Slow Pages', count: 31 },
  { type: 'warning', title: 'Core Web Vitals', count: 14 },
  { type: 'notice', title: 'Missing Alt Text', count: 42 },
  { type: 'notice', title: 'Structured Data Missing', count: 27 },
  { type: 'notice', title: 'Thin Content', count: 19 },
];

export const backlinkStats = [
  { label: 'Total Backlinks', value: '52,140', change: 5.3 },
  { label: 'Referring Domains', value: '3,240', change: 8.7 },
  { label: 'New Backlinks', value: '1,840', change: 14.2 },
  { label: 'Lost Backlinks', value: '420', change: -6.1 },
];

export const anchorTextDistribution = [
  { name: 'Branded', value: 42, fill: 'hsl(var(--chart-1))' },
  { name: 'Exact Match', value: 18, fill: 'hsl(var(--chart-2))' },
  { name: 'Partial Match', value: 24, fill: 'hsl(var(--chart-3))' },
  { name: 'Naked URL', value: 11, fill: 'hsl(var(--chart-4))' },
  { name: 'Generic', value: 5, fill: 'hsl(var(--chart-5))' },
];

export const followNofollow = [
  { name: 'Follow', value: 68, fill: 'hsl(var(--chart-1))' },
  { name: 'Nofollow', value: 28, fill: 'hsl(var(--chart-2))' },
  { name: 'UGC', value: 4, fill: 'hsl(var(--chart-3))' },
];

export const topReferringDomains = [
  { domain: 'forbes.com', authority: 94, backlinks: 1240, change: 8.4 },
  { domain: 'techcrunch.com', authority: 91, backlinks: 980, change: 12.1 },
  { domain: 'medium.com', authority: 86, backlinks: 742, change: -2.3 },
  { domain: 'github.com', authority: 89, backlinks: 610, change: 5.8 },
  { domain: 'producthunt.com', authority: 84, backlinks: 488, change: 18.2 },
];

export interface Competitor {
  name: string;
  isYou: boolean;
  traffic: string;
  keywords: string;
  backlinks: string;
  authority: number;
  trafficValue: string;
}

export const competitors: Competitor[] = [
  { name: 'Your Site', isYou: true, traffic: '248.5K', keywords: '18,420', backlinks: '52.1K', authority: 64, trafficValue: '$84.2K' },
  { name: 'Competitor A', isYou: false, traffic: '312.0K', keywords: '24,100', backlinks: '68.4K', authority: 71, trafficValue: '$102.4K' },
  { name: 'Competitor B', isYou: false, traffic: '184.2K', keywords: '12,800', backlinks: '41.2K', authority: 58, trafficValue: '$62.8K' },
  { name: 'Competitor C', isYou: false, traffic: '268.9K', keywords: '20,400', backlinks: '55.8K', authority: 67, trafficValue: '$88.6K' },
];

export const aiSeoMetrics = [
  { label: 'AI Visibility Score', value: 76, change: 9.4, accent: 'primary' as const },
  { label: 'GEO Score', value: 81, change: 12.1, accent: 'accent' as const },
  { label: 'AI Search Mentions', value: 1240, change: 18.6, accent: 'chart-4' as const },
  { label: 'Citation Score', value: 68, change: 6.2, accent: 'primary' as const },
  { label: 'LLM Readiness', value: 88, change: 4.1, accent: 'accent' as const },
  { label: 'Structured Data Score', value: 72, change: 3.8, accent: 'chart-4' as const },
  { label: 'Content Quality Score', value: 84, change: 7.2, accent: 'primary' as const },
];

export const coreWebVitals = [
  { metric: 'LCP', label: 'Largest Contentful Paint', value: '1.8s', score: 'good', target: '< 2.5s' },
  { metric: 'CLS', label: 'Cumulative Layout Shift', value: '0.04', score: 'good', target: '< 0.1' },
  { metric: 'INP', label: 'Interaction to Next Paint', value: '142ms', score: 'needs-improvement', target: '< 200ms' },
  { metric: 'FCP', label: 'First Contentful Paint', value: '0.9s', score: 'good', target: '< 1.8s' },
  { metric: 'TTFB', label: 'Time to First Byte', value: '320ms', score: 'good', target: '< 500ms' },
];

export interface Activity {
  id: string;
  type: 'ranked' | 'lost' | 'audit' | 'backlink' | 'ai';
  title: string;
  description: string;
  time: string;
}

export const recentActivities: Activity[] = [
  { id: '1', type: 'ranked', title: 'New Keyword Ranked', description: '"seo audit tool" reached position 3 (up from 5)', time: '12 min ago' },
  { id: '2', type: 'backlink', title: 'New Backlink Found', description: 'forbes.com linked to /blog/seo-guide-2025', time: '48 min ago' },
  { id: '3', type: 'ai', title: 'AI Score Updated', description: 'AI Visibility Score increased to 76 (+9.4)', time: '2 hours ago' },
  { id: '4', type: 'audit', title: 'Site Audit Completed', description: '94% site health — 12 errors resolved', time: '5 hours ago' },
  { id: '5', type: 'lost', title: 'Lost Ranking', description: '"domain authority check" dropped from 4 to 6', time: '8 hours ago' },
  { id: '6', type: 'ranked', title: 'New Keyword Ranked', description: '"meta tag generator" reached position 1', time: '1 day ago' },
];

export const quickActions = [
  { label: 'Run Site Audit', icon: 'ShieldCheck' },
  { label: 'Track Keywords', icon: 'Search' },
  { label: 'Generate SEO Report', icon: 'FileText' },
  { label: 'Analyse Competitor', icon: 'Users' },
  { label: 'Export PDF', icon: 'Download' },
];

export const projects = [
  { name: 'acme-corp.com', favicon: 'A' },
  { name: 'globex.io', favicon: 'G' },
  { name: 'initech.dev', favicon: 'I' },
  { name: 'umbrella.co', favicon: 'U' },
];

export const sidebarItems = [
  { label: 'Dashboard', icon: 'LayoutDashboard', active: true },
  { label: 'Schema Generator', icon: 'Braces' },
  { label: 'Projects', icon: 'FolderKanban' },
  { label: 'Keyword Rankings', icon: 'Search' },
  { label: 'Site Audit', icon: 'ShieldCheck' },
  { label: 'Backlinks', icon: 'Link2' },
  { label: 'Competitors', icon: 'Users' },
  { label: 'Content', icon: 'FileText' },
  { label: 'AI SEO', icon: 'Sparkles' },
  { label: 'Reports', icon: 'BarChart3' },
];

export const notifications = [
  { id: '1', title: 'Site audit complete', description: '94% health score', time: '12m' },
  { id: '2', title: 'New backlink found', description: 'forbes.com', time: '48m' },
  { id: '3', title: 'Keyword ranking up', description: 'seo audit tool → #3', time: '2h' },
];

/* ---------- Projects screen ---------- */

export interface ProjectItem {
  name: string;
  favicon: string;
  status: 'active' | 'paused' | 'warning';
  traffic: string;
  keywords: number;
  health: number;
  authority: number;
  lastAudit: string;
  trend: number[];
}

export const projectList: ProjectItem[] = [
  { name: 'acme-corp.com', favicon: 'A', status: 'active', traffic: '248.5K', keywords: 18420, health: 94, authority: 64, lastAudit: '2h ago', trend: [180, 195, 210, 225, 230, 240, 248] },
  { name: 'globex.io', favicon: 'G', status: 'active', traffic: '112.3K', keywords: 8240, health: 88, authority: 52, lastAudit: '5h ago', trend: [80, 85, 90, 98, 104, 108, 112] },
  { name: 'initech.dev', favicon: 'I', status: 'warning', traffic: '64.8K', keywords: 4120, health: 76, authority: 41, lastAudit: '1d ago', trend: [70, 68, 66, 65, 64, 63, 64] },
  { name: 'umbrella.co', favicon: 'U', status: 'paused', traffic: '38.2K', keywords: 2180, health: 82, authority: 38, lastAudit: '3d ago', trend: [42, 40, 39, 38, 38, 37, 38] },
  { name: 'stark-industries.com', favicon: 'S', status: 'active', traffic: '186.4K', keywords: 12480, health: 91, authority: 58, lastAudit: '4h ago', trend: [140, 150, 160, 168, 174, 180, 186] },
  { name: 'wayne-tech.io', favicon: 'W', status: 'active', traffic: '92.1K', keywords: 6840, health: 89, authority: 49, lastAudit: '6h ago', trend: [70, 74, 78, 82, 86, 89, 92] },
];

/* ---------- Keyword Rankings screen ---------- */

export interface KeywordFull extends KeywordRow {
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  serp: string;
  trend30: number[];
}

export const keywordFullTable: KeywordFull[] = [
  { keyword: 'seo audit tool', volume: 18100, difficulty: 68, cpc: '$4.20', rank: 3, previousRank: 5, url: '/tools/seo-audit', intent: 'Commercial', serp: 'Featured snippet', trend30: [7, 6, 6, 5, 5, 4, 3] },
  { keyword: 'keyword research', volume: 22200, difficulty: 72, cpc: '$3.80', rank: 7, previousRank: 9, url: '/blog/keyword-research', intent: 'Informational', serp: 'People also ask', trend30: [12, 11, 10, 10, 9, 8, 7] },
  { keyword: 'backlink checker', volume: 9900, difficulty: 54, cpc: '$2.90', rank: 2, previousRank: 2, url: '/tools/backlink-checker', intent: 'Transactional', serp: 'Featured snippet', trend30: [2, 2, 3, 2, 2, 2, 2] },
  { keyword: 'core web vitals', volume: 14800, difficulty: 61, cpc: '$5.10', rank: 11, previousRank: 14, url: '/blog/core-web-vitals', intent: 'Informational', serp: 'Image pack', trend30: [18, 16, 15, 14, 13, 12, 11] },
  { keyword: 'seo score checker', volume: 6600, difficulty: 48, cpc: '$3.40', rank: 4, previousRank: 6, url: '/tools/seo-score', intent: 'Commercial', serp: 'Site links', trend30: [8, 7, 6, 6, 5, 4, 4] },
  { keyword: 'organic traffic estimator', volume: 4400, difficulty: 42, cpc: '$2.10', rank: 9, previousRank: 8, url: '/tools/traffic-estimator', intent: 'Informational', serp: 'Video', trend30: [6, 7, 7, 8, 8, 9, 9] },
  { keyword: 'domain authority check', volume: 8100, difficulty: 56, cpc: '$3.60', rank: 6, previousRank: 4, url: '/tools/da-checker', intent: 'Commercial', serp: 'Featured snippet', trend30: [3, 4, 4, 5, 5, 6, 6] },
  { keyword: 'serp analysis tool', volume: 3600, difficulty: 44, cpc: '$2.80', rank: 14, previousRank: 18, url: '/tools/serp-analysis', intent: 'Transactional', serp: 'People also ask', trend30: [22, 20, 19, 18, 16, 15, 14] },
  { keyword: 'meta tag generator', volume: 12100, difficulty: 38, cpc: '$1.90', rank: 1, previousRank: 3, url: '/tools/meta-generator', intent: 'Navigational', serp: 'Featured snippet', trend30: [4, 3, 3, 2, 2, 1, 1] },
  { keyword: 'schema markup validator', volume: 2900, difficulty: 35, cpc: '$2.40', rank: 5, previousRank: 7, url: '/tools/schema-validator', intent: 'Informational', serp: 'Site links', trend30: [9, 8, 7, 7, 6, 5, 5] },
  { keyword: 'technical seo checklist', volume: 5400, difficulty: 46, cpc: '$3.10', rank: 8, previousRank: 12, url: '/blog/technical-seo', intent: 'Informational', serp: 'People also ask', trend30: [14, 13, 11, 10, 9, 9, 8] },
  { keyword: 'link building strategies', volume: 8800, difficulty: 64, cpc: '$4.80', rank: 13, previousRank: 13, url: '/blog/link-building', intent: 'Informational', serp: 'Featured snippet', trend30: [13, 14, 13, 14, 13, 13, 13] },
];

export const keywordSummary = [
  { label: 'Tracked Keywords', value: '18,420', change: 6.4 },
  { label: 'Top 10 Rankings', value: '4,720', change: 8.1 },
  { label: 'Top 3 Rankings', value: '1,240', change: 12.3 },
  { label: 'New Keywords', value: '342', change: 15.6 },
  { label: 'Lost Keywords', value: '128', change: -4.2 },
  { label: 'Avg. Position', value: '14.2', change: 3.8 },
];

/* ---------- Site Audit screen ---------- */

export interface AuditCheck {
  title: string;
  type: 'error' | 'warning' | 'notice';
  count: number;
  pages: number;
  description: string;
}

export const auditChecks: AuditCheck[] = [
  { title: 'Broken Links', type: 'error', count: 12, pages: 9, description: 'Links returning 4xx/5xx status codes' },
  { title: 'Missing Meta Title', type: 'error', count: 8, pages: 8, description: 'Pages without a title tag' },
  { title: 'HTTPS Issues', type: 'error', count: 3, pages: 3, description: 'Mixed content or invalid certificates' },
  { title: 'Missing Description', type: 'warning', count: 24, pages: 22, description: 'Pages missing meta description' },
  { title: 'Duplicate Content', type: 'warning', count: 18, pages: 14, description: 'Pages with high content similarity' },
  { title: 'Slow Pages', type: 'warning', count: 31, pages: 27, description: 'Pages loading over 3 seconds' },
  { title: 'Core Web Vitals', type: 'warning', count: 14, pages: 11, description: 'Failing LCP, CLS, or INP thresholds' },
  { title: 'Missing Alt Text', type: 'notice', count: 42, pages: 18, description: 'Images without alt attributes' },
  { title: 'Structured Data Missing', type: 'notice', count: 27, pages: 24, description: 'Pages without schema markup' },
  { title: 'Thin Content', type: 'notice', count: 19, pages: 16, description: 'Pages with under 300 words' },
];

export const auditHistory = [
  { date: 'Jul 22', errors: 28, warnings: 92, notices: 96 },
  { date: 'Jul 23', errors: 25, warnings: 88, notices: 94 },
  { date: 'Jul 24', errors: 22, warnings: 84, notices: 91 },
  { date: 'Jul 25', errors: 20, warnings: 81, notices: 89 },
  { date: 'Jul 26', errors: 18, warnings: 78, notices: 88 },
  { date: 'Jul 27', errors: 15, warnings: 75, notices: 87 },
  { date: 'Jul 28', errors: 23, warnings: 87, notices: 88 },
];

/* ---------- Backlinks screen ---------- */

export interface BacklinkRow {
  source: string;
  authority: number;
  target: string;
  anchor: string;
  type: 'Follow' | 'Nofollow' | 'UGC';
  firstSeen: string;
  change: number;
}

export const backlinkTable: BacklinkRow[] = [
  { source: 'forbes.com', authority: 94, target: '/blog/seo-guide-2025', anchor: 'comprehensive SEO guide', type: 'Follow', firstSeen: 'Jul 14, 2025', change: 8.4 },
  { source: 'techcrunch.com', authority: 91, target: '/services/seo-audit', anchor: 'best SEO audit tool', type: 'Follow', firstSeen: 'Jul 10, 2025', change: 12.1 },
  { source: 'medium.com', authority: 86, target: '/blog/keyword-research', anchor: 'keyword research methods', type: 'Nofollow', firstSeen: 'Jul 8, 2025', change: -2.3 },
  { source: 'github.com', authority: 89, target: '/tools/backlink-checker', anchor: 'backlink checker', type: 'Follow', firstSeen: 'Jul 3, 2025', change: 5.8 },
  { source: 'producthunt.com', authority: 84, target: '/pricing', anchor: 'RankPulse', type: 'Follow', firstSeen: 'Jul 1, 2025', change: 18.2 },
  { source: 'dev.to', authority: 78, target: '/blog/core-web-vitals', anchor: 'web vitals guide', type: 'UGC', firstSeen: 'Jun 28, 2025', change: 4.1 },
  { source: 'searchengineland.com', authority: 88, target: '/blog/technical-seo', anchor: 'technical SEO checklist', type: 'Follow', firstSeen: 'Jun 25, 2025', change: 6.7 },
  { source: 'moz.com', authority: 90, target: '/tools/da-checker', anchor: 'domain authority tool', type: 'Nofollow', firstSeen: 'Jun 22, 2025', change: -1.2 },
  { source: 'ahrefs.com', authority: 92, target: '/blog/link-building', anchor: 'link building strategies', type: 'Follow', firstSeen: 'Jun 18, 2025', change: 3.4 },
  { source: 'hubspot.com', authority: 87, target: '/blog/seo-guide-2025', anchor: 'SEO best practices', type: 'Follow', firstSeen: 'Jun 15, 2025', change: 7.9 },
];

export const backlinkGrowth = [
  { month: 'Feb', new: 1240, lost: 280 },
  { month: 'Mar', new: 1480, lost: 320 },
  { month: 'Apr', new: 1620, lost: 290 },
  { month: 'May', new: 1840, lost: 380 },
  { month: 'Jun', new: 1720, lost: 410 },
  { month: 'Jul', new: 1840, lost: 420 },
];

/* ---------- Competitors screen ---------- */

export const competitorKeywords = [
  { keyword: 'seo audit tool', you: 3, compA: 1, compB: 8, compC: 5 },
  { keyword: 'keyword research', you: 7, compA: 4, compB: 12, compC: 6 },
  { keyword: 'backlink checker', you: 2, compA: 6, compB: 4, compC: 9 },
  { keyword: 'core web vitals', you: 11, compA: 3, compB: 18, compC: 7 },
  { keyword: 'seo score checker', you: 4, compA: 9, compB: 6, compC: 14 },
  { keyword: 'domain authority', you: 6, compA: 2, compB: 9, compC: 4 },
  { keyword: 'meta tag generator', you: 1, compA: 7, compB: 3, compC: 11 },
  { keyword: 'link building', you: 13, compA: 5, compB: 16, compC: 8 },
];

export const competitorGap = {
  unique: 4820,
  shared: 1240,
  missed: 3180,
};

/* ---------- Content screen ---------- */

export interface ContentItem {
  title: string;
  url: string;
  type: 'Blog' | 'Landing' | 'Tool' | 'Guide';
  traffic: number;
  keywords: number;
  score: number;
  status: 'Published' | 'Draft' | 'Needs Update' | 'Outdated';
  updated: string;
}

export const contentList: ContentItem[] = [
  { title: 'The Complete SEO Guide for 2025', url: '/blog/seo-guide-2025', type: 'Guide', traffic: 18420, keywords: 248, score: 92, status: 'Published', updated: '3d ago' },
  { title: 'Keyword Research: A Step-by-Step Method', url: '/blog/keyword-research', type: 'Blog', traffic: 11840, keywords: 142, score: 84, status: 'Published', updated: '1w ago' },
  { title: 'SEO Audit Service', url: '/services/seo-audit', type: 'Landing', traffic: 14210, keywords: 186, score: 78, status: 'Needs Update', updated: '2w ago' },
  { title: 'Backlink Checker Tool', url: '/tools/backlink-checker', type: 'Tool', traffic: 9420, keywords: 98, score: 88, status: 'Published', updated: '4d ago' },
  { title: 'Understanding Core Web Vitals', url: '/blog/core-web-vitals', type: 'Blog', traffic: 7210, keywords: 76, score: 81, status: 'Published', updated: '5d ago' },
  { title: 'Technical SEO Checklist', url: '/blog/technical-seo', type: 'Guide', traffic: 6480, keywords: 64, score: 73, status: 'Outdated', updated: '3w ago' },
  { title: 'Link Building Strategies That Work', url: '/blog/link-building', type: 'Blog', traffic: 5120, keywords: 52, score: 76, status: 'Published', updated: '6d ago' },
  { title: 'Meta Tag Generator', url: '/tools/meta-generator', type: 'Tool', traffic: 4280, keywords: 38, score: 90, status: 'Published', updated: '1d ago' },
  { title: 'Pricing Page', url: '/pricing', type: 'Landing', traffic: 5980, keywords: 54, score: 68, status: 'Needs Update', updated: '1mo ago' },
  { title: 'Schema Markup Guide (Draft)', url: '/blog/schema-markup', type: 'Blog', traffic: 0, keywords: 0, score: 0, status: 'Draft', updated: '2d ago' },
];

export const contentStats = [
  { label: 'Total Pages', value: '4,820', change: 3.1 },
  { label: 'Top Performers', value: '142', change: 8.4 },
  { label: 'Needs Update', value: '38', change: -2.1 },
  { label: 'Avg. Content Score', value: '78', change: 4.6 },
];

/* ---------- AI SEO screen ---------- */

export const aiSeoFullMetrics = [
  { label: 'AI Visibility Score', value: 76, change: 9.4, target: 85, description: 'How often your site appears in AI-generated answers' },
  { label: 'GEO Score', value: 81, change: 12.1, target: 90, description: 'Generative Engine Optimization readiness' },
  { label: 'AI Search Mentions', value: 1240, change: 18.6, target: 2000, description: 'Total mentions across AI search platforms' },
  { label: 'Citation Score', value: 68, change: 6.2, target: 80, description: 'How frequently AI cites your content as a source' },
  { label: 'LLM Readiness', value: 88, change: 4.1, target: 90, description: 'Content structure clarity for language models' },
  { label: 'Structured Data Score', value: 72, change: 3.8, target: 85, description: 'Schema markup coverage across pages' },
  { label: 'Content Quality Score', value: 84, change: 7.2, target: 90, description: 'E-E-A-T signal strength' },
  { label: 'Entity Recognition', value: 79, change: 5.4, target: 85, description: 'How well AI identifies your brand entities' },
];

export const aiMentionsByPlatform = [
  { platform: 'ChatGPT', mentions: 480, share: 39 },
  { platform: 'Perplexity', mentions: 320, share: 26 },
  { platform: 'Google AI Overviews', mentions: 240, share: 19 },
  { platform: 'Claude', mentions: 140, share: 11 },
  { platform: 'Copilot', mentions: 60, share: 5 },
];

export const aiTrend = [
  { week: 'W1', visibility: 58, mentions: 820 },
  { week: 'W2', visibility: 62, mentions: 910 },
  { week: 'W3', visibility: 65, mentions: 980 },
  { week: 'W4', visibility: 68, mentions: 1040 },
  { week: 'W5', visibility: 71, mentions: 1120 },
  { week: 'W6', visibility: 74, mentions: 1180 },
  { week: 'W7', visibility: 76, mentions: 1240 },
];

export const aiRecommendations = [
  { title: 'Add FAQ schema to top 20 pages', impact: 'High', score: '+8 visibility' },
  { title: 'Increase content depth on pillar pages', impact: 'Medium', score: '+5 citations' },
  { title: 'Add author E-E-A-T signals', impact: 'High', score: '+6 LLM readiness' },
  { title: 'Implement structured data on tools', impact: 'Medium', score: '+4 GEO score' },
  { title: 'Optimize for conversational queries', impact: 'High', score: '+12 mentions' },
];

/* ---------- Reports screen ---------- */

export interface ReportItem {
  name: string;
  type: 'Weekly' | 'Monthly' | 'Custom' | 'Audit' | 'Competitor';
  date: string;
  status: 'Ready' | 'Generating' | 'Scheduled';
  size: string;
}

export const reportList: ReportItem[] = [
  { name: 'Weekly SEO Performance — Jul 28', type: 'Weekly', date: 'Jul 28, 2025', status: 'Ready', size: '2.4 MB' },
  { name: 'Monthly Traffic Report — July', type: 'Monthly', date: 'Jul 31, 2025', status: 'Scheduled', size: '—' },
  { name: 'Site Audit Summary', type: 'Audit', date: 'Jul 27, 2025', status: 'Ready', size: '1.8 MB' },
  { name: 'Competitor Analysis Q3', type: 'Competitor', date: 'Jul 25, 2025', status: 'Ready', size: '3.1 MB' },
  { name: 'Keyword Ranking Export', type: 'Custom', date: 'Jul 24, 2025', status: 'Ready', size: '940 KB' },
  { name: 'Backlink Profile Report', type: 'Custom', date: 'Jul 22, 2025', status: 'Ready', size: '1.2 MB' },
  { name: 'AI SEO Performance', type: 'Custom', date: 'Jul 21, 2025', status: 'Generating', size: '—' },
  { name: 'Weekly SEO Performance — Jul 21', type: 'Weekly', date: 'Jul 21, 2025', status: 'Ready', size: '2.2 MB' },
];

export const reportTemplates = [
  { name: 'Executive Summary', description: 'High-level KPIs and traffic overview', icon: 'FileText' },
  { name: 'Technical Audit', description: 'Full site health and Core Web Vitals', icon: 'ShieldCheck' },
  { name: 'Keyword Performance', description: 'Ranking changes and opportunities', icon: 'Search' },
  { name: 'Backlink Report', description: 'Link profile growth and quality', icon: 'Link2' },
  { name: 'Competitor Benchmark', description: 'Side-by-side competitor analysis', icon: 'Users' },
  { name: 'AI SEO Report', description: 'AI visibility and GEO metrics', icon: 'Sparkles' },
];

/* ---------- Settings screen ---------- */

export const settingsSections = [
  { id: 'profile', label: 'Profile', icon: 'User' },
  { id: 'notifications', label: 'Notifications', icon: 'Bell' },
  { id: 'integrations', label: 'Integrations', icon: 'Plug' },
  { id: 'billing', label: 'Billing', icon: 'CreditCard' },
  { id: 'appearance', label: 'Appearance', icon: 'Palette' },
  { id: 'api', label: 'API Access', icon: 'Code' },
];

export const integrations = [
  { name: 'Google Search Console', connected: true, description: 'Search performance and indexing data' },
  { name: 'Google Analytics 4', connected: true, description: 'Traffic and user behavior metrics' },
  { name: 'Google Looker Studio', connected: false, description: 'Build custom SEO dashboards' },
  { name: 'Slack', connected: true, description: 'Send alerts and reports to channels' },
  { name: 'Zapier', connected: false, description: 'Automate workflows with 5,000+ apps' },
  { name: 'Ahrefs API', connected: false, description: 'Pull backlink and keyword data' },
];

export const notificationSettings = [
  { label: 'Site audit completed', email: true, push: true },
  { label: 'New backlink found', email: true, push: false },
  { label: 'Keyword ranking changed', email: false, push: true },
  { label: 'Lost keyword ranking', email: true, push: true },
  { label: 'Weekly report ready', email: true, push: false },
  { label: 'AI score updated', email: false, push: true },
  { label: 'Competitor movement detected', email: false, push: false },
];

export const planInfo = {
  name: 'Pro Plan',
  price: '$99',
  cycle: '/month',
  projects: '10 projects',
  keywords: '5,000 tracked keywords',
  audits: 'Weekly site audits',
  renewal: 'Aug 15, 2025',
};
