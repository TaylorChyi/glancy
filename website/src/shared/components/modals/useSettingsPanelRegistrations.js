import { useLayoutEffect } from "react";

function notifyHeadingChange(headingElementRef, onHeadingElementChange, nextHeading) {
  headingElementRef.current = nextHeading ?? null;
  if (typeof onHeadingElementChange === "function") {
    onHeadingElementChange(headingElementRef.current);
  }
}

function resetHeadingRegistration(headingElementRef, onHeadingElementChange) {
  notifyHeadingChange(headingElementRef, onHeadingElementChange, null);
}

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
  }, [onPanelElementChange, panelElementRef, panelId, tabId]);
}

export function useHeadingRegistration({
  headingId,
  headingElementRef,
  onHeadingElementChange,
}) {
  useLayoutEffect(() => {
    if (typeof document === "undefined" || !headingId) {
      resetHeadingRegistration(headingElementRef, onHeadingElementChange);
      return undefined;
    }

    const nextHeading = document.getElementById(headingId);
    notifyHeadingChange(headingElementRef, onHeadingElementChange, nextHeading);

    return () => {
      resetHeadingRegistration(headingElementRef, onHeadingElementChange);
    };
  }, [headingElementRef, headingId, onHeadingElementChange]);
}
