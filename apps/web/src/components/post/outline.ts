import type { PortableText } from '../../../../studio/sanity.types';

type Block = Extract<PortableText[number], { _type: 'block' }>;
export type Heading = { id: string; text: string; level: 'h2' | 'h3'; block: Block };
export type TocEntry = Heading & { children: Heading[] };
export type PostSection = { heading?: Heading; blocks: PortableText };

export function postOutline(body: PortableText): { sections: PostSection[]; entries: TocEntry[] } {
  const sections: PostSection[] = [];
  const entries: TocEntry[] = [];
  const used = new Set<string>();
  for (const block of body) {
    if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
      const text = block.children?.map((span) => span.text).join('') ?? '';
      const slug = text.toLowerCase().replaceAll('ł', 'l').normalize('NFKD')
        .replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'sekcja';
      let id = `post-${slug}`;
      if (used.has(id)) id += `-${block._key}`;
      used.add(id);
      const heading: Heading = { id, text, level: block.style, block };
      sections.push({ heading, blocks: [] });
      const parent = entries.at(-1);
      if (heading.level === 'h3' && parent?.level === 'h2') parent.children.push(heading);
      else entries.push({ ...heading, children: [] });
    } else {
      if (!sections.length) sections.push({ blocks: [] });
      sections.at(-1)!.blocks.push(block);
    }
  }
  return { sections, entries };
}
