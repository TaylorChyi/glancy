import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

export const PANEL_MODE_SEARCH = "search" as const;
export const PANEL_MODE_ACTIONS = "actions" as const;

type PanelMode = typeof PANEL_MODE_SEARCH | typeof PANEL_MODE_ACTIONS;

type UseBottomPanelStateParams = { hasDefinition: boolean; text: string };
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


const usePanelModeState = () => {
  const [mode, setMode] = useState<PanelMode>(PANEL_MODE_SEARCH);
  const activateSearchMode = useCallback(() => {
    setMode(PANEL_MODE_SEARCH);
  }, []);
  const forceActionsMode = useCallback(() => {
    setMode(PANEL_MODE_ACTIONS);
  }, []);
  return { mode, activateSearchMode, forceActionsMode };
};

const useInputFocusState = () => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const setFocusState = useCallback((value: boolean) => {
    setIsInputFocused(value);
  }, []);
  return { isInputFocused, setFocusState };
};

type ModeState = ReturnType<typeof usePanelModeState>;
type FocusState = ReturnType<typeof useInputFocusState>;
type FocusAndActionParams = {
  hasDefinition: boolean;
  text: string;
  modeState: ModeState;
  focusState: FocusState;
  evaluateActionsFallback: () => void;
};

const useActionsModeFallback = ({
  hasDefinition,
  forceActionsMode,
  setFocusState,
}: {
  hasDefinition: boolean;
  forceActionsMode: () => void;
  setFocusState: (value: boolean) => void;
}) => {
  const latestHasDefinition = useRef(hasDefinition);
  useEffect(() => {
    latestHasDefinition.current = hasDefinition;
  }, [hasDefinition]);
  return useCallback(() => {
    if (!latestHasDefinition.current) {
      return;
    }
    forceActionsMode();
    setFocusState(false);
  }, [forceActionsMode, setFocusState]);
};

const useFocusChangeHandler = ({
  setFocusState,
  activateSearchMode,
  evaluateActionsFallback,
}: {
  setFocusState: (value: boolean) => void;
  activateSearchMode: () => void;
  evaluateActionsFallback: () => void;
}) =>
  useCallback(
    ({ isFocused, event, formElement }: FocusChangePayload) => {
      const relatedTarget = event.relatedTarget;
      const isWithinForm = Boolean(
        formElement &&
          relatedTarget instanceof Node &&
          formElement.contains(relatedTarget),
      );
      const isSearchActive = isFocused || isWithinForm;
      setFocusState(isSearchActive);
      if (isSearchActive) {
        activateSearchMode();
        return;
      }
      evaluateActionsFallback();
    },
    [activateSearchMode, evaluateActionsFallback, setFocusState],
  );

const useAutoModeResolution = ({
  hasDefinition,
  isInputFocused,
  text,
  activateSearchMode,
  evaluateActionsFallback,
}: {
  hasDefinition: boolean;
  isInputFocused: boolean;
  text: string;
  activateSearchMode: () => void;
  evaluateActionsFallback: () => void;
}) => {
  useEffect(() => {
    if (!hasDefinition) {
      activateSearchMode();
      return;
    }
    if (!isInputFocused && trimText(text).length === 0) {
      evaluateActionsFallback();
    }
  }, [
    activateSearchMode,
    evaluateActionsFallback,
    hasDefinition,
    isInputFocused,
    text,
  ]);
};

const useFocusAndActionHandlers = ({
  hasDefinition,
  text,
  modeState,
  focusState,
  evaluateActionsFallback,
}: FocusAndActionParams) => {
  const handleFocusChange = useFocusChangeHandler({
    setFocusState: focusState.setFocusState,
    activateSearchMode: modeState.activateSearchMode,
    evaluateActionsFallback,
  });
  const triggerActionsMode = useCallback(() => {
    evaluateActionsFallback();
  }, [evaluateActionsFallback]);
  useAutoModeResolution({
    hasDefinition,
    isInputFocused: focusState.isInputFocused,
    text,
    activateSearchMode: modeState.activateSearchMode,
    evaluateActionsFallback,
  });
  return {
    handleFocusChange,
    activateActionsMode: triggerActionsMode,
    handleScrollEscape: triggerActionsMode,
  };
};

export default function useBottomPanelState({
  hasDefinition,
  text,
}: UseBottomPanelStateParams): UseBottomPanelStateResult {
  const modeState = usePanelModeState();
  const focusState = useInputFocusState();
  const evaluateActionsFallback = useActionsModeFallback({
    hasDefinition,
    forceActionsMode: modeState.forceActionsMode,
    setFocusState: focusState.setFocusState,
  });
  const handlers = useFocusAndActionHandlers({
    hasDefinition,
    text,
    modeState,
    focusState,
    evaluateActionsFallback,
  });
  return {
    mode: modeState.mode,
    isSearchMode: modeState.mode === PANEL_MODE_SEARCH,
    isActionsMode: modeState.mode === PANEL_MODE_ACTIONS,
    handleFocusChange: handlers.handleFocusChange,
    activateSearchMode: modeState.activateSearchMode,
    activateActionsMode: handlers.activateActionsMode,
    handleScrollEscape: handlers.handleScrollEscape,
  };
}
