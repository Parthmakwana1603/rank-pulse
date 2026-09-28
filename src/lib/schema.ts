// Pure JSON-LD builder for the Schema Generator screen.

export const entityTypes = [
  'WebPage',
  'Article',
  'Product',
  'Service',
  'Event',
  'FAQPage',
  'HowTo',
  'LocalBusiness',
  'JobPosting',
] as const;

export type EntityType = (typeof entityTypes)[number];

export interface SchemaForm {
  entityType: EntityType;
  // Website
  siteUrl: string;
  siteName: string;
  logoUrl: string;
  socialUrls: string;
  hasSiteSearch: boolean;
  // Page
  pageUrl: string;
  pageTitle: string;
  h1: string;
  description: string;
  imageUrl: string;
  keywords: string;
  // Breadcrumb & author
  parentSection: string;
  parentUrl: string;
  authorName: string;
  authorUrl: string;
  // Article
  datePublished: string;
  dateModified: string;
  // Product
  brand: string;
  sku: string;
  price: string;
  priceCurrency: string;
  availability: string;
  // Service
  serviceType: string;
  areaServed: string;
  // Event
  startDate: string;
  endDate: string;
  locationName: string;
  // Address (Event, LocalBusiness, JobPosting)
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  // LocalBusiness
  telephone: string;
  priceRange: string;
  // FAQPage: one "Question | Answer" per line
  faqs: string;
  // HowTo: one step per line
  steps: string;
  // JobPosting
  datePosted: string;
  validThrough: string;
  employmentType: string;
  remote: boolean;
}

export const initialSchemaForm: SchemaForm = {
  entityType: 'WebPage',
  siteUrl: 'https://example.com',
  siteName: 'Example Website',
  logoUrl: 'https://example.com/logo.png',
  socialUrls: 'https://linkedin.com/company/example\nhttps://twitter.com/example',
  hasSiteSearch: false,
  pageUrl: 'https://example.com/services/seo',
  pageTitle: 'SEO Services',
  h1: 'Grow your organic visibility',
  description: 'Performance-focused SEO services that help your business attract qualified organic traffic.',
  imageUrl: 'https://example.com/images/seo-services.jpg',
  keywords: 'seo services, technical seo, organic growth',
  parentSection: 'Services',
  parentUrl: 'https://example.com/services',
  authorName: 'Example Team',
  authorUrl: 'https://example.com/about',
  datePublished: '2026-01-15',
  dateModified: '',
  brand: 'Example',
  sku: 'SEO-PRO-01',
  price: '499.00',
  priceCurrency: 'USD',
  availability: 'InStock',
  serviceType: 'Search engine optimization',
  areaServed: 'United States',
  startDate: '2026-11-12T09:00',
  endDate: '2026-11-12T17:00',
  locationName: 'Example Conference Center',
  streetAddress: '100 Main Street',
  addressLocality: 'Austin',
  addressRegion: 'TX',
  postalCode: '78701',
  addressCountry: 'US',
  telephone: '+1-512-555-0100',
  priceRange: '$$',
  faqs: 'What does an SEO audit include? | A crawl of your site, a technical issue report and a prioritised fix list.\nHow long until I see results? | Most sites see measurable gains within three to six months.',
  steps: 'Crawl the site\nFix critical technical issues\nOptimise on-page content\nBuild quality backlinks',
  datePosted: '2026-09-01',
  validThrough: '2026-12-31',
  employmentType: 'FULL_TIME',
  remote: false,
};

/** Parses a URL and drops the trailing slash so fragment ids can be appended. */
export function normalizeSiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).toString().replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/$/, '');
  }
}

/** Parses a page URL, keeping any trailing slash (it can be part of the canonical URL). */
export function normalizePageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
}

function lines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

export function parseFaqs(value: string) {
  return lines(value)
    .map((line) => {
      const index = line.indexOf('|');
      if (index === -1) return null;
      const question = line.slice(0, index).trim();
      const answer = line.slice(index + 1).trim();
      return question && answer ? { question, answer } : null;
    })
    .filter((faq): faq is { question: string; answer: string } => faq !== null);
}

type Json = string | number | boolean | null | undefined | Json[] | { [key: string]: Json };

