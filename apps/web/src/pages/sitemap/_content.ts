// Build-time read of everything the discovery files list. T18 absorbs this into its Sanity layer.
import type { Language, SitePath } from '../../seo/types.ts';

interface DiscoveryDocBase {
  language: Language;
  path: SitePath;
  title: string;
  description: string;
  /** ISO 8601, normalized with `toISOString()` so strings compare in time order. */
  lastmod: string;
}

export type DiscoveryDoc =
  | (DiscoveryDocBase & { kind: 'page' })
  | (DiscoveryDocBase & { kind: 'post'; publishedAt: string; image?: string });

export interface DiscoveryService {
  name: string;
  description: string;
  /** Path of the service's own page; a service without one is not linked. */
  path?: SitePath;
  language: Language;
}

export interface Discovery {
  person: { name: string; description: string } | null;
  docs: DiscoveryDoc[];
  services: DiscoveryService[];
}

const QUERY_URL = 'https://8u2zjhvn.apicdn.sanity.io/v2025-02-19/data/query/production';

const QUERY = `{
  "person": *[_type == "person"][0]{name, description},
  "docs": *[_type in ["page", "post"] && seo.noindex != true]{
    "kind": _type,
    language,
    "path": slug.current,
    title,
    "description": coalesce(excerpt, seo.description),
    "lastmod": select(_type == "post" => coalesce(updatedAt, publishedAt, _updatedAt), _updatedAt),
    publishedAt,
    "image": mainImage.asset->url
  },
  "services": *[_type == "service"]{name, description, "path": page->slug.current, "language": coalesce(page->language, "pl")}
}`;

class ShapeError extends Error {
  constructor(where: string, value: unknown) {
    super(`Sanity discovery query: unexpected ${where}: ${JSON.stringify(value)}`);
  }
}

type Fields = Record<string, unknown>;

function record(value: unknown, where: string): Fields {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ShapeError(where, value);
  return value as Fields;
}

function text(fields: Fields, key: string, where: string): string {
  const value = fields[key];
  if (typeof value !== 'string' || !value.trim()) throw new ShapeError(`${where}.${key}`, value);
  return value;
}

function optional<T>(fields: Fields, key: string, parse: (fields: Fields, key: string, where: string) => T, where: string): T | undefined {
  return fields[key] == null ? undefined : parse(fields, key, where);
}

function language(fields: Fields, key: string, where: string): Language {
  const value = fields[key];
  if (value !== 'pl' && value !== 'en') throw new ShapeError(`${where}.${key}`, value);
  return value;
}

function sitePath(fields: Fields, key: string, where: string): SitePath {
  const value = text(fields, key, where);
  if (!value.startsWith('/') || value.startsWith('//') || (value !== '/' && value.endsWith('/'))) throw new ShapeError(`${where}.${key}`, value);
  return value as SitePath;
}

function isoDate(fields: Fields, key: string, where: string): string {
  const time = Date.parse(text(fields, key, where));
  if (Number.isNaN(time)) throw new ShapeError(`${where}.${key}`, fields[key]);
  return new Date(time).toISOString();
}

function list(value: unknown, where: string): Fields[] {
  if (!Array.isArray(value)) throw new ShapeError(where, value);
  return value.map((item, i) => record(item, `${where}[${i}]`));
}

function parseDoc(fields: Fields, i: number): DiscoveryDoc {
  const where = `docs[${i}] ${JSON.stringify(fields.path)}`;
  const base: DiscoveryDocBase = {
    language: language(fields, 'language', where),
    path: sitePath(fields, 'path', where),
    title: text(fields, 'title', where),
    description: text(fields, 'description', where),
    lastmod: isoDate(fields, 'lastmod', where),
  };
  if (fields.kind === 'page') return { kind: 'page', ...base };
  if (fields.kind === 'post') {
    const image = optional(fields, 'image', text, where);
    return { kind: 'post', ...base, publishedAt: isoDate(fields, 'publishedAt', where), ...(image && { image }) };
  }
  throw new ShapeError(`${where}.kind`, fields.kind);
}

/** Parses the raw query result. Throws on any unexpected shape so a bad document fails the build. */
export function parseDiscovery(result: unknown): Discovery {
  const root = record(result, 'result');
  const person = root.person == null ? null : record(root.person, 'person');
  return {
    person: person && { name: text(person, 'name', 'person'), description: text(person, 'description', 'person') },
    docs: list(root.docs, 'docs').map(parseDoc),
    services: list(root.services, 'services').map((fields, i) => {
      const where = `services[${i}]`;
      const path = optional(fields, 'path', sitePath, where);
      return {
        name: text(fields, 'name', where),
        description: text(fields, 'description', where),
        language: language(fields, 'language', where),
        ...(path && { path }),
      };
    }),
  };
}

async function fetchDiscovery(): Promise<Discovery> {
  const url = new URL(QUERY_URL);
  url.searchParams.set('query', QUERY);
  url.searchParams.set('perspective', 'published');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity discovery query: HTTP ${response.status} ${await response.text()}`);
  const body = record(await response.json(), 'response');
  return parseDiscovery(body.result);
}

let pending: Promise<Discovery> | undefined;

/** One request per build, shared by every discovery route. */
export function loadDiscovery(): Promise<Discovery> {
  pending ??= fetchDiscovery();
  return pending;
}
