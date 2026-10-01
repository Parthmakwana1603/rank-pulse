export const reportTemplates = [
  {
    key: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level KPIs, site health and link profile',
    icon: 'FileText',
    defaultSections: ['KPIs', 'Site Audit', 'Keywords', 'Backlinks', 'Competitors'],
  },
  {
    key: 'technical-audit',
    name: 'Technical Audit',
    description: 'Site health and every issue from the latest audit',
    icon: 'ShieldCheck',
    defaultSections: ['Site Audit'],
  },
  {
    key: 'keyword-performance',
    name: 'Keyword Performance',
    description: 'Tracked keywords and their ranking data',
    icon: 'Search',
    defaultSections: ['Keywords'],
  },
  {
    key: 'backlink-report',
    name: 'Backlink Report',
    description: 'Link profile growth and quality',
    icon: 'Link2',
    defaultSections: ['Backlinks'],
  },
  {
    key: 'competitor-benchmark',
    name: 'Competitor Benchmark',
    description: 'Tracked competitors side by side',
    icon: 'Users',
    defaultSections: ['Competitors'],
  },
  {
    key: 'ai-seo-report',
    name: 'AI SEO Report',
    description: 'AI visibility and GEO metrics',
    icon: 'Sparkles',
    defaultSections: ['AI SEO'],
  },
] as const;

export type TemplateKey = (typeof reportTemplates)[number]['key'];

export const templateByKey = (key: string) => reportTemplates.find((t) => t.key === key);