/** Removes empty strings, empty arrays and objects that carry nothing beyond `@type`. */
export function prune(value: Json): Json {
  if (Array.isArray(value)) {
    const items = value.map(prune).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, v]) => [key, prune(v)] as const)
      .filter(([, v]) => v !== undefined);
    if (entries.every(([key]) => key === '@type')) return undefined;
    return Object.fromEntries(entries);
  }
  if (value === '' || value === null) return undefined;
  return value;
}

function postalAddress(form: SchemaForm) {
  return {
    '@type': 'PostalAddress',
    streetAddress: form.streetAddress.trim(),
    addressLocality: form.addressLocality.trim(),
    addressRegion: form.addressRegion.trim(),
    postalCode: form.postalCode.trim(),
    addressCountry: form.addressCountry.trim(),
  };
}

export function buildSchema(form: SchemaForm) {
  const siteUrl = normalizeSiteUrl(form.siteUrl) || 'https://example.com';
  const pageUrl = normalizePageUrl(form.pageUrl) || `${siteUrl}/`;
  const siteName = form.siteName.trim() || 'Example Website';
  const title = form.pageTitle.trim() || 'Page title';
  const heading = form.h1.trim() || title;
  const description = form.description.trim();
  const image = form.imageUrl.trim();

  const ids = {
    organization: `${siteUrl}/#organization`,
    website: `${siteUrl}/#website`,
    webpage: `${pageUrl}#webpage`,
    breadcrumb: `${pageUrl}#breadcrumb`,
    entity: `${pageUrl}#${form.entityType.toLowerCase()}`,
  };
  const ref = (id: string) => ({ '@id': id });

  const organization = {
    '@type': 'Organization',
    '@id': ids.organization,
    name: siteName,
    url: siteUrl,
    logo: form.logoUrl.trim() || `${siteUrl}/logo.png`,
    sameAs: lines(form.socialUrls),
  };

  const website = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: siteUrl,
    name: siteName,
    publisher: ref(ids.organization),
    potentialAction: form.hasSiteSearch
      ? {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: form.parentSection.trim() || 'Section',
        item: normalizePageUrl(form.parentUrl) || `${siteUrl}/services`,
      },
      { '@type': 'ListItem', position: 3, name: title, item: pageUrl },
    ],
  };

  const isFaq = form.entityType === 'FAQPage';
  const hasEntity = form.entityType !== 'WebPage' && !isFaq;

  const webpage = {
    '@type': isFaq ? 'FAQPage' : 'WebPage',
    '@id': ids.webpage,
    url: pageUrl,
    name: title,
    description,
    keywords: form.keywords.trim(),
    primaryImageOfPage: image ? { '@type': 'ImageObject', url: image } : undefined,
    isPartOf: ref(ids.website),
    breadcrumb: ref(ids.breadcrumb),
    mainEntity: isFaq
      ? parseFaqs(form.faqs).map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        }))
      : hasEntity
        ? ref(ids.entity)
        : undefined,
  };

  const graph: Json[] = [organization, website, webpage, breadcrumb];
  if (hasEntity) graph.push(buildEntity(form, { ...ids, heading, description, image, pageUrl, siteName }));

  return prune({ '@context': 'https://schema.org', '@graph': graph }) as {
    '@context': string;
    '@graph': Record<string, Json>[];
  };
}

