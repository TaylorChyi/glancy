import { useCallback } from "react";
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

const useHomeResetHandler = ({
  resetCopyFeedback,
  setEntry,
  setFinalText,
  setLoading,
  setCurrentTermKey,
  setCurrentTerm,
  setActiveView,
  focusInput,
  closeToast,
}) =>
  useCallback(() => {
    resetCopyFeedback();
    setEntry(null);
    setFinalText("");
    setLoading(false);
    setCurrentTermKey(null);
    setCurrentTerm("");
    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
    focusInput();
    closeToast();
  }, [
    resetCopyFeedback,
    setEntry,
    setFinalText,
    setLoading,
    setCurrentTermKey,
    setCurrentTerm,
    setActiveView,
    focusInput,
    closeToast,
  ]);

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
