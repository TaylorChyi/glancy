import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";

export const PANEL_MODE_SEARCH = "search" as const;
export const PANEL_MODE_ACTIONS = "actions" as const;

type PanelMode = typeof PANEL_MODE_SEARCH | typeof PANEL_MODE_ACTIONS;

type UseBottomPanelStateParams = {
  hasDefinition: boolean;
  text: string;
};

type FocusChangePayload = {
  isFocused: boolean;
  event: React.FocusEvent<HTMLTextAreaElement>;
  formElement: HTMLFormElement | null;
  restoreFocus: () => void;
};

type UseBottomPanelStateResult = {
  mode: PanelMode;
  isSearchMode: boolean;
  isActionsMode: boolean;
  handleFocusChange: (payload: FocusChangePayload) => void;
  activateSearchMode: () => void;
  activateActionsMode: () => void;
  handleScrollEscape: () => void;
};

const trimText = (value: string): string => value.trim();

export default function useBottomPanelState({
  hasDefinition,
  text,
}: UseBottomPanelStateParams): UseBottomPanelStateResult {
  const [mode, setMode] = useState<PanelMode>(PANEL_MODE_SEARCH);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const latestHasDefinition = useRef(hasDefinition);

  useEffect(() => {
    latestHasDefinition.current = hasDefinition;
  }, [hasDefinition]);

  const evaluateActionsFallback = useCallback(() => {
    if (!latestHasDefinition.current) {
      return;
    }
    setMode(PANEL_MODE_ACTIONS);
    setIsInputFocused(false);
  }, []);

  const handleFocusChange = useCallback(
    ({ isFocused, event, formElement }: FocusChangePayload) => {
      const relatedTarget = event.relatedTarget;
      const isRelatedTargetNode =
        relatedTarget instanceof Node ? relatedTarget : null;
      const isWithinForm = Boolean(
        formElement &&
          isRelatedTargetNode &&
          formElement.contains(isRelatedTargetNode),
      );
      const isSearchActive = isFocused || isWithinForm;

      setIsInputFocused(isSearchActive);
      if (isSearchActive) {
        setMode(PANEL_MODE_SEARCH);
        return;
      }
      evaluateActionsFallback();
    },
    [evaluateActionsFallback],
  );

  const activateSearchMode = useCallback(() => {
    setMode(PANEL_MODE_SEARCH);
  }, []);

  const activateActionsMode = useCallback(() => {
    evaluateActionsFallback();
  }, [evaluateActionsFallback]);

  const handleScrollEscape = useCallback(() => {
    evaluateActionsFallback();
  }, [evaluateActionsFallback]);

  const normalizedText = useMemo(() => trimText(text), [text]);

  useEffect(() => {
    if (!hasDefinition) {
      setMode(PANEL_MODE_SEARCH);
      return;
    }
    if (!isInputFocused && normalizedText.length === 0) {
      setMode(PANEL_MODE_ACTIONS);
    }
  }, [hasDefinition, isInputFocused, normalizedText]);

  return {
    mode,
    isSearchMode: mode === PANEL_MODE_SEARCH,
    isActionsMode: mode === PANEL_MODE_ACTIONS,
    handleFocusChange,
    activateSearchMode,
    activateActionsMode,
    handleScrollEscape,
  };
}
