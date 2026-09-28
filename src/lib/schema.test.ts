import { describe, expect, it } from 'vitest';
import {
  buildSchema,
  entityTypes,
  getMissingFields,
  initialSchemaForm,
  normalizePageUrl,
  normalizeSiteUrl,
  parseFaqs,
  prune,
  type EntityType,
  type SchemaForm,
} from './schema';

const form = (overrides: Partial<SchemaForm> = {}): SchemaForm => ({ ...initialSchemaForm, ...overrides });
const graph = (f: SchemaForm) => buildSchema(f)['@graph'];
const node = (f: SchemaForm, type: string) => graph(f).find((n) => n['@type'] === type);

describe('URL normalisation', () => {
  it('drops the trailing slash from site URLs', () => {
    expect(normalizeSiteUrl(' https://example.com/ ')).toBe('https://example.com');
    expect(normalizeSiteUrl('')).toBe('');
  });

  it('keeps the trailing slash on page URLs', () => {
    expect(normalizePageUrl('https://example.com/blog/')).toBe('https://example.com/blog/');
    expect(normalizePageUrl('https://example.com/blog')).toBe('https://example.com/blog');
  });

  it('passes invalid URLs through trimmed', () => {
    expect(normalizePageUrl('  not a url ')).toBe('not a url');
  });
});

describe('prune', () => {
  it('removes empty values and type-only objects', () => {
    expect(
      prune({
        '@type': 'Thing',
        name: 'x',
        empty: '',
        list: [],
        nested: { '@type': 'PostalAddress', streetAddress: '' },
        keep: { '@id': 'a' },
      })
    ).toEqual({ '@type': 'Thing', name: 'x', keep: { '@id': 'a' } });
  });
});

describe('parseFaqs', () => {
  it('parses "Question | Answer" lines and skips malformed ones', () => {
    expect(parseFaqs('Q1? | A1\nno separator\n | missing question\nQ2? | A | with pipe')).toEqual([
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A | with pipe' },
    ]);
  });
});

