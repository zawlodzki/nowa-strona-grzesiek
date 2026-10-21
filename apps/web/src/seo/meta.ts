import entities from '../../../../migration/contracts/entities.json' with { type: 'json' };
import type { Language, SeoPage } from './types.ts';
import { pageUrl } from './url.ts';

const OG_LOCALE: Record<Language, string> = { pl: 'pl_PL', en: 'en_US' };

export interface Meta {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  /** `<link rel="alternate" hreflang>` pairs. Empty unless the page has a real translation. */
  alternates: { hreflang: string; href: string }[];
  /** `<meta property>` pairs (Open Graph, article). */
  properties: [string, string][];
  /** `<meta name>` pairs (Twitter). */
  names: [string, string][];
}

export function buildMeta(page: SeoPage): Meta {
  const { seo } = page;
  const canonical = seo.canonicalOverride ?? pageUrl(page.language, page.path);
  const image = seo.ogImage ?? page.primaryImage;

  const alternates: Meta['alternates'] = [];
  if (page.translation) {
    const urls = { [page.language]: canonical, [page.translation.language]: pageUrl(page.translation.language, page.translation.path) };
    alternates.push({ hreflang: 'pl', href: urls.pl }, { hreflang: 'en', href: urls.en }, { hreflang: 'x-default', href: urls.pl });
  }

  const properties: [string, string][] = [
    ['og:type', page.kind === 'post' ? 'article' : 'website'],
    ['og:title', seo.title],
    ['og:description', seo.description],
    ['og:url', canonical],
    ['og:site_name', entities.website.alternateName],
    ['og:locale', OG_LOCALE[page.language]],
  ];
  if (page.translation) properties.push(['og:locale:alternate', OG_LOCALE[page.translation.language]]);
  if (image) {
    properties.push(['og:image', image.url]);
    if (image.width && image.height) properties.push(['og:image:width', String(image.width)], ['og:image:height', String(image.height)]);
    if (image.alt) properties.push(['og:image:alt', image.alt]);
  }
  if (page.kind === 'post') {
    properties.push(['article:published_time', page.post.datePublished]);
    if (page.post.dateModified) properties.push(['article:modified_time', page.post.dateModified]);
  }

  const names: [string, string][] = [
    ['twitter:card', image ? 'summary_large_image' : 'summary'],
    ['twitter:title', seo.title],
    ['twitter:description', seo.description],
  ];
  if (image) names.push(['twitter:image', image.url]);

  return {
    title: seo.title,
    description: seo.description,
    canonical,
    robots: seo.noindex ? 'noindex' : undefined,
    alternates,
    properties,
    names,
  };
}
