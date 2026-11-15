export type PreviewSelection = {
  title?: string;
  path?: string;
  language?: string;
};

export type PresentationEditIntent = {
  intent: "edit";
  params: {
    id: string;
    type: string;
    mode: "presentation";
    preview: string;
  };
};

const DRAFTS_PREFIX = "drafts.";
const VERSIONS_PREFIX = "versions.";

export function publishedDocumentId(id: string): string {
  if (id.startsWith(DRAFTS_PREFIX)) return id.slice(DRAFTS_PREFIX.length);
  if (!id.startsWith(VERSIONS_PREFIX)) return id;
  const rest = id.slice(VERSIONS_PREFIX.length);
  const separator = rest.indexOf(".");
  if (separator === -1) return "";
  return rest.slice(separator + 1);
}

function readOwn(record: object, key: string): unknown {
  if (!Object.hasOwn(record, key)) return undefined;
  return Reflect.get(record, key);
}

function primaryHref(
  locations: object,
  documentType: string,
  selected: PreviewSelection | null,
): string | null {
  const entry = readOwn(locations, documentType);
  if (!entry || typeof entry !== "object" || !("resolve" in entry)) return null;
  const resolve = entry.resolve;
  if (typeof resolve !== "function") return null;

  const state: unknown = resolve(selected);
  if (!state || typeof state !== "object" || !("locations" in state))
    return null;
  const listed = state.locations;
  if (!Array.isArray(listed)) return null;
  const first: unknown = listed[0];
  if (!first || typeof first !== "object" || !("href" in first)) return null;
  return typeof first.href === "string" && first.href.length > 0
    ? first.href
    : null;
}

export function hasPresentationLocations(
  documentType: string,
  locations: object,
): boolean {
  const entry = readOwn(locations, documentType);
  return Boolean(
    entry &&
    typeof entry === "object" &&
    "resolve" in entry &&
    typeof entry.resolve === "function",
  );
}

export function presentationEditIntent(input: {
  documentId: string;
  documentType: string;
  selected: PreviewSelection | null;
  locations: object;
}): PresentationEditIntent | null {
  const id = publishedDocumentId(input.documentId);
  const preview = primaryHref(
    input.locations,
    input.documentType,
    input.selected,
  );
  if (!id || !preview) return null;

  return {
    intent: "edit",
    params: {
      id,
      type: input.documentType,
      mode: "presentation",
      preview,
    },
  };
}
