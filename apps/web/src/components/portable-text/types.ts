import type { ContentImage, PortableText as PortableTextValue } from '../../../../studio/sanity.types';

export type { PortableTextValue };

// Same shape as T09's ResolvedImage in components/ui/block-types.ts. Switch to that import once T09 is on main.
export type ResolvedImage = Pick<ContentImage, 'alt' | 'caption'> & {
  src: string;
  width: number;
  height: number;
};

export type PortableTextItem = PortableTextValue[number];
export type TextBlock = Extract<PortableTextItem, { _type: 'block' }>;
export type TextSpan = NonNullable<TextBlock['children']>[number];
export type MarkDefinition = NonNullable<TextBlock['markDefs']>[number];

// The page query resolves references: `links` maps a document `_ref` to its URL, `images` maps an image asset `_ref` to the final image.
export interface Resolved {
  links?: Record<string, string>;
  images?: Record<string, ResolvedImage>;
}

export function safeHref(href: string | undefined): string | undefined {
  return href && /^(\/(?!\/)[^\s\\]*|#[^\s]+|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9 -]+)$/.test(href) ? href : undefined;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href) && !/^https:\/\/www\.zawlodzki\.pl(\/|$)/.test(href);
}

// Only https sources the editor can pick are framed: YouTube through its no-cookie host, Loom, and any other https page for `iframe`.
export function embedSrc(kind: string | undefined, url: string | undefined): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== 'https:') return undefined;
  if (kind === 'youtube') {
    const id = parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') ?? parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : undefined;
  }
  if (kind === 'loom') {
    const id = parsed.pathname.match(/^\/(?:share|embed)\/([0-9a-f]+)/)?.[1];
    return parsed.hostname.endsWith('loom.com') && id ? `https://www.loom.com/embed/${id}` : undefined;
  }
  return parsed.href;
}
