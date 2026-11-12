import type { ContentImage, Link, PortableText } from '../../../studio/sanity.types.ts';
import type { Route } from './sanity/routes.ts';
import type { PageDoc, Site } from './sanity/site.ts';

const ORIGIN = 'https://www.zawlodzki.pl';
export const markdownPath = (path: string) => path === '/' ? '/index.md' : `${path}.md`;
const text = (value = '') => value.replace(/([\\`*_[\]<>])/g, '\\$1');
const url = (value: string) => new URL(value, ORIGIN).href.replace(/[()\s]/g, (c) => encodeURIComponent(c));
const link = (value?: Link) => value?.href ? `[${text(value.label ?? value.href)}](${url(value.href)})` : '';
const join = (parts: (string | undefined)[]) => parts.filter(Boolean).join('\n\n');
const bullets = (items: string[] = []) => items.map((item) => `- ${text(item)}`).join('\n');

function image(value: Pick<ContentImage, 'asset' | 'alt' | 'caption'> | undefined, site: Site): string {
  const asset = value?.asset?._ref && site.images[value.asset._ref];
  return asset ? join([`![${text(value?.alt)}](${url(asset.src)})`, text(value?.caption)]) : '';
}

export function portableText(body: PortableText = [], site: Site): string {
  return join(body.map((node) => {
    switch (node._type) {
      case 'block': {
        const content = (node.children ?? []).map((span) => {
          let value = text(span.text);
          for (const mark of span.marks ?? []) {
            if (mark === 'strong') value = `**${value}**`;
            else if (mark === 'em') value = `*${value}*`;
            else if (mark === 'code') {
              const raw = span.text ?? '';
              const fence = '`'.repeat(Math.max(1, ...(raw.match(/`+/g) ?? []).map((run) => run.length + 1)));
              value = `${fence} ${raw} ${fence}`;
            }
            else if (mark === 'strike-through') value = `~~${value}~~`;
            else {
              const def = node.markDefs?.find((item) => item._key === mark);
              const href = def?._type === 'link' ? def.href : def?._type === 'internalLink' ? site.links[def.reference?._ref ?? ''] : undefined;
              if (href) value = `[${value}](${url(href)})`;
            }
          }
          return value;
        }).join('');
        if (node.listItem) return `${'  '.repeat(Math.max(0, (node.level ?? 1) - 1))}${node.listItem === 'number' ? '1.' : '-'} ${content}`;
        if (node.style === 'blockquote') return content.split('\n').map((line) => `> ${line}`).join('\n');
        return `${node.style?.startsWith('h') ? '#'.repeat(Number(node.style.slice(1))) + ' ' : ''}${content}`;
      }
      case 'image': return image(node, site);
      case 'callout': return (node.body ?? '').split('\n').map((line) => `> ${text(line)}`).join('\n');
      case 'codeBlock': {
        const fence = '`'.repeat(Math.max(3, ...((node.code ?? '').match(/`+/g) ?? []).map((s) => s.length + 1)));
        return `${fence}${node.language ?? ''}\n${node.code ?? ''}\n${fence}`;
      }
      case 'table': {
        const rows = (node.rows ?? []).map((row) => row.cells ?? []);
        if (!rows.length) return '';
        const width = Math.max(...rows.map((row) => row.length));
        const row = (cells: string[]) => `| ${Array.from({ length: width }, (_, i) => text(cells[i]).replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`;
        const header = node.hasHeader ? rows.shift()! : Array(width).fill('');
        return [row(header), row(Array(width).fill('---')), ...rows.map(row)].join('\n');
      }
      case 'download': return node.url ? `[${text(node.label ?? node.url)}](${url(node.url)})` : '';
      case 'embed': return node.url ? `[${text(node.title ?? node.kind ?? 'Media')}](${url(node.url)})` : '';
    }
  }));
}

export function sectionsMarkdown(sections: NonNullable<PageDoc['sections']>, site: Site, language: string): string {
  return join(sections.map((s) => {
    const heading = 'heading' in s && s.heading ? `## ${text(s.heading)}` : '';
    const pt = (body?: PortableText) => portableText(body, site);
    switch (s._type) {
      case 'hero': return join([heading, text(s.tagline), text(s.body), image(s.image, site), image(s.badgeImage, site), bullets(s.badges), link(s.cta)]);
      case 'feature': return join([heading, text(s.tagline), pt(s.body), bullets(s.bullets), s.media?.kind === 'image' ? image(s.media.image, site) : '', text(s.mediaCaption), link(s.cta)]);
      case 'contentSection': return join([heading, text(s.tagline), pt(s.intro), ...(s.items ?? []).map((item) => join([item.title && `### ${text(item.title)}`, text(item.text), link(item.link)])), s.media?.kind === 'image' ? image(s.media.image, site) : '']);
      case 'tabs': return join([heading, text(s.tagline), pt(s.intro), ...(s.items ?? []).map((item) => join([item.title && `### ${text(item.title)}`, text(item.summary), text(item.tagline), pt(item.positive), pt(item.negative), pt(item.body)]))]);
      case 'pricing': return join([heading, text(s.tagline), ...(s.plans ?? []).map((plan) => join([plan.name && `### ${text(plan.name)}`, plan.price !== undefined ? `${plan.price} ${plan.currency ?? ''} ${text(plan.unit)}` : '', text(plan.priceNote), bullets(plan.features), link(plan.cta)]))]);
      case 'ctaBand': return join([heading, text(s.body), link(s.cta)]);
      case 'richText': return pt(s.body);
      case 'faq': return join([heading, ...(s.items ?? []).map((item) => join([item.question && `### ${text(item.question)}`, pt(item.answer)]))]);
      case 'contactForm': return join([heading || '## Kontakt', text(s.tagline), text(s.intro)]);
      case 'newsletterSignup': return join(['## Newsletter', text(s.body)]);
      case 'logoStrip': return join([s.title && `## ${text(s.title)}`, text(s.intro), ...(s.logos ?? []).map((ref) => { const logo = site.logos.get(ref._ref); return logo ? join([logo.url ? `[${text(logo.name)}](${url(logo.url)})` : text(logo.name), image(logo.image, site)]) : ''; })]);
      case 'testimonials': return join([heading, ...(s.items ?? []).map((ref) => { const item = site.testimonials.get(ref._ref); return item ? join([`> ${text(item.quote)}`, [item.name, item.role, item.company].filter(Boolean).map((v) => text(v)).join(', '), image(item.image, site)]) : ''; })]);
      case 'promoCard': { const target = s.target?._ref && site.links[s.target._ref]; return join([s.title && `## ${text(s.title)}`, bullets(s.points), target ? `[${text(s.title ?? target)}](${url(target)})` : '']); }
      case 'postList': return join([heading, ...site.posts.filter((post) => post.language === language && post.kind === (s.kind ?? 'blog')).slice(0, Math.min(Math.max(Math.trunc(s.limit ?? 3), 1), 12)).map((post) => `[${text(post.title)}](${url(site.links[post._id])})`)]);
    }
  }));
}

export function renderMarkdown(route: Route, site: Site): string {
  const doc = route.kind === 'post' ? route.post : route.page;
  const title = doc?.title ?? 'Blog';
  const body = route.kind === 'post'
    ? join([image(route.post.mainImage, site), portableText(route.post.body, site), ...(route.post.faq ?? []).map((item) => join([item.q && `## ${text(item.q)}`, portableText(item.a, site)]))])
    : route.kind === 'page' ? sectionsMarkdown(route.page.sections ?? [], site, route.language)
    : join(route.posts.map((post) => join([`## [${text(post.title)}](${url(site.links[post._id])})`, text(post.seo.description)])));
  return join([`# ${text(title)}`, text(doc?.seo.description ?? (route.language === 'pl' ? 'Artykuły o CRM, automatyzacji i AI w sprzedaży B2B: procesy, wdrożenia, narzędzia i praca zespołów handlowych.' : 'Articles on CRM, automation and AI in B2B sales.')), `Canonical: ${url(doc?.seo.canonicalOverride ?? route.href)}`, body]) + '\n';
}
