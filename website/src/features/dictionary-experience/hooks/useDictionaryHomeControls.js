import { useCallback, useRef } from "react";
import { useAppShortcuts } from "@shared/hooks";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

const useDictionaryShortcutRegistration = ({ state, contexts }) => {
  const { languageContext, themeContext } = contexts;
  useAppShortcuts({
    inputRef: state.inputRef,
    lang: languageContext.lang,
    setLang: languageContext.setLang,
    theme: themeContext.theme,
    setTheme: themeContext.setTheme,
    entry: state.entry,
    isDictionaryViewActive:
      state.activeView === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
  });
};

const focusInputRef = (inputRef) => {
  inputRef.current?.focus();
};

const useFocusInput = (inputRef) =>
  useCallback(() => {
    focusInputRef(inputRef);
  }, [inputRef]);

const resetEntryState = ({
  setEntry,
  setFinalText,
  setCurrentTermKey,
  setCurrentTerm,
}) => {
  setEntry(null);
  setFinalText("");
  setCurrentTermKey(null);
  setCurrentTerm("");
};

const runHomeReset = ({
  resetCopyFeedback,
  setLoading,
  setActiveView,
  focusInput,
  closeToast,
  ...entrySetters
}) => {
  resetCopyFeedback();
  resetEntryState(entrySetters);
  setLoading(false);
  setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
  focusInput();
  closeToast();
};

function useHomeResetHandler(config) {
  const configRef = useRef(config);
  configRef.current = config;
  return useCallback(() => runHomeReset(configRef.current), []);
}

const useShowLibraryHandler = (setActiveView) =>
  useCallback(
    () => setActiveView(DICTIONARY_EXPERIENCE_VIEWS.LIBRARY),
    [setActiveView],
  );

const useShowDictionaryHandler = (resetDictionaryHomeState) =>
  useCallback(() => resetDictionaryHomeState(), [resetDictionaryHomeState]);

export function useDictionaryHomeControls({
  state,
  contexts,
  resetCopyFeedback,
  closeToast,
}) {
  useDictionaryShortcutRegistration({ state, contexts });
  const focusInput = useFocusInput(state.inputRef);
  const resetDictionaryHomeState = useHomeResetHandler({
    resetCopyFeedback,
    setEntry: state.setEntry,
    setFinalText: state.setFinalText,
    setLoading: state.setLoading,
    setCurrentTermKey: state.setCurrentTermKey,
    setCurrentTerm: state.setCurrentTerm,
    setActiveView: state.setActiveView,
    focusInput,
    closeToast,
  });
  const handleShowDictionary = useShowDictionaryHandler(resetDictionaryHomeState);
  const handleShowLibrary = useShowLibraryHandler(state.setActiveView);
  return {
    focusInput,
    resetDictionaryHomeState,
    handleShowDictionary,
    handleShowLibrary,
  };
}
