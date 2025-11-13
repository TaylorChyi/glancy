import { useLayoutEffect } from "react";

export function usePanelElementRegistration({
  panelElementRef,
  onPanelElementChange,
  panelId,
  tabId,
}) {
  useLayoutEffect(() => {
    if (typeof onPanelElementChange !== "function") {
      return undefined;
    }

    onPanelElementChange(panelElementRef.current ?? null);

    return () => {
      onPanelElementChange(null);
    };
  }, [onPanelElementChange, panelId, tabId]);
}

export function useHeadingRegistration({
  headingId,
  headingElementRef,
  onHeadingElementChange,
}) {
  useLayoutEffect(() => {
    if (typeof document === "undefined") {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
      return undefined;
    }

    if (!headingId) {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
      return undefined;
    }

    const nextHeading = document.getElementById(headingId);
    headingElementRef.current = nextHeading ?? null;
    if (typeof onHeadingElementChange === "function") {
      onHeadingElementChange(headingElementRef.current);
    }

    return () => {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
    };
  }, [headingId, onHeadingElementChange]);
}
