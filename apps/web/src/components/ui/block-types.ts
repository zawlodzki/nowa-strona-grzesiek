import type { ContentImage, Link, Logo, Page, PortableText } from '../../../../studio/sanity.types';

export type ResolvedImage = Pick<ContentImage, 'alt' | 'caption'> & {
  src: string;
  width: number;
  height: number;
};

export type ResolvedLogo = Pick<Logo, '_id' | 'name' | 'url'> & {
  image: ResolvedImage;
};

export type ResolvedPage = Pick<Page, '_id' | 'language' | 'slug' | 'title'>;
export type TextBlock = Extract<PortableText[number], { _type: 'block' }>;
export type TextSpan = NonNullable<TextBlock['children']>[number];

export const consultation = {
  _type: 'link',
  href: '/kontakt',
  label: 'Umów bezpłatną konsultację',
} satisfies Link;

export function safeHref(href: string | undefined): string | undefined {
  return href && /^(\/(?!\/)[^\s\\]*|#[^\s]+|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9 -]+)$/.test(href)
    ? href
    : undefined;
}

export function pageHref(page: ResolvedPage): string | undefined {
  const path = page.slug?.current;
  if (!path || !/^\/(?!\/)[^\s\\]*$/.test(path)) return undefined;
  return page.language === 'en' ? `/en${path === '/' ? '' : path}` : path;
}
