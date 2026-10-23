import entities from '../../../../migration/contracts/entities.json' with { type: 'json' };
import type { Course, Image, Language, Offer, SeoPage, Service, ServiceStub } from './types.ts';
import { nodeId, pageUrl } from './url.ts';

type Node = Record<string, unknown>;
type Ref = { '@id': string };

const PERSON: Ref = { '@id': entities.person['@id'] };
const ORGANIZATION: Ref = { '@id': entities.organization['@id'] };
const WEBSITE: Ref = { '@id': entities.website['@id'] };

const IN_LANGUAGE: Record<Language, string> = { pl: 'pl-PL', en: 'en' };
const CATALOG_NAME: Record<Language, string> = { pl: 'Usługi', en: 'Services' };

/** Drops undefined values and empty arrays so optional data never emits empty properties. */
function compact<T extends Node>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)),
  ) as T;
}

const imageObject = (image: Image | undefined): Node | undefined =>
  image && compact({ '@type': 'ImageObject', url: image.url, width: image.width, height: image.height, caption: image.alt });

function offerNode(offer: Offer): Node {
  return compact({
    '@type': 'Offer',
    name: offer.name,
    description: offer.description,
    price: offer.price === undefined ? undefined : String(offer.price),
    priceCurrency: offer.price === undefined ? undefined : (offer.priceCurrency ?? 'PLN'),
    availability: offer.availability && `https://schema.org/${offer.availability}`,
    availabilityStarts: offer.availabilityStarts,
    validThrough: offer.validThrough,
    seller: offer.soldByOrganization ? ORGANIZATION : undefined,
    priceSpecification: offer.monthly && {
      '@type': 'UnitPriceSpecification',
      price: String(offer.monthly.price),
      priceCurrency: offer.priceCurrency ?? 'PLN',
      billingDuration: offer.monthly.billingDuration,
      billingIncrement: 1,
      unitCode: 'MON',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
    },
  });
}

/** A node defined on another page: typed stub so validators never see a bare @id. */
function stub(language: Language, s: ServiceStub): Node {
  const entity = s.entity ?? 'service';
  return {
    '@type': entity === 'course' ? 'Course' : 'Service',
    '@id': nodeId(language, s.path, entity),
    name: s.name,
    url: pageUrl(language, s.path),
    ...(s.description && { description: s.description, provider: ORGANIZATION }),
  };
}

const offerCatalogItems = (language: Language, services: ServiceStub[]) =>
  services.map((s) => ({ '@type': 'Offer', itemOffered: stub(language, s) }));

function serviceNode(page: SeoPage, service: Service): Node {
  return compact({
    '@type': 'Service',
    '@id': nodeId(page.language, page.path, 'service'),
    name: service.name,
    description: service.description,
    serviceType: service.serviceType,
    url: pageUrl(page.language, page.path),
    provider: ORGANIZATION,
    areaServed: { '@type': 'Country', name: service.areaServed ?? 'Polska' },
    offers: service.offers.map(offerNode),
  });
}

function courseNode(page: SeoPage, course: Course): Node {
  const { language, path } = page;
  return compact({
    '@type': 'Course',
    '@id': nodeId(language, path, 'course'),
    name: course.name,
    url: pageUrl(language, path),
    description: course.description,
    inLanguage: IN_LANGUAGE[language],
    provider: ORGANIZATION,
    author: PERSON,
    educationalLevel: course.educationalLevel,
    isAccessibleForFree: course.isAccessibleForFree,
    audience: course.audience && { '@type': 'BusinessAudience', name: course.audience },
    teaches: course.teaches,
    hasCourseInstance:
      course.instance &&
      compact({
        '@type': 'CourseInstance',
        '@id': nodeId(language, path, 'course-instance'),
        ...course.instance,
        inLanguage: IN_LANGUAGE[language],
        instructor: PERSON,
      }),
    offers: course.offers.map(offerNode),
  });
}

/** Per-kind part of the graph: the WebPage subtype, what it is about, and the nodes it adds. */
interface KindPart {
  webPageType: string;
  about?: Ref;
  mainEntity?: Node;
  webPage?: Node;
  nodes: Node[];
  person?: Node;
}

