import type { Path } from "sanity";

export type EditorialMarker = {
  kind: "canonical" | "legacy";
  label: string;
  text: string;
  path: Path;
};

const WORD = String.raw`[A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻ0-9]*`;
const EXAMPLE_LIMIT = 80;

function markerPattern(): RegExp {
  return new RegExp(
    String.raw`\[\[TODO:[ \t]*([\s\S]*?)\]\]|\[(?!\[)(${WORD}(?:[ \t]+${WORD})+)(?:[ \t]*:[ \t]*([^\]]*)|[ \t]+([^\]]+))?\]|\[(?!\[)(${WORD})[ \t]*:[ \t]*([^\]]*)\]`,
    "g",
  );
}

function markersInText(
  text: string,
): Array<Pick<EditorialMarker, "kind" | "label" | "text">> {
  const hits: Array<Pick<EditorialMarker, "kind" | "label" | "text">> = [];
  for (const match of text.matchAll(markerPattern())) {
    if (match[1] !== undefined) {
      hits.push({ kind: "canonical", label: "TODO", text: match[1].trim() });
      continue;
    }
    const label = match[2] ?? match[5];
    if (!label) continue;
    const raw = match[3] ?? match[4] ?? match[6] ?? "";
    hits.push({ kind: "legacy", label, text: raw.trim() });
  }
  return hits;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      key.startsWith("_") ? [] : collectStrings(child),
    );
  }
  return [];
}

function blockKey(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("_key" in value))
    return undefined;
  const key = value._key;
  return typeof key === "string" && key.length > 0 ? key : undefined;
}

export function scanEditorialMarkers(
  value: unknown,
  fieldPath: Path = [],
): EditorialMarker[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((block, index) => {
    const key = blockKey(block);
    const path: Path = key ? [...fieldPath, { _key: key }] : [...fieldPath, index];
    return collectStrings(block).flatMap((text) =>
      markersInText(text).map((hit) => ({ ...hit, path })),
    );
  });
}

function exampleOf(marker: EditorialMarker): string {
  const full = marker.text ? `${marker.label}: ${marker.text}` : marker.label;
  const single = full.replace(/\s+/g, " ").trim();
  return single.length > EXAMPLE_LIMIT
    ? `${single.slice(0, EXAMPLE_LIMIT - 1)}…`
    : single;
}

export function editorialMarkerMessage(value: unknown): true | string {
  const markers = scanEditorialMarkers(value);
  const first = markers[0];
  if (!first) return true;
  return `Treść zawiera znaczniki do uzupełnienia (${markers.length}), np. „${exampleOf(first)}”.`;
}

// Limit document scanning to the editable content fields.
export function scanDocumentEditorialMarkers(value: unknown): EditorialMarker[] {
  if (!value || typeof value !== 'object') return [];
  const doc = value as Record<string, unknown>;
  if (doc._type === 'page') return scanEditorialMarkers(doc.sections, ['sections']);
  if (doc._type !== 'post') return [];
  const markers = scanEditorialMarkers(doc.body, ['body']);
  if (Array.isArray(doc.faq)) doc.faq.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const segment = typeof item._key === 'string' && item._key ? {_key: item._key} : index;
    markers.push(...scanEditorialMarkers(item.a, ['faq', segment, 'a']));
  });
  return markers;
}
