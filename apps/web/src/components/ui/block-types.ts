import type { Link, Logo, Page } from '../../../../studio/sanity.types';

import type { ResolvedImage } from '../portable-text/types';
export type { ResolvedImage } from '../portable-text/types';
export { safeHref } from '../portable-text/types';

export type ResolvedLogo = Pick<Logo, '_id' | 'name' | 'url'> & {
  image: ResolvedImage;
};

export type ResolvedPage = Pick<Page, '_id' | 'language' | 'slug' | 'title'>;
export const consultation = {
  _type: 'link',
  href: '/kontakt',
  label: 'Umów bezpłatną konsultację',
} satisfies Link;

export function pageHref(page: ResolvedPage): string | undefined {
  const path = page.slug?.current;
  if (!path || !/^\/(?!\/)[^\s\\]*$/.test(path)) return undefined;
  return page.language === 'en' ? `/en${path === '/' ? '' : path}` : path;
}
