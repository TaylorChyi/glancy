import { useEffect, useCallback, useMemo } from "react";
import translations from "@core/i18n/index.js";
import { useKeyboardShortcutContext } from "@core/context";
import {
  doesEventMatchShortcut,
  DEFAULT_SHORTCUTS,
} from "@shared/utils/keyboardShortcuts.js";

export function useAppShortcuts({
  inputRef,
  lang,
  setLang,
  theme,
  setTheme,
}) {
  const { shortcuts } = useKeyboardShortcutContext();
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const cycleLanguage = useCallback(() => {
    const langs = Object.keys(translations);
    const next = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(next);
  }, [lang, setLang]);

  const cycleTheme = useCallback(() => {
    const seq = { dark: "light", light: "system", system: "dark" };
    setTheme(seq[theme] || "light");
  }, [theme, setTheme]);

  const openShortcuts = useCallback(() => {
    document.dispatchEvent(new Event("open-shortcuts"));
  }, []);

  const shortcutMap = useMemo(() => {
    const base = new Map(
      DEFAULT_SHORTCUTS.map((shortcut) => [shortcut.action, shortcut.keys]),
    );
    shortcuts.forEach((shortcut) => {
      base.set(shortcut.action, shortcut.keys);
    });
    return base;
  }, [shortcuts]);

  const handlers = useMemo(
    () => ({
      FOCUS_SEARCH: focusInput,
      SWITCH_LANGUAGE: cycleLanguage,
      TOGGLE_THEME: cycleTheme,
      OPEN_SHORTCUTS: openShortcuts,
    }),
    [focusInput, cycleLanguage, cycleTheme, openShortcuts],
  );

  useEffect(() => {
    function handleShortcut(e) {
      if (e.defaultPrevented) {
        return;
      }
      for (const [action, handler] of Object.entries(handlers)) {
        const keys = shortcutMap.get(action) ?? [];
        if (keys.length === 0) {
          continue;
        }
        if (doesEventMatchShortcut(keys, e)) {
          e.preventDefault();
          handler();
          break;
        }
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [handlers, shortcutMap]);

  return {
    focusInput,
    cycleLanguage,
    cycleTheme,
    openShortcuts,
  };
}
