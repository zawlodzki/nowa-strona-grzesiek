// Maps a route to the SeoPage that buildMeta() and buildGraph() read.
import type { ContentImage, PortableText } from '../../../../studio/sanity.types';
import type { Crumb, FaqEntry, Image, Language, Offer, PageKind, Seo, SeoPage, ServiceStub, SitePath } from '../../seo/types.ts';
import { BLOG_PATH, type Route } from './routes.ts';
import { resolveImage, type PageDoc, type PostDoc, type Site } from './site.ts';

const HOME_NAME: Record<Language, string> = { pl: 'Strona główna', en: 'Home' };
const BLOG = {
  pl: { name: 'Blog Grzegorza Zawłodzkiego', crumb: 'Blog', pageLabel: 'strona', title: 'Blog | Grzegorz Zawłodzki', description: 'Artykuły o CRM, automatyzacji i AI w sprzedaży B2B: procesy, wdrożenia, narzędzia i praca zespołów handlowych.' },
  en: { name: "Grzegorz Zawłodzki's blog", crumb: 'Blog', pageLabel: 'page', title: 'Blog | Grzegorz Zawłodzki', description: 'Articles on CRM, automation and AI in B2B sales.' },
} as const;

/** Plain text of Portable Text blocks, for JSON-LD answers. */
export function plainText(value: PortableText | undefined): string {
  return (value ?? [])
    .flatMap((item) => (item._type === 'block' ? [(item.children ?? []).map((span) => span.text ?? '').join('')] : []))
    .filter((text) => text.trim())
    .join('\n\n');
}

function seoImage(site: Site, value: ContentImage | undefined): Image | undefined {
  const image = resolveImage(site, value);
  return image && { url: image.src, width: image.width, height: image.height, ...(image.alt && { alt: image.alt }) };
}

function seoOf(site: Site, doc: PageDoc | PostDoc): Seo {
  const { title, description, noindex, canonicalOverride, ogImage } = doc.seo;
  const image = seoImage(site, ogImage);
  return { title, description, ...(image && { ogImage: image }), ...(noindex && { noindex }), ...(canonicalOverride && { canonicalOverride }) };
}

function translation(site: Site, doc: PageDoc | PostDoc): SeoPage['translation'] {
  const other = (site.translations.get(doc._id) ?? []).map((id) => site.byId.get(id)).find((item) => item && item.language !== doc.language);
  return other && { language: other.language, path: other.path };
}

function serviceStubs(site: Site, language: Language): ServiceStub[] {
  return site.services.flatMap((service) => {
    const page = service.page?._ref ? site.byId.get(service.page._ref) : undefined;
    return page && page.language === language && service.name ? [{ name: service.name, path: page.path }] : [];
  });
}

function offers(page: PageDoc): Offer[] {
  return (page.sections ?? []).flatMap((section) => section._type === 'pricing' ? section.plans ?? [] : [])
    .flatMap((plan) => plan.name ? [{ name: plan.name, ...(plan.price !== undefined && { price: plan.price, priceCurrency: plan.currency ?? 'PLN' }) }] : []);
}

function pageKind(site: Site, page: PageDoc): PageKind {
  if (page.path === '/') return { kind: 'home', services: serviceStubs(site, page.language) };
  if (page.path === '/kontakt') return { kind: 'contact' };
  if (page.path === '/o-mnie') return { kind: 'about', services: serviceStubs(site, page.language) };
  const service = site.services.find((item) => item.page?._ref === page._id);
  if (service?.name && service.description) {
    return {
      kind: 'service',
      service: {
        name: service.name,
        description: service.description,
        ...(service.serviceType && { serviceType: service.serviceType }),
        ...(service.areaServed && { areaServed: service.areaServed }),
        offers: offers(page),
      },
    };
  }
  return { kind: 'generic' };
}

function pageFaq(page: PageDoc): FaqEntry[] | undefined {
  const block = page.sections?.find((section) => section._type === 'faq' && section.emitSchema !== false);
  if (block?._type !== 'faq') return undefined;
  const entries = (block.items ?? []).flatMap(({ question, answer }) => question ? [{ question, answer: plainText(answer) }] : []);
  return entries.length ? entries : undefined;
}

function crumbs(language: Language, ...trail: Crumb[]): Crumb[] {
  return [{ name: HOME_NAME[language], path: '/' }, ...trail.filter((crumb) => crumb.path !== '/')];
}

export function seoPage(site: Site, route: Route): SeoPage {
  const { language, path } = route;
  if (route.kind === 'page') {
    const { page } = route;
    const hero = page.sections?.find((section) => section._type === 'hero');
    const primaryImage = seoImage(site, hero?._type === 'hero' ? hero.image : undefined);
    const faq = pageFaq(page);
    const pair = translation(site, page);
    return {
      ...pageKind(site, page),
      language, path,
      name: (hero?._type === 'hero' && hero.heading) || page.title,
      seo: seoOf(site, page),
      breadcrumbs: crumbs(language, { name: page.title, path }),
      ...(primaryImage && { primaryImage }),
      dateModified: page._updatedAt,
      ...(faq && { faq }),
      ...(pair && { translation: pair }),
    };
  }
  const blog = BLOG[language];
  if (route.kind === 'post') {
    const { post } = route;
    const image = seoImage(site, post.mainImage);
    const faq = (post.faq ?? []).flatMap(({ q, a }) => q ? [{ question: q, answer: plainText(a) }] : []);
    const pair = translation(site, post);
    return {
      kind: 'post',
      post: {
        headline: post.title,
        blog: { name: blog.name, path: BLOG_PATH },
        ...(image && { image }),
        datePublished: post.publishedAt,
        ...(post.updatedAt && { dateModified: post.updatedAt }),
      },
      language, path,
      name: post.title,
      seo: seoOf(site, post),
      breadcrumbs: crumbs(language, { name: blog.crumb, path: BLOG_PATH }, { name: post.title, path }),
      ...(image && { primaryImage: image }),
      dateModified: post.updatedAt ?? post.publishedAt,
      ...(faq.length && { faq }),
      ...(pair && { translation: pair }),
    };
  }
  const base = route.page ? seoOf(site, route.page) : { title: blog.title, description: blog.description };
  const first = route.pageNumber === 1;
  const seo: Seo = first ? base : {
    title: `${blog.crumb}, ${blog.pageLabel} ${route.pageNumber} | Grzegorz Zawłodzki`,
    description: base.description,
    ...(base.ogImage && { ogImage: base.ogImage }),
    noindex: true,
  };
  const pair = first && route.page ? translation(site, route.page) : undefined;
  return {
    kind: 'blogIndex',
    blog: { name: blog.name, description: base.description },
    language, path: path as SitePath,
    name: blog.crumb,
    seo,
    breadcrumbs: crumbs(language, { name: blog.crumb, path: BLOG_PATH }),
    ...(pair && { translation: pair }),
  };
}
