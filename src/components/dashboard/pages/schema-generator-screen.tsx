import { useMemo, useState } from 'react';
import { Braces, Check, Clipboard, Download, Globe2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { cn } from '@/lib/utils';

interface SchemaForm {
  siteUrl: string;
  siteName: string;
  logoUrl: string;
  socialUrls: string;
  pageUrl: string;
  parentSection: string;
  parentUrl: string;
  pageTitle: string;
  h1: string;
  description: string;
  imageUrl: string;
  authorName: string;
  authorUrl: string;
  keywords: string;
  entityType: string;
}

const initialForm: SchemaForm = {
  siteUrl: 'https://example.com',
  siteName: 'Example Website',
  logoUrl: 'https://example.com/logo.png',
  socialUrls: 'https://linkedin.com/company/example\nhttps://twitter.com/example',
  pageUrl: 'https://example.com/services/seo',
  parentSection: 'Services',
  parentUrl: 'https://example.com/services',
  pageTitle: 'SEO Services',
  h1: 'Grow your organic visibility',
  description: 'Performance-focused SEO services that help your business attract qualified organic traffic.',
  imageUrl: 'https://example.com/images/seo-services.jpg',
  authorName: 'Example Team',
  authorUrl: 'https://example.com/about',
  keywords: 'seo services, technical seo, organic growth',
  entityType: 'WebPage',
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).toString().replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/$/, '');
  }
}

function buildSchema(form: SchemaForm) {
  const siteUrl = normalizeUrl(form.siteUrl) || 'https://example.com';
  const pageUrl = normalizeUrl(form.pageUrl) || siteUrl;
  const sameAs = form.socialUrls.split('\n').map((value) => value.trim()).filter(Boolean);
  const entityType = form.entityType || 'WebPage';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: form.siteName || 'Example Website',
        url: siteUrl,
        logo: form.logoUrl || `${siteUrl}/logo.png`,
        sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: form.siteName || 'Example Website',
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: form.parentSection || 'Section', item: normalizeUrl(form.parentUrl) || `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: form.pageTitle || 'Page', item: pageUrl },
        ],
      },
      {
        '@type': entityType,
        '@id': `${pageUrl}/#entity`,
        url: pageUrl,
        name: form.pageTitle || 'Page title',
        headline: form.h1 || form.pageTitle || 'Page heading',
        description: form.description,
        image: form.imageUrl,
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${pageUrl}/#breadcrumb` },
        author: {
          '@type': 'Person',
          name: form.authorName || 'Author name',
          url: form.authorUrl || `${siteUrl}/about`,
        },
        publisher: { '@id': `${siteUrl}/#organization` },
        keywords: form.keywords,
      },
    ],
  };
}

const fieldGroups = [
  {
    title: 'Website details',
    fields: [
      ['siteUrl', 'Website URL', 'https://example.com'],
      ['siteName', 'Website name', 'Example Website'],
      ['logoUrl', 'Logo URL', 'https://example.com/logo.png'],
      ['socialUrls', 'Social URLs (one per line)', 'https://linkedin.com/company/example'],
    ],
  },
  {
    title: 'Page details',
    fields: [
      ['pageUrl', 'Page URL', 'https://example.com/services/seo'],
      ['pageTitle', 'Page title', 'SEO Services'],
      ['h1', 'H1 heading', 'Grow your organic visibility'],
      ['description', 'Meta description', 'A concise description of this page'],
      ['imageUrl', 'Featured image URL', 'https://example.com/images/featured.jpg'],
      ['keywords', 'Keywords, comma separated', 'seo, organic traffic, search'],
    ],
  },
  {
    title: 'Breadcrumb & author',
    fields: [
      ['parentSection', 'Parent section', 'Services'],
      ['parentUrl', 'Parent URL', 'https://example.com/services'],
      ['authorName', 'Author name', 'Example Team'],
      ['authorUrl', 'Author profile URL', 'https://example.com/about'],
    ],
  },
];

export function SchemaGeneratorScreen() {
  const [form, setForm] = useState<SchemaForm>(initialForm);
  const [copied, setCopied] = useState(false);
  const schema = useMemo(() => buildSchema(form), [form]);
  const output = JSON.stringify(schema, null, 2);

  const updateField = (key: keyof SchemaForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setCopied(false);
  };

  const copySchema = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadSchema = () => {
    const blob = new Blob([output], { type: 'application/ld+json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'schema.json';
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageHeader
        title="Schema Generator"
        description="Create ready-to-paste JSON-LD structured data for any website page"
        icon={<Braces className="h-5 w-5" />}
        actions={
          <>
            <button onClick={downloadSchema} className="flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted">
              <Download className="h-4 w-4" />
              Download JSON
            </button>
            <button onClick={copySchema} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90">
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy Schema'}
            </button>
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.1fr)]">
        <Card className="rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3 border-b pb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Website information</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Paste your URL and fill in the page details.</p>
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {fieldGroups.map((group) => (
              <section key={group.title}>
                <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
                <div className="space-y-3">
                  {group.fields.map(([key, label, placeholder]) => {
                    const fieldKey = key as keyof SchemaForm;
                    const isLong = key === 'description' || key === 'socialUrls';
                    return (
                      <label key={key} className="block">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        {isLong ? (
                          <textarea
                            value={form[fieldKey]}
                            onChange={(event) => updateField(fieldKey, event.target.value)}
                            placeholder={placeholder}
                            rows={key === 'description' ? 3 : 2}
                            className="mt-1 w-full rounded-xl border bg-muted/40 px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                          />
                        ) : (
                          <input
                            value={form[fieldKey]}
                            onChange={(event) => updateField(fieldKey, event.target.value)}
                            placeholder={placeholder}
                            className="mt-1 h-10 w-full rounded-xl border bg-muted/40 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <section>
              <h3 className="mb-3 text-sm font-semibold">Entity type</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {['WebPage', 'Article', 'Product', 'Service', 'Event', 'FAQPage', 'HowTo', 'LocalBusiness', 'JobPosting'].map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('entityType', type)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all',
                      form.entityType === type ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-muted/30 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-2xl bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <h2 className="text-base font-semibold">Generated JSON-LD</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Live preview updates as you type</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">Valid JSON</span>
          </div>
          <pre className="scrollbar-thin max-h-[760px] overflow-auto p-5 text-[11px] leading-5 text-emerald-100 sm:text-xs">{output}</pre>
          <div className="border-t border-white/10 px-5 py-3 text-xs text-slate-400">
            Add this as a <code className="text-emerald-300">application/ld+json</code> script in your page head.
          </div>
        </Card>
      </div>
    </div>
  );
}
