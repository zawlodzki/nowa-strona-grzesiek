interface Candidate {
  _id: string;
  language: 'pl' | 'en';
  slug: { current: string };
  title: string;
  seo: { title: string; description: string };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function routeHref(value: unknown): string | undefined {
  if (!object(value) || !object(value.slug) || typeof value.slug.current !== 'string') return;
  if (value.language !== 'pl' && value.language !== 'en') return;
  return value.language === 'en' ? (value.slug.current === '/' ? '/en' : `/en${value.slug.current}`) : value.slug.current;
}

function complete(value: unknown): value is Candidate {
  if (!object(value) || !text(value._id) || !text(value.title) || !object(value.seo) || !text(value.seo.title) || !text(value.seo.description)) return false;
  if (value.language !== 'pl' && value.language !== 'en') return false;
  if (!object(value.slug) || typeof value.slug.current !== 'string') return false;
  const path = value.slug.current;
  if (!/^(\/|\/[a-z0-9]+(?:[a-z0-9/-]*[a-z0-9])?)$/.test(path) || path.includes('//')) return false;
  if (value._type === 'post') return /^\/blog\/[a-z0-9-]+$/.test(path) && text(value.publishedAt) && !Number.isNaN(Date.parse(value.publishedAt)) && Array.isArray(value.body) && value.body.length > 0;
  return true;
}

/** Incomplete unrelated drafts do not prevent a valid document from opening. */
export function selectPreviewDocuments(raw: unknown, href: string): unknown {
  if (!object(raw) || !Array.isArray(raw.pages) || !Array.isArray(raw.posts)) throw new Error('Invalid preview query result.');
  const select = (documents: unknown[]) => documents.filter((doc) => {
    const valid = complete(doc);
    if (!valid && routeHref(doc) === href) throw new Error('The selected document has incomplete required fields.');
    return valid;
  });
  return { ...raw, pages: select(raw.pages), posts: select(raw.posts) };
}
