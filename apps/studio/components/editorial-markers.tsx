import { useMemo } from "react";
import {
  defineDocumentInspector,
  definePlugin,
  type DocumentInspectorMenuItem,
  type DocumentInspectorProps,
  type Path,
} from "sanity";
import { useDocumentPane } from "sanity/structure";

import {
  scanDocumentEditorialMarkers,
  type EditorialMarker,
} from "../lib/editorial-markers";

const DOCUMENT_TYPES = new Set(["post", "page"]);
const SNIPPET_LIMIT = 140;

function snippet(text: string): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > SNIPPET_LIMIT
    ? `${single.slice(0, SNIPPET_LIMIT - 1)}…`
    : single;
}

function markerKey(marker: EditorialMarker, index: number): string {
  return `${index}:${marker.label}:${marker.text.slice(0, 24)}`;
}

function useEditorialMarkers(): EditorialMarker[] {
  const { formState } = useDocumentPane();
  const value = formState?.value;
  return useMemo(() => scanDocumentEditorialMarkers(value), [value]);
}

function useMenuItem(): DocumentInspectorMenuItem {
  const count = useEditorialMarkers().length;
  return {
    showAsAction: true,
    title: "Do uzupełnienia",
    tone: count > 0 ? "caution" : undefined,
  };
}

function EditorialMarkersPane(props: DocumentInspectorProps) {
  const markers = useEditorialMarkers();
  const { onFocus, onPathOpen } = useDocumentPane();

  const open = (path: Path) => {
    onFocus(path);
    onPathOpen(path);
  };

  return (
    <section aria-label="Do uzupełnienia">
      <header>
        <h1>Do uzupełnienia ({markers.length})</h1>
        <button type="button" aria-label="Zamknij panel znaczników" onClick={props.onClose}>Zamknij</button>
      </header>
      {markers.length === 0 ? <p>W tej treści nie ma znaczników do uzupełnienia.</p> : (
        <ul>
          {markers.map((marker, index) => (
            <li key={markerKey(marker, index)}>
              <button type="button" onClick={() => open(marker.path)}>
                <strong>{marker.label}</strong>
                {marker.text ? <p>{snippet(marker.text)}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const editorialMarkersInspector = defineDocumentInspector({
  name: "editorialMarkers",
  component: EditorialMarkersPane,
  useMenuItem,
});

export const editorialMarkersPlugin = definePlugin({
  name: "editorial-markers",
  document: {
    inspectors: (previous, context) => {
      if (!DOCUMENT_TYPES.has(context.documentType)) return previous;
      return [...previous, editorialMarkersInspector];
    },
  },
});
