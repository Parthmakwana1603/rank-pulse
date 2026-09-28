import { useMemo, useState } from 'react';
import { AlertTriangle, Braces, Check, Clipboard, Download, Globe2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '../page-header';
import { cn } from '@/lib/utils';
import {
  buildSchema,
  entityTypes,
  getMissingFields,
  initialSchemaForm,
  type EntityType,
  type SchemaForm,
} from '@/lib/schema';

type FieldKind = 'text' | 'textarea' | 'date' | 'datetime-local' | 'select' | 'checkbox';

interface FieldDef {
  key: keyof SchemaForm;
  label: string;
  placeholder?: string;
  kind?: FieldKind;
  options?: { value: string; label: string }[];
}

interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

const baseGroups: FieldGroup[] = [
  {
    title: 'Website details',
    fields: [
      { key: 'siteUrl', label: 'Website URL', placeholder: 'https://example.com' },
      { key: 'siteName', label: 'Website name', placeholder: 'Example Website' },
      { key: 'logoUrl', label: 'Logo URL', placeholder: 'https://example.com/logo.png' },
      { key: 'socialUrls', label: 'Social URLs (one per line)', placeholder: 'https://linkedin.com/company/example', kind: 'textarea' },
      { key: 'hasSiteSearch', label: 'Site has a search page at /search?q=', kind: 'checkbox' },
    ],
  },
  {
    title: 'Page details',
    fields: [
      { key: 'pageUrl', label: 'Page URL', placeholder: 'https://example.com/services/seo' },
      { key: 'pageTitle', label: 'Page title', placeholder: 'SEO Services' },
      { key: 'h1', label: 'H1 heading', placeholder: 'Grow your organic visibility' },
      { key: 'description', label: 'Meta description', placeholder: 'A concise description of this page', kind: 'textarea' },
      { key: 'imageUrl', label: 'Featured image URL', placeholder: 'https://example.com/images/featured.jpg' },
      { key: 'keywords', label: 'Keywords, comma separated', placeholder: 'seo, organic traffic, search' },
    ],
  },
  {
    title: 'Breadcrumb',
    fields: [
      { key: 'parentSection', label: 'Parent section', placeholder: 'Services' },
      { key: 'parentUrl', label: 'Parent URL', placeholder: 'https://example.com/services' },
    ],
  },
];

const addressFields: FieldDef[] = [
  { key: 'streetAddress', label: 'Street address', placeholder: '100 Main Street' },
  { key: 'addressLocality', label: 'City', placeholder: 'Austin' },
  { key: 'addressRegion', label: 'State / region', placeholder: 'TX' },
  { key: 'postalCode', label: 'Postal code', placeholder: '78701' },
  { key: 'addressCountry', label: 'Country code', placeholder: 'US' },
];

const typeGroups: Partial<Record<EntityType, FieldGroup>> = {
  Article: {
    title: 'Article details',
    fields: [
      { key: 'authorName', label: 'Author name', placeholder: 'Example Team' },
      { key: 'authorUrl', label: 'Author profile URL', placeholder: 'https://example.com/about' },
      { key: 'datePublished', label: 'Date published', kind: 'date' },
      { key: 'dateModified', label: 'Date modified (optional)', kind: 'date' },
    ],
  },
  Product: {
    title: 'Product details',
    fields: [
      { key: 'brand', label: 'Brand', placeholder: 'Example' },
      { key: 'sku', label: 'SKU', placeholder: 'SEO-PRO-01' },
      { key: 'price', label: 'Price', placeholder: '499.00' },
      { key: 'priceCurrency', label: 'Currency (ISO 4217)', placeholder: 'USD' },
      {
        key: 'availability',
        label: 'Availability',
        kind: 'select',
        options: [
          { value: 'InStock', label: 'In stock' },
          { value: 'OutOfStock', label: 'Out of stock' },
          { value: 'PreOrder', label: 'Pre-order' },
          { value: 'OnlineOnly', label: 'Online only' },
        ],
      },
    ],
  },
  Service: {
    title: 'Service details',
    fields: [
      { key: 'serviceType', label: 'Service type', placeholder: 'Search engine optimization' },
      { key: 'areaServed', label: 'Area served', placeholder: 'United States' },
    ],
  },
  Event: {
    title: 'Event details',
    fields: [
      { key: 'startDate', label: 'Start', kind: 'datetime-local' },
      { key: 'endDate', label: 'End (optional)', kind: 'datetime-local' },
      { key: 'locationName', label: 'Venue name', placeholder: 'Example Conference Center' },
      ...addressFields,
    ],
  },
  FAQPage: {
    title: 'Questions & answers',
    fields: [
      { key: 'faqs', label: 'One per line: Question | Answer', placeholder: 'What is SEO? | Search engine optimisation is…', kind: 'textarea' },
    ],
  },
  HowTo: {
    title: 'Steps',
    fields: [{ key: 'steps', label: 'One step per line', placeholder: 'Crawl the site', kind: 'textarea' }],
  },
  LocalBusiness: {
    title: 'Business details',
    fields: [
      { key: 'telephone', label: 'Telephone', placeholder: '+1-512-555-0100' },
      { key: 'priceRange', label: 'Price range', placeholder: '$$' },
      ...addressFields,
    ],
  },
  JobPosting: {
    title: 'Job details',
    fields: [
      { key: 'datePosted', label: 'Date posted', kind: 'date' },
      { key: 'validThrough', label: 'Valid through (optional)', kind: 'date' },
      {
        key: 'employmentType',
        label: 'Employment type',
        kind: 'select',
        options: [
          { value: 'FULL_TIME', label: 'Full time' },
          { value: 'PART_TIME', label: 'Part time' },
          { value: 'CONTRACTOR', label: 'Contractor' },
          { value: 'TEMPORARY', label: 'Temporary' },
          { value: 'INTERN', label: 'Intern' },
        ],
      },
      { key: 'remote', label: 'Fully remote role', kind: 'checkbox' },
      ...addressFields,
    ],
  },
};

const inputClass =
  'mt-1 w-full rounded-xl border bg-muted/40 px-3 text-sm outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20';

export function SchemaGeneratorScreen() {
  const [form, setForm] = useState<SchemaForm>(initialSchemaForm);
  const [copied, setCopied] = useState(false);
  const schema = useMemo(() => buildSchema(form), [form]);
  const missing = useMemo(() => getMissingFields(form), [form]);
  const output = JSON.stringify(schema, null, 2);
  const groups = [...baseGroups, ...(typeGroups[form.entityType] ? [typeGroups[form.entityType]!] : [])];

  const updateField = <K extends keyof SchemaForm>(key: K, value: SchemaForm[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setCopied(false);
  };

  const renderField = ({ key, label, placeholder, kind = 'text', options }: FieldDef) => {
    const value = form[key];
    if (kind === 'checkbox') {
      return (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateField(key, event.target.checked as never)}
            className="h-4 w-4 rounded border accent-primary"
          />
          <span className="text-muted-foreground">{label}</span>
        </label>
      );
    }
    const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      updateField(key, event.target.value as never);
    return (
      <label key={key} className="block">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {kind === 'textarea' ? (
          <textarea
            value={String(value)}
            onChange={onChange}
            placeholder={placeholder}
            rows={key === 'faqs' || key === 'steps' ? 4 : key === 'description' ? 3 : 2}
            className={cn(inputClass, 'py-2')}
          />
        ) : kind === 'select' ? (
          <select value={String(value)} onChange={onChange} className={cn(inputClass, 'h-10')}>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={kind}
            value={String(value)}
            onChange={onChange}
            placeholder={placeholder}
            className={cn(inputClass, 'h-10')}
          />
        )}
      </label>
    );
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
            <section>
              <h3 className="mb-3 text-sm font-semibold">Entity type</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {entityTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('entityType', type)}
                    aria-pressed={form.entityType === type}
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

            {groups.map((group) => (
              <section key={group.title}>
                <h3 className="mb-3 text-sm font-semibold">{group.title}</h3>
                <div className="space-y-3">{group.fields.map(renderField)}</div>
              </section>
            ))}
          </div>
        </Card>
        <Card className="min-w-0 overflow-hidden rounded-2xl bg-slate-950 shadow-sm xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <h2 className="text-base font-semibold">Generated JSON-LD</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Live preview updates as you type</p>
            </div>
            {missing.length === 0 ? (
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                Required fields complete
              </span>
            ) : (
              <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                {missing.length} required {missing.length === 1 ? 'field' : 'fields'} missing
              </span>
            )}
          </div>
          {missing.length > 0 && (
            <div className="flex gap-2 border-b border-white/10 bg-amber-400/5 px-5 py-3 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Needed for the {form.entityType} rich result: {missing.join(', ')}.
              </p>
            </div>
          )}
          <pre className="scrollbar-thin max-h-[760px] overflow-auto p-5 xl:max-h-[calc(100vh-16rem)] text-[11px] leading-5 text-emerald-100 sm:text-xs">{output}</pre>
          <div className="border-t border-white/10 px-5 py-3 text-xs text-slate-400">
            Add this as a <code className="text-emerald-300">application/ld+json</code> script in your page head.
          </div>
        </Card>
      </div>
    </div>
  );
}
