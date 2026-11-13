import type { FooterLink } from './settings';

// Layout metadata for the existing siteSettings links; content stays in Sanity.
const GROUPS = [
  { title: 'CRM', paths: ['/audyt-crm-pipedrive', '/audyt-sprzedazy', '/szkolenie-i-wdrozenie-pipedrive', '/automatyzacje-dla-pipedrive', '/szkolenie-i-wdrozenie-salesforce'] },
  { title: 'AI', paths: ['/kurs-ai-w-sprzedazy', '/audyt-ai-sprzedaz', '/program-ai-dla-zespolu-sprzedazy', '/wdrozenie-ai-w-sprzedazy-b2b'] },
  { title: 'Asana', paths: ['/audyt-procesow-asana', '/szkolenie-i-wdrozenie-asana'] },
] as const;
const LEGAL = new Set(['/regulamin', '/polityka-prywatnosci']);

export function footerGroups(links: readonly FooterLink[]) {
  const corrected = links.map((link) => link.label === 'Wdrożenie Asana'
    ? { ...link, href: '/szkolenie-i-wdrozenie-asana' } : link);
  const used = new Set<string>([...LEGAL, ...GROUPS.flatMap((group) => [...group.paths])]);
  return {
    columns: [
      ...GROUPS.map((group) => ({ title: group.title, links: group.paths.flatMap((path) => corrected.filter((link) => link.href === path)) })),
      { title: 'Informacje i blog', links: corrected.filter((link) => !used.has(link.href)) },
    ],
    legal: corrected.filter((link) => LEGAL.has(link.href)),
  };
}

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/zawlodzki', asset: 'github.svg' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/zawlodzki/', asset: 'linkedin.svg' },
  { label: 'X', href: 'https://x.com/zawlodzki', asset: 'x.svg' },
] as const;
