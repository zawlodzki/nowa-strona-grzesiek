/** Matches T39's post outline normalization, including non-Latin letters. */
export function headingSlug(text: string): string {
  return text.toLowerCase().replaceAll('ł', 'l').normalize('NFKD')
    .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'sekcja';
}

export function createHeadingIds(reserved: Iterable<string> = []) {
  const used = new Set(reserved);
  return (text: string) => {
    const slug = headingSlug(text);
    let id = slug;
    for (let suffix = 2; used.has(id); suffix++) id = `${slug}-${suffix}`;
    used.add(id);
    return id;
  };
}

export function createPostHeadingIds() {
  const used = new Set<string>();
  return (text: string, key: string) => {
    let id = `post-${headingSlug(text)}`;
    if (used.has(id)) id += `-${key}`;
    used.add(id);
    return id;
  };
}

const pages = new WeakMap<object, ReturnType<typeof createHeadingIds>>();
const posts = new WeakMap<object, ReturnType<typeof createPostHeadingIds>>();

/** Request-scoped state avoids leaking counters between pages or builds. */
export function pageHeadingId(page: object, text: string): string {
  let ids = pages.get(page);
  if (!ids) {
    ids = createHeadingIds(['kontakt-heading', 'kontakt-details', 'kontakt-channels', 'faq-heading', 'cennik-heading', 'opinie-heading', 'newsletter-heading', 'related-heading']);
    pages.set(page, ids);
  }
  return ids(text);
}

export function postHeadingId(page: object, text: string, key: string): string {
  let ids = posts.get(page);
  if (!ids) { ids = createPostHeadingIds(); posts.set(page, ids); }
  return ids(text, key);
}