function buildEntity(
  form: SchemaForm,
  ctx: {
    organization: string;
    webpage: string;
    entity: string;
    heading: string;
    description: string;
    image: string;
    pageUrl: string;
    siteName: string;
  }
): Json {
  const base = {
    '@type': form.entityType,
    '@id': ctx.entity,
    mainEntityOfPage: { '@id': ctx.webpage },
  };
  const org = { '@id': ctx.organization };

  switch (form.entityType) {
    case 'Article':
      return {
        ...base,
        headline: ctx.heading,
        description: ctx.description,
        image: ctx.image,
        datePublished: form.datePublished.trim(),
        dateModified: form.dateModified.trim() || form.datePublished.trim(),
        author: {
          '@type': 'Person',
          name: form.authorName.trim(),
          url: form.authorUrl.trim(),
        },
        publisher: org,
      };
    case 'Product':
      return {
        ...base,
        name: ctx.heading,
        description: ctx.description,
        image: ctx.image,
        sku: form.sku.trim(),
        brand: { '@type': 'Brand', name: form.brand.trim() },
        offers: form.price.trim()
          ? {
              '@type': 'Offer',
              url: ctx.pageUrl,
              price: form.price.trim(),
              priceCurrency: form.priceCurrency.trim().toUpperCase(),
              availability: form.availability ? `https://schema.org/${form.availability}` : '',
            }
          : undefined,
      };
    case 'Service':
      return {
        ...base,
        name: ctx.heading,
        description: ctx.description,
        image: ctx.image,
        serviceType: form.serviceType.trim(),
        areaServed: form.areaServed.trim(),
        provider: org,
      };
    case 'Event':
      return {
        ...base,
        name: ctx.heading,
        description: ctx.description,
        image: ctx.image,
        startDate: form.startDate.trim(),
        endDate: form.endDate.trim(),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: form.locationName.trim(),
          address: postalAddress(form),
        },
        organizer: org,
      };
    case 'HowTo':
      return {
        ...base,
        name: ctx.heading,
        description: ctx.description,
        image: ctx.image,
        step: lines(form.steps).map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
      };
    case 'LocalBusiness':
      return {
        ...base,
        name: ctx.siteName,
        url: ctx.pageUrl,
        description: ctx.description,
        image: ctx.image,
        telephone: form.telephone.trim(),
        priceRange: form.priceRange.trim(),
        address: postalAddress(form),
        parentOrganization: org,
      };
    case 'JobPosting':
      return {
        ...base,
        title: ctx.heading,
        description: ctx.description,
        datePosted: form.datePosted.trim(),
        validThrough: form.validThrough.trim(),
        employmentType: form.employmentType,
        hiringOrganization: org,
        ...(form.remote
          ? {
              jobLocationType: 'TELECOMMUTE',
              applicantLocationRequirements: {
                '@type': 'Country',
                name: form.addressCountry.trim(),
              },
            }
          : { jobLocation: { '@type': 'Place', address: postalAddress(form) } }),
      };
    default:
      return base;
  }
}

/** Lists fields Google requires for the chosen type's rich result that are still empty. */
export function getMissingFields(form: SchemaForm): string[] {
  const missing: string[] = [];
  const need = (value: string | undefined, label: string) => {
    if (!value || !value.trim()) missing.push(label);
  };
  const needAddress = () => {
    need(form.streetAddress, 'Street address');
    need(form.addressLocality, 'City');
    need(form.addressCountry, 'Country');
  };

  need(form.siteUrl, 'Website URL');
  need(form.pageUrl, 'Page URL');

  switch (form.entityType) {
    case 'Article':
      need(form.h1 || form.pageTitle, 'Headline (H1 or page title)');
      need(form.imageUrl, 'Featured image URL');
      need(form.datePublished, 'Date published');
      need(form.authorName, 'Author name');
      break;
    case 'Product':
      need(form.h1 || form.pageTitle, 'Product name (H1 or page title)');
      need(form.price, 'Price');
      if (form.price.trim()) need(form.priceCurrency, 'Currency');
      break;
    case 'Service':
      need(form.h1 || form.pageTitle, 'Service name (H1 or page title)');
      break;
    case 'Event':
      need(form.h1 || form.pageTitle, 'Event name (H1 or page title)');
      need(form.startDate, 'Start date');
      need(form.locationName, 'Venue name');
      needAddress();
      break;
    case 'FAQPage':
      if (parseFaqs(form.faqs).length === 0) missing.push('At least one "Question | Answer" line');
      break;
    case 'HowTo':
      if (lines(form.steps).length === 0) missing.push('At least one step');
      break;
    case 'LocalBusiness':
      need(form.siteName, 'Business name (website name)');
      needAddress();
      break;
    case 'JobPosting':
      need(form.h1 || form.pageTitle, 'Job title (H1 or page title)');
      need(form.description, 'Job description');
      need(form.datePosted, 'Date posted');
      if (form.remote) need(form.addressCountry, 'Country (applicant location)');
      else needAddress();
      break;
  }
  return missing;
}
