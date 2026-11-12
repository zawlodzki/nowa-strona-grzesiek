const MARKDOWN_TYPE = 'text/markdown';
const HTML_TYPE = 'text/html';
const TYPE_WILDCARD = 'text/*';
const ANY_TYPE = '*/*';

type MediaRange = typeof MARKDOWN_TYPE | typeof HTML_TYPE | typeof TYPE_WILDCARD | typeof ANY_TYPE;
type Preference = { range: MediaRange; quality: number; specificity: number };

function readPreference(value: string): Preference | undefined {
  const [mediaType, ...parameters] = value.match(/(?:[^;"]|"(?:[^"\\]|\\.)*")+/g) ?? [];
  const range = mediaType?.trim().toLowerCase();
  if (range !== MARKDOWN_TYPE && range !== HTML_TYPE && range !== TYPE_WILDCARD && range !== ANY_TYPE) return;

  let specificity = range === ANY_TYPE ? 0 : range === TYPE_WILDCARD ? 2 : 4;
  let quality = 1;
  for (const parameter of parameters) {
    const [name, ...parts] = parameter.trim().toLowerCase().split('=');
    const parameterValue = parts.join('=').trim();
    if (name.trim() === 'q') {
      quality = /^(?:0(?:\.\d{0,3})?|\.\d{1,3}|1(?:\.0{0,3})?)$/.test(parameterValue) ? Number(parameterValue) : 0;
      break;
    }
    if (name.trim() !== 'charset' || (parameterValue !== 'utf-8' && parameterValue !== '"utf-8"')) return;
    specificity += 1;
  }
  return { range, quality, specificity };
}

function bestMatch(preferences: Preference[], type: typeof MARKDOWN_TYPE | typeof HTML_TYPE): Preference | undefined {
  let best: Preference | undefined;
  for (const preference of preferences) {
    if (preference.range !== type && preference.range !== TYPE_WILDCARD && preference.range !== ANY_TYPE) continue;
    if (!best || preference.specificity > best.specificity ||
      (preference.specificity === best.specificity && preference.quality < best.quality)) best = preference;
  }
  return best;
}

export function prefersMarkdown(accept: string | null): boolean {
  const preferences: Preference[] = [];
  for (const value of accept?.match(/(?:[^,"]|"(?:[^"\\]|\\.)*")+/g) ?? []) {
    const preference = readPreference(value);
    if (preference) preferences.push(preference);
  }
  const markdown = bestMatch(preferences, MARKDOWN_TYPE);
  if (markdown?.range !== MARKDOWN_TYPE || markdown.quality === 0) return false;

  const html = bestMatch(preferences, HTML_TYPE);
  return !html || markdown.quality > html.quality ||
    (markdown.quality === html.quality && html.range !== HTML_TYPE);
}
