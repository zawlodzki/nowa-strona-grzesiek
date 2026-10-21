import type { Language, SitePath } from './types.ts';

export const ORIGIN = 'https://www.zawlodzki.pl';

/** Absolute URL with no trailing slash. EN gets the `/en` prefix; the PL home is the bare origin. */
export function pageUrl(language: Language, path: SitePath): string {
  const prefixed = language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;
  return prefixed === '/' ? ORIGIN : `${ORIGIN}${prefixed}`;
}

/** Fragment @id for a node on a page. The PL home keeps its slash (`/#webpage`), matching the live ids. */
export function nodeId(language: Language, path: SitePath, fragment: string): string {
  const url = pageUrl(language, path);
  return `${url === ORIGIN ? `${ORIGIN}/` : url}#${fragment}`;
}
