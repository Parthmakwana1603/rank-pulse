// Maps each dashboard page (by its sidebar label) to a URL path.
export const pageRoutes = [
  { label: 'Dashboard', path: '/' },
  { label: 'Schema Generator', path: '/schema-generator' },
  { label: 'Projects', path: '/projects' },
  { label: 'Keyword Rankings', path: '/keywords' },
  { label: 'Site Audit', path: '/site-audit' },
  { label: 'Backlinks', path: '/backlinks' },
  { label: 'Competitors', path: '/competitors' },
  { label: 'Content', path: '/content' },
  { label: 'AI SEO', path: '/ai-seo' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
] as const;

export type PageLabel = (typeof pageRoutes)[number]['label'];

export function pathForPage(label: string) {
  return pageRoutes.find((r) => r.label === label)?.path ?? '/';
}

export function pageForPath(pathname: string): PageLabel | undefined {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return pageRoutes.find((r) => r.path === normalized)?.label;
}