function kindPart(page: SeoPage): KindPart {
  const { language, path } = page;
  switch (page.kind) {
    case 'home':
      return {
        webPageType: 'WebPage',
        about: PERSON,
        mainEntity: { '@type': 'OfferCatalog', name: CATALOG_NAME[language], itemListElement: offerCatalogItems(language, page.services) },
        nodes: [],
      };
    case 'service': {
      const ref = { '@id': nodeId(language, path, 'service') };
      return { webPageType: 'WebPage', about: ref, mainEntity: ref, nodes: [serviceNode(page, page.service)] };
    }
    case 'course': {
      const ref = { '@id': nodeId(language, path, 'course') };
      return { webPageType: 'WebPage', about: ref, mainEntity: ref, webPage: { author: PERSON }, nodes: [courseNode(page, page.course)] };
    }
    case 'post': {
      const { post } = page;
      const blogRef = { '@id': nodeId(language, post.blog.path, 'blog') };
      const article = compact({
        '@type': 'BlogPosting',
        '@id': nodeId(language, path, 'article'),
        headline: post.headline,
        description: page.seo.description,
        image: imageObject(post.image),
        datePublished: post.datePublished,
        dateModified: post.dateModified,
        wordCount: post.wordCount,
        articleSection: post.section,
        inLanguage: IN_LANGUAGE[language],
        mainEntityOfPage: { '@id': nodeId(language, path, 'webpage') },
        isPartOf: blogRef,
        author: PERSON,
        publisher: PERSON,
      });
      const blogStub = { '@type': 'Blog', ...blogRef, name: post.blog.name, url: pageUrl(language, post.blog.path) };
      return { webPageType: 'WebPage', nodes: [article, blogStub] };
    }
    case 'blogIndex': {
      const ref = { '@id': nodeId(language, path, 'blog') };
      const blog = {
        '@type': 'Blog',
        ...ref,
        url: pageUrl(language, path),
        name: page.blog.name,
        description: page.blog.description,
        inLanguage: IN_LANGUAGE[language],
        publisher: PERSON,
        author: PERSON,
      };
      return { webPageType: 'CollectionPage', about: ref, mainEntity: ref, nodes: [blog] };
    }
    case 'contact':
      return {
        webPageType: 'ContactPage',
        about: ORGANIZATION,
        mainEntity: ORGANIZATION,
        webPage: { significantLink: page.significantLinks?.map((p) => pageUrl(language, p)) },
        nodes: [],
      };
    case 'about':
      return {
        webPageType: 'ProfilePage',
        about: PERSON,
        mainEntity: PERSON,
        nodes: [],
        person: compact({
          hasOccupation:
            page.occupation &&
            compact({
              '@type': 'Occupation',
              name: page.occupation.name,
              occupationLocation: page.occupation.location && { '@type': 'Country', name: page.occupation.location },
              skills: page.occupation.skills,
            }),
          makesOffer: offerCatalogItems(language, page.services),
        }),
      };
    case 'generic':
      return { webPageType: 'WebPage', nodes: [] };
  }
}

function breadcrumbNode(page: SeoPage): Node | undefined {
  if (page.breadcrumbs.length < 2) return undefined;
  return {
    '@type': 'BreadcrumbList',
    '@id': nodeId(page.language, page.path, 'breadcrumb'),
    itemListElement: page.breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.path === '/' && page.language === 'pl' ? `${pageUrl('pl', '/')}/` : pageUrl(page.language, crumb.path),
    })),
  };
}

function faqNode(page: SeoPage, about: Ref | undefined): Node | undefined {
  if (!page.faq?.length) return undefined;
  return compact({
    '@type': 'FAQPage',
    '@id': nodeId(page.language, page.path, 'faq'),
    isPartOf: { '@id': nodeId(page.language, page.path, 'webpage') },
    about,
    inLanguage: IN_LANGUAGE[page.language],
    mainEntity: page.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  });
}

/** One JSON-LD document per page: a single @graph with the site entities and the page's own nodes. */
export function buildGraph(page: SeoPage): { '@context': 'https://schema.org'; '@graph': Node[] } {
  const part = kindPart(page);
  const breadcrumb = breadcrumbNode(page);
  const webPage = compact({
    '@type': part.webPageType,
    '@id': nodeId(page.language, page.path, 'webpage'),
    url: pageUrl(page.language, page.path),
    name: page.name,
    description: page.seo.description,
    inLanguage: IN_LANGUAGE[page.language],
    isPartOf: WEBSITE,
    about: part.about,
    mainEntity: part.mainEntity,
    breadcrumb: breadcrumb && { '@id': breadcrumb['@id'] },
    primaryImageOfPage: imageObject(page.primaryImage),
    dateModified: page.dateModified,
    ...part.webPage,
  });
  const graph = [
    webPage,
    ...part.nodes,
    breadcrumb,
    faqNode(page, part.about === PERSON || part.about === ORGANIZATION ? undefined : part.about),
    { ...entities.person, ...(page.entityImages && { image: imageObject(page.entityImages.person) }), ...part.person },
    { ...entities.organization, ...(page.entityImages && { logo: imageObject(page.entityImages.organization) }) },
    entities.website,
  ].filter((node): node is Node => node !== undefined);
  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Serialized for a `<script type="application/ld+json">`. `<` is escaped so content can never close the tag. */
export function serializeGraph(page: SeoPage): string {
  return JSON.stringify(buildGraph(page)).replace(/</g, '\\u003c');
}
