import { useEffect, useCallback, useMemo } from "react";
import translations from "@core/i18n/index.js";
import { useKeyboardShortcutContext } from "@core/context";
import {
  doesEventMatchShortcut,
  DEFAULT_SHORTCUTS,
} from "@shared/utils/keyboardShortcuts.js";

const THEME_SEQUENCE = {
  dark: "light",
  light: "system",
  system: "dark",
};

/**
 * 背景：
 *  - 快捷键绑定逻辑过度集中在单一 Hook 内，导致可读性下降且难以扩展。
 * 目的：
 *  - 采用组合式小 Hook 拆解聚合逻辑，保障主 Hook 职责单一并易于演进。
 * 关键决策与取舍：
 *  - 以 memoized map 与 handler registry 分离数据与行为层，提高扩展性；
 *  - 保持浏览器事件注册在独立 Hook 中，便于未来接入日志或埋点。
 * 影响范围：
 *  - 依赖应用快捷键的交互，行为保持不变，仅改善结构。
 * 演进与TODO：
 *  - 后续可将快捷键配置抽象为策略表，实现用户级定制与持久化。
 */

const useFocusInput = (inputRef) =>
  useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

const useCycleLanguage = (lang, setLang) =>
  useCallback(() => {
    const langs = Object.keys(translations);
    const next = langs[(langs.indexOf(lang) + 1) % langs.length];
    setLang(next);
  }, [lang, setLang]);

const useCycleTheme = (theme, setTheme) =>
  useCallback(() => {
    setTheme(THEME_SEQUENCE[theme] || "light");
  }, [theme, setTheme]);

const useOpenShortcuts = () =>
  useCallback(() => {
    document.dispatchEvent(new Event("open-shortcuts"));
  }, []);

const useShortcutMap = (shortcuts) =>
  useMemo(() => {
    const base = new Map(
      DEFAULT_SHORTCUTS.map((shortcut) => [shortcut.action, shortcut.keys]),
    );
    shortcuts.forEach((shortcut) => {
      base.set(shortcut.action, shortcut.keys);
    });
    return base;
  }, [shortcuts]);

const useShortcutHandlers = ({
  focusInput,
  cycleLanguage,
  cycleTheme,
  openShortcuts,
}) =>
  useMemo(
    () => ({
      FOCUS_SEARCH: focusInput,
      SWITCH_LANGUAGE: cycleLanguage,
      TOGGLE_THEME: cycleTheme,
      OPEN_SHORTCUTS: openShortcuts,
    }),
    [focusInput, cycleLanguage, cycleTheme, openShortcuts],
  );

const useShortcutListener = (handlers, shortcutMap) => {
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
};

export function useAppShortcuts({ inputRef, lang, setLang, theme, setTheme }) {
  const { shortcuts } = useKeyboardShortcutContext();
  const focusInput = useFocusInput(inputRef);
  const cycleLanguage = useCycleLanguage(lang, setLang);
  const cycleTheme = useCycleTheme(theme, setTheme);
  const openShortcuts = useOpenShortcuts();
  const shortcutMap = useShortcutMap(shortcuts);
  const handlers = useShortcutHandlers({
    focusInput,
    cycleLanguage,
    cycleTheme,
    openShortcuts,
  });

  useShortcutListener(handlers, shortcutMap);

  return {
    focusInput,
    cycleLanguage,
    cycleTheme,
    openShortcuts,
  };
}
