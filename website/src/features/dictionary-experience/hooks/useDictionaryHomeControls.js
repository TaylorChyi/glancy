import { useAppShortcuts } from "@shared/hooks";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

export function useDictionaryHomeControls({
  state,
  contexts,
  resetCopyFeedback,
  closeToast,
}) {
  const { inputRef, setActiveView } = state;
  const { languageContext, themeContext } = contexts;
  const { lang, setLang } = languageContext;
  const { theme, setTheme } = themeContext;

  useAppShortcuts({
    inputRef,
    lang,
    setLang,
    theme,
    setTheme,
    entry: state.entry,
    isDictionaryViewActive:
      state.activeView === DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
  });

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const resetDictionaryHomeState = () => {
    resetCopyFeedback();
    state.setEntry(null);
    state.setFinalText("");
    state.setLoading(false);
    state.setCurrentTermKey(null);
    state.setCurrentTerm("");
    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
    focusInput();
    closeToast();
  };

  const handleShowDictionary = () => {
    resetDictionaryHomeState();
  };

  const handleShowLibrary = () => {
    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.LIBRARY);
  };

  return {
    focusInput,
    resetDictionaryHomeState,
    handleShowDictionary,
    handleShowLibrary,
  };
}
