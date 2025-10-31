/**
 * 背景：
 *  - 焦点控制、重置、语音等 UI 行为散落在多处，难以维护。
 * 目的：
 *  - 提供聚合的主页控制器，封装快捷键、焦点与视图切换逻辑。
 */
import { useAppShortcuts } from "@shared/hooks";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

export function useDictionaryHomeControls({
  state,
  contexts,
  resetCopyFeedback,
  closeToast,
  startSpeech,
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
  });

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const resetDictionaryHomeState = () => {
    resetCopyFeedback();
    state.setEntry(null);
    state.setFinalText("");
    state.setStreamText("");
    state.setLoading(false);
    state.setVersions([]);
    state.setActiveVersionId(null);
    state.setCurrentTermKey(null);
    state.setCurrentTerm("");
    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
    focusInput();
    closeToast();
  };

  const handleShowDictionary = () => {
    resetDictionaryHomeState();
  };

  const handleVoice = () => {
    const locale = lang === "en" ? "en-US" : "zh-CN";
    startSpeech(locale);
  };

  return {
    focusInput,
    resetDictionaryHomeState,
    handleShowDictionary,
    handleVoice,
  };
}
