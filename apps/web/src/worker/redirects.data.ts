// Generated from migration/contracts/url-map.csv. Do not edit.
// Regenerate: node apps/web/src/worker/redirects.gen.mjs

export interface RedirectRule {
  readonly path: string;
  /** Query parameter that must be present; the redirect drops it. */
  readonly query?: string;
  readonly to: string;
}

export const REDIRECTS: readonly RedirectRule[] = [
  {"path":"/aplikacje-ktore-sprawdzilem-w-4-biznesach","to":"/blog/aplikacje-ktore-sprawdzilem-w-4-biznesach"},
  {"path":"/blog/jak-ustawic-podstawowe-wskazniki-sprzedazowe-w-pipedrive","to":"/blog/raporty-sprzedazowe"},
  {"path":"/blog","query":"f95bbc04_page","to":"/blog"},
  {"path":"/index.html","to":"/"},
  {"path":"/konsultacja","to":"/wspolpraca"},
  {"path":"/lista-wskazowek-podstawowego-wdrozenia-crm-pipedrive-com","to":"/blog/lista-wskazowek-podstawowego-wdrozenia-crm-pipedrive-com"},
  {"path":"/podstawowe-zasady-jak-korzystac-z-asana-com","to":"/blog/podstawowe-zasady-jak-korzystac-z-asana-com"},
  {"path":"/search","to":"/blog"},
  {"path":"/wdrozenie-ai-dla-sprzedazy-b2b","to":"/wdrozenie-ai-w-sprzedazy-b2b"},
];
