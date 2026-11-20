import { useCallback } from "react";
import { defineDocumentFieldAction, definePlugin } from "sanity";
import type { DocumentFieldActionItem, DocumentFieldActionProps } from "sanity";
import { useRouter } from "sanity/router";
import { useDocumentPane } from "sanity/structure";

import { presentationResolve } from "../presentation";
import {
  hasPresentationLocations,
  presentationEditIntent,
  type PreviewSelection,
} from "../presentation-intent";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function previewSelection(value: unknown): PreviewSelection | null {
  if (!value || typeof value !== "object") return null;
  const slugValue = "slug" in value ? value.slug : undefined;
  const slug =
    slugValue && typeof slugValue === "object" && "current" in slugValue
      ? stringValue(slugValue.current)
      : undefined;
  return {
    title: "title" in value ? stringValue(value.title) : undefined,
    path: slug,
    language: "language" in value ? stringValue(value.language) : undefined,
  };
}

function useOpenInPresentation(
  props: DocumentFieldActionProps,
): DocumentFieldActionItem {
  const { navigateIntent } = useRouter();
  const { value } = useDocumentPane();
  const selected = previewSelection(value);
  const intent =
    props.path.length === 0
      ? presentationEditIntent({
          documentId: props.documentId,
          documentType: props.documentType,
          selected,
          locations: presentationResolve.locations,
        })
      : null;
  const preview = intent?.params.preview;
  const id = intent?.params.id;
  const type = intent?.params.type;
  // Sanity compares this object with react-fast-compare and setStates during
  // render when onAction is a new function. That is React error #301.
  const onAction = useCallback(() => {
    if (!preview || !id || !type) return;
    navigateIntent("edit", {
      id,
      type,
      mode: "presentation",
      preview,
    });
  }, [navigateIntent, preview, id, type]);

  return {
    type: "action",

    title: "Otwórz podgląd",
    renderAsButton: true,
    hidden: intent === null,
    onAction,
  };
}

// renderAsButton on a root field action is the document pane header slot.
export const openInPresentation = defineDocumentFieldAction({
  name: "open-in-presentation",
  useAction: useOpenInPresentation,
});

export const openInPresentationPlugin = definePlugin({
  name: "open-in-presentation",
  document: {
    unstable_fieldActions: (previous, context) => {
      if (
        !hasPresentationLocations(
          context.documentType,
          presentationResolve.locations,
        )
      ) {
        return previous;
      }
      if (previous.some((action) => action.name === openInPresentation.name)) {
        return previous;
      }
      return [...previous, openInPresentation];
    },
  },
});