describe('buildSchema', () => {
  it('always emits the Organization, WebSite, page and BreadcrumbList nodes', () => {
    const types = graph(form()).map((n) => n['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'WebPage', 'BreadcrumbList']);
  });

  it('builds fragment ids from the page URL without inserting a slash', () => {
    const page = node(form({ pageUrl: 'https://example.com/services/seo' }), 'WebPage')!;
    expect(page['@id']).toBe('https://example.com/services/seo#webpage');
    expect(page.breadcrumb).toEqual({ '@id': 'https://example.com/services/seo#breadcrumb' });
  });

  it('only adds a SearchAction when the site has search', () => {
    expect(node(form(), 'WebSite')!.potentialAction).toBeUndefined();
    const action = node(form({ hasSiteSearch: true }), 'WebSite')!.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
  });

  it('omits empty optional fields instead of emitting empty strings', () => {
    const json = JSON.stringify(buildSchema(form({ description: '', imageUrl: '', keywords: '', socialUrls: '' })));
    expect(json).not.toContain('""');
    expect(json).not.toContain('sameAs');
  });

  it('never emits empty strings for any entity type with a blank form', () => {
    const blank = Object.fromEntries(
      Object.entries(initialSchemaForm).map(([k, v]) => [k, typeof v === 'string' ? '' : v])
    ) as unknown as SchemaForm;
    for (const entityType of entityTypes) {
      expect(JSON.stringify(buildSchema({ ...blank, entityType })), entityType).not.toContain('""');
    }
  });

  it.each(entityTypes.filter((t) => t !== 'WebPage' && t !== 'FAQPage'))(
    '%s gets its own node linked to the page',
    (entityType: EntityType) => {
      const f = form({ entityType });
      const entity = node(f, entityType)!;
      expect(entity).toBeDefined();
      expect(entity.mainEntityOfPage).toEqual({ '@id': node(f, 'WebPage')!['@id'] });
      // Article-only properties must not leak onto other types.
      if (entityType !== 'Article') {
        expect(entity).not.toHaveProperty('headline');
        expect(entity).not.toHaveProperty('author');
      }
    }
  );

  it('Article has headline, dates, author and publisher', () => {
    const article = node(form({ entityType: 'Article', dateModified: '' }), 'Article')!;
    expect(article).toMatchObject({
      headline: 'Grow your organic visibility',
      datePublished: '2026-01-15',
      dateModified: '2026-01-15',
      author: { '@type': 'Person', name: 'Example Team' },
      publisher: { '@id': 'https://example.com/#organization' },
    });
  });

  it('Product has an Offer with a schema.org availability URL', () => {
    const product = node(form({ entityType: 'Product', priceCurrency: 'usd' }), 'Product')!;
    expect(product.offers).toMatchObject({
      '@type': 'Offer',
      price: '499.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
    expect(node(form({ entityType: 'Product', price: '' }), 'Product')).not.toHaveProperty('offers');
  });

  it('Event has a start date and a Place with a PostalAddress', () => {
    const event = node(form({ entityType: 'Event' }), 'Event')!;
    expect(event.startDate).toBe('2026-11-12T09:00');
    expect(event.location).toMatchObject({
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: 'Austin', addressCountry: 'US' },
    });
  });

  it('FAQPage turns the page node into an FAQPage with Question/Answer pairs', () => {
    const f = form({ entityType: 'FAQPage', faqs: 'Is it free? | Yes.' });
    expect(node(f, 'WebPage')).toBeUndefined();
    expect(node(f, 'FAQPage')!.mainEntity).toEqual([
      { '@type': 'Question', name: 'Is it free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } },
    ]);
  });

  it('HowTo numbers its steps', () => {
    const howTo = node(form({ entityType: 'HowTo', steps: 'One\n\nTwo' }), 'HowTo')!;
    expect(howTo.step).toEqual([
      { '@type': 'HowToStep', position: 1, text: 'One' },
      { '@type': 'HowToStep', position: 2, text: 'Two' },
    ]);
  });

  it('LocalBusiness has an address and telephone', () => {
    const business = node(form({ entityType: 'LocalBusiness' }), 'LocalBusiness')!;
    expect(business).toMatchObject({
      name: 'Example Website',
      telephone: '+1-512-555-0100',
      address: { '@type': 'PostalAddress', streetAddress: '100 Main Street' },
    });
  });

  it('JobPosting uses jobLocation on-site and TELECOMMUTE when remote', () => {
    const onsite = node(form({ entityType: 'JobPosting' }), 'JobPosting')!;
    expect(onsite).toMatchObject({
      title: 'Grow your organic visibility',
      datePosted: '2026-09-01',
      employmentType: 'FULL_TIME',
      hiringOrganization: { '@id': 'https://example.com/#organization' },
      jobLocation: { '@type': 'Place' },
    });
    const remote = node(form({ entityType: 'JobPosting', remote: true }), 'JobPosting')!;
    expect(remote).not.toHaveProperty('jobLocation');
    expect(remote).toMatchObject({
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: { '@type': 'Country', name: 'US' },
    });
  });
});

describe('getMissingFields', () => {
  it('reports nothing for the sample data of every type', () => {
    for (const entityType of entityTypes) {
      expect(getMissingFields(form({ entityType })), entityType).toEqual([]);
    }
  });

  it('reports type-specific required fields', () => {
    expect(getMissingFields(form({ entityType: 'Article', datePublished: '' }))).toEqual(['Date published']);
    expect(getMissingFields(form({ entityType: 'Product', price: '' }))).toEqual(['Price']);
    expect(getMissingFields(form({ entityType: 'Event', startDate: '', locationName: '' }))).toEqual([
      'Start date',
      'Venue name',
    ]);
    expect(getMissingFields(form({ entityType: 'FAQPage', faqs: 'no separator' }))).toEqual([
      'At least one "Question | Answer" line',
    ]);
    expect(getMissingFields(form({ entityType: 'JobPosting', remote: true, streetAddress: '' }))).toEqual([]);
  });
});
