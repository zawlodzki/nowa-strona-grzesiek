// One query per build loads every routed document plus what their blocks reference, parsed once at this boundary.
import type { ContentImage, Logo, Page, Person, PortableText, Post, Seo, Service, Testimonial } from '../../../../studio/sanity.types';
import type { ResolvedImage } from '../../components/portable-text/types';
import type { Language, SitePath } from '../../seo/types.ts';
import { sanityQuery } from './client.ts';

type Routed<T extends { seo?: Seo }> = Omit<T, 'language' | 'title' | 'seo'> & {
  language: Language;
  path: SitePath;
  title: string;
  seo: Seo & { title: string; description: string };
};
export type PageDoc = Routed<Page>;
export type PostDoc = Routed<Post> & { publishedAt: string; body: PortableText };

export interface Site {
  pages: PageDoc[];
  posts: PostDoc[];
  byId: Map<string, PageDoc | PostDoc>;
  /** Document `_id` to its site-relative URL, for Portable Text internal links. */
  links: Record<string, string>;
  /** Image asset `_id` to a sized CDN image. Alt and caption come from where the image is used. */
  images: Record<string, ResolvedImage>;
  logos: Map<string, Logo>;
  testimonials: Map<string, Testimonial>;
  services: Service[];
  person?: Person;
  /** Document `_id` to the `_id`s of its translations, itself excluded. */
  translations: Map<string, string[]>;
}

const QUERY = `{
  "pages": *[_type == "page"],
  "posts": *[_type == "post"],
  "assets": *[_type == "sanity.imageAsset"]{_id, url, "width": metadata.dimensions.width, "height": metadata.dimensions.height},
  "logos": *[_type == "logo"],
  "testimonials": *[_type == "testimonial"],
  "services": *[_type == "service"],
  "person": *[_id == "person"][0],
  "translations": *[_type == "translation.metadata"]{"ids": translations[].value._ref}
}`;

const MAX_IMAGE_WIDTH = 1600;

interface Raw {
  pages: Page[];
  posts: Post[];
  assets: { _id: string; url: string; width: number; height: number }[];
  logos: Logo[];
  testimonials: Testimonial[];
  services: Service[];
  person: Person | null;
  translations: { ids: string[] | null }[];
}

class ShapeError extends Error {
  constructor(where: string, value: unknown) {
    super(`Sanity site query: unexpected ${where}: ${JSON.stringify(value)}`);
  }
}

/** Site-relative URL. EN gets the `/en` prefix, the PL home is `/`. */
export function localHref(language: Language, path: SitePath): string {
  return language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;
}

function nonEmpty(value: unknown, where: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new ShapeError(where, value);
  return value;
}

function routed<T extends { _id: string; language?: string; slug?: { current?: string }; title?: string; seo?: Seo }>(doc: T): Routed<T> {
  const where = `${doc._id}`;
  if (doc.language !== 'pl' && doc.language !== 'en') throw new ShapeError(`${where}.language`, doc.language);
  const path = doc.slug?.current;
  if (!path || !/^(\/|\/[a-z0-9]+(?:[a-z0-9/-]*[a-z0-9])?)$/.test(path) || path.includes('//')) throw new ShapeError(`${where}.slug`, path);
  const seo = doc.seo;
  return {
    ...doc,
    language: doc.language,
    path: path as SitePath,
    title: nonEmpty(doc.title, `${where}.title`),
    seo: { ...seo, title: nonEmpty(seo?.title, `${where}.seo.title`), description: nonEmpty(seo?.description, `${where}.seo.description`) },
  };
}

function parsePost(doc: Post): PostDoc {
  const post = routed(doc);
  if (!/^\/blog\/[a-z0-9-]+$/.test(post.path)) throw new ShapeError(`${doc._id}.slug (posts live at /blog/<slug>)`, post.path);
  if (!post.body?.length) throw new ShapeError(`${doc._id}.body`, post.body);
  const publishedAt = nonEmpty(post.publishedAt, `${doc._id}.publishedAt`);
  if (Number.isNaN(Date.parse(publishedAt))) throw new ShapeError(`${doc._id}.publishedAt`, publishedAt);
  return { ...post, publishedAt, body: post.body };
}

// A weak reference may point at a document that is not published (T15 links posts to pages T16 imports later).
// Such a link renders as plain text; the Portable Text renderer throws on any internal link left unresolved.
function unlinkDangling(value: unknown, links: Record<string, string>, dropped: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) unlinkDangling(item, links, dropped);
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  const node = value as { markDefs?: { _key: string; _type: string; reference?: { _ref?: string } }[]; children?: { marks?: string[] }[] };
  if (Array.isArray(node.markDefs)) {
    const dangling = new Set(node.markDefs.filter((mark) => mark._type === 'internalLink' && !links[mark.reference?._ref ?? '']).map((mark) => {
      dropped.add(mark.reference?._ref ?? '(empty)');
      return mark._key;
    }));
    if (dangling.size) {
      node.markDefs = node.markDefs.filter((mark) => !dangling.has(mark._key));
      for (const child of node.children ?? []) child.marks = child.marks?.filter((mark) => !dangling.has(mark));
    }
  }
  for (const child of Object.values(node)) unlinkDangling(child, links, dropped);
}

function parseSite(raw: Raw): Site {
  const pages = raw.pages.map(routed);
  const posts = raw.posts.map(parsePost).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const byId = new Map<string, PageDoc | PostDoc>();
  const hrefs = new Map<string, string>();
  for (const doc of [...pages, ...posts]) {
    const href = localHref(doc.language, doc.path);
    const taken = hrefs.get(href);
    if (taken) throw new Error(`Sanity site query: ${doc._id} and ${taken} both claim ${href}`);
    hrefs.set(href, doc._id);
    byId.set(doc._id, doc);
  }
  const links = Object.fromEntries([...hrefs].map(([href, id]) => [id, href]));

  const dropped = new Set<string>();
  unlinkDangling([pages, posts], links, dropped);
  if (dropped.size) console.warn(`[sanity] ${dropped.size} internal link targets are not published; those links render as text: ${[...dropped].slice(0, 5).join(', ')}${dropped.size > 5 ? ', …' : ''}`);

  const images = Object.fromEntries(raw.assets.map(({ _id, url, width, height }) => {
    const scaled = Math.min(width, MAX_IMAGE_WIDTH);
    return [_id, { src: `${url}?w=${scaled}&fit=max&auto=format`, width: scaled, height: Math.round((height * scaled) / width) }];
  }));

  const translations = new Map<string, string[]>();
  for (const { ids } of raw.translations) {
    const group = (ids ?? []).filter((id) => byId.has(id));
    for (const id of group) translations.set(id, group.filter((other) => other !== id));
  }

  return {
    pages,
    posts,
    byId,
    links,
    images,
    logos: new Map(raw.logos.map((logo) => [logo._id, logo])),
    testimonials: new Map(raw.testimonials.map((item) => [item._id, item])),
    services: raw.services,
    ...(raw.person && { person: raw.person }),
    translations,
  };
}

/** Sized image with the alt and caption of this use, or undefined when the asset is not in the dataset. */
export function resolveImage(site: Site, value: ContentImage | undefined): ResolvedImage | undefined {
  const asset = value?.asset?._ref ? site.images[value.asset._ref] : undefined;
  return asset && { ...asset, alt: value?.alt, caption: value?.caption };
}

let pending: Promise<Site> | undefined;

/** One request per build, shared by every route. */
export function loadSite(): Promise<Site> {
  pending ??= sanityQuery(QUERY).then((result) => parseSite(result as Raw));
  return pending;
}
