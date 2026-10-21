// Run: node apps/web/src/seo/fixtures/derive.mjs
// Rebuilds the six SeoPage fixtures from the live snapshot in migration/00-inventory/live-site.
// Each fixture is what a route would pass to buildGraph() for that page, so the parity test
// can check that the builder reproduces the live graph from typed input.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const LIVE = here('../../../../../migration/00-inventory/live-site/');

export const SAMPLES = {
  home: { file: 'index', path: '/', kind: 'home' },
  service: { file: 'szkolenie-i-wdrozenie-pipedrive', path: '/szkolenie-i-wdrozenie-pipedrive', kind: 'service' },
  course: { file: 'kurs-ai-w-sprzedazy', path: '/kurs-ai-w-sprzedazy', kind: 'course' },
  post: { file: 'blog_ai-w-sprzedazy', path: '/blog/ai-w-sprzedazy', kind: 'post' },
  contact: { file: 'kontakt', path: '/kontakt', kind: 'contact' },
  about: { file: 'o-mnie', path: '/o-mnie', kind: 'about' },
};

export const liveJsonLd = (file) => JSON.parse(readFileSync(`${LIVE}jsonld/${file}.json`, 'utf8'));

const liveNodes = (file) => liveJsonLd(file).flatMap((block) => block['@graph'] ?? [block]);
const pathOf = (url) => new URL(url).pathname.replace(/(.)\/$/, '$1');

function headMeta(file) {
  const html = readFileSync(`${LIVE}html/${file}.html`, 'utf8');
  const attr = (value) =>
    html.match(new RegExp(`<meta content="([^"]*)" (?:name|property)="${value}"`))?.[1] ??
    html.match(new RegExp(`<meta (?:name|property)="${value}" content="([^"]*)"`))?.[1];
  const decode = (s) => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
  return {
    title: decode(html.match(/<title>([^<]*)<\/title>/)[1]),
    description: decode(attr('description')),
    ogImage: decode(attr('og:image')),
  };
}

function offer(o) {
  const spec = o.priceSpecification;
  return {
    name: o.name,
    description: o.description,
    price: o.price === undefined ? undefined : Number(o.price),
    priceCurrency: o.priceCurrency,
    availability: o.availability?.replace('https://schema.org/', ''),
    availabilityStarts: o.availabilityStarts,
    validThrough: o.validThrough,
    monthly: spec && { price: Number(spec.price), billingDuration: spec.billingDuration },
    soldByOrganization: o.seller ? true : undefined,
  };
}

const stubs = (offers) =>
  offers.map(({ itemOffered: s }) => ({ name: s.name, path: pathOf(s.url), entity: s['@type'] === 'Course' ? 'course' : undefined }));

function derive({ file, path, kind }) {
  const nodes = liveNodes(file);
  const byType = (type) => nodes.find((n) => n['@type'] === type);
  const webPage = nodes.find((n) => String(n['@id']).endsWith('#webpage'));
  const meta = headMeta(file);
  const crumbs = byType('BreadcrumbList')?.itemListElement ?? [];
  const faq = byType('FAQPage')?.mainEntity ?? [];

  const base = {
    language: 'pl',
    path,
    name: webPage?.name ?? byType('BlogPosting').headline,
    seo: { title: meta.title, description: meta.description, ogImage: meta.ogImage && { url: meta.ogImage } },
    breadcrumbs: crumbs.map((c) => ({ name: c.name, path: c.item ? pathOf(c.item) || '/' : path })),
    primaryImage: webPage?.primaryImageOfPage && { url: webPage.primaryImageOfPage.url },
    dateModified: webPage?.dateModified,
    faq: faq.length ? faq.map((q) => ({ question: q.name, answer: q.acceptedAnswer.text })) : undefined,
  };

  switch (kind) {
    case 'home':
      return { ...base, kind, services: stubs(webPage.mainEntity.itemListElement) };
    case 'service': {
      const s = byType('Service');
      return { ...base, kind, service: { name: s.name, description: s.description, serviceType: s.serviceType, areaServed: s.areaServed?.name, offers: s.offers.map(offer) } };
    }
    case 'course': {
      const c = byType('Course');
      const i = c.hasCourseInstance;
      return {
        ...base,
        kind,
        course: {
          name: c.name,
          description: c.description,
          educationalLevel: c.educationalLevel,
          isAccessibleForFree: c.isAccessibleForFree,
          audience: c.audience?.name,
          teaches: c.teaches,
          instance: i && { name: i.name, courseMode: i.courseMode, courseWorkload: i.courseWorkload, startDate: i.startDate },
          offers: c.offers.map(offer),
        },
      };
    }
    case 'post': {
      const p = byType('BlogPosting');
      const blog = liveNodes('blog').find((n) => n['@type'] === 'Blog');
      return {
        ...base,
        kind,
        post: {
          headline: p.headline,
          blog: { name: blog.name, path: pathOf(blog.url) },
          image: { url: p.image },
          datePublished: p.datePublished,
          dateModified: p.dateModified,
        },
      };
    }
    case 'contact':
      return { ...base, kind, significantLinks: webPage.significantLink?.map(pathOf) };
    case 'about': {
      const o = webPage.mainEntity.hasOccupation;
      return {
        ...base,
        kind,
        occupation: o && { name: o.name, location: o.occupationLocation?.name, skills: o.skills },
        services: stubs(webPage.mainEntity.makesOffer),
      };
    }
  }
}

const strip = (value) => JSON.parse(JSON.stringify(value));

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, sample] of Object.entries(SAMPLES)) {
    writeFileSync(here(`./${name}.json`), `${JSON.stringify(strip(derive(sample)), null, 2)}\n`);
    console.log(`wrote fixtures/${name}.json`);
  }
}
