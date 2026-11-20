import { WarningOutlineIcon } from "@sanity/icons/WarningOutline";
import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import { useMemo } from "react";
import {
  defineDocumentInspector,
  definePlugin,
  type DocumentInspectorMenuItem,
  type DocumentInspectorProps,
  type Path,
} from "sanity";
import { DocumentInspectorHeader, useDocumentPane } from "sanity/structure";

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
    icon: WarningOutlineIcon,
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
    <Flex direction="column" height="fill" overflow="hidden">
      <DocumentInspectorHeader
        closeButtonLabel="Zamknij panel znaczników"
        flex="none"
        onClose={props.onClose}
        title={`Do uzupełnienia (${markers.length})`}
      />
      <Box flex={1} overflow="auto" padding={3}>
        {markers.length === 0 ? (
          <Box padding={2}>
            <Text muted size={1}>
              W tej treści nie ma znaczników do uzupełnienia.
            </Text>
          </Box>
        ) : (
          <Stack as="ul" gap={2}>
            {markers.map((marker, index) => (
              <Card
                as="li"
                key={markerKey(marker, index)}
                tone="caution"
                radius={2}
                border
              >
                <Card
                  as="button"
                  type="button"
                  tone="inherit"
                  radius={2}
                  padding={3}
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => open(marker.path)}
                >
                  <Stack gap={2}>
                    <Text size={1} weight="semibold">
                      {marker.label}
                    </Text>
                    {marker.text ? <Text size={1}>{snippet(marker.text)}</Text> : null}
                  </Stack>
                </Card>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Flex>
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
