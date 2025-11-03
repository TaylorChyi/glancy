import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import translations from "@core/i18n/index.js";
import {
  SYSTEM_LANGUAGE_AUTO,
  isSupportedLanguage,
} from "@core/i18n/languages.js";
import { useSettingsStore } from "@core/store/settings";

const DEFAULT_LANGUAGE = "zh";

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  t: translations[DEFAULT_LANGUAGE],
  setLang: () => {},
  systemLanguage: SYSTEM_LANGUAGE_AUTO,
  setSystemLanguage: () => {},
});

/**
 * 意图：根据浏览器公开的语言首选项提取首个受支持的语言代码。
 * 输入：无（从全局 navigator 读取语言列表，可能为空）。
 * 输出：若存在匹配则返回语言代码，否则返回 null。
 * 流程：
 *  1) 收集 navigator.languages 或 navigator.language；
 *  2) 依序拆分候选值的主语言段；
 *  3) 命中支持列表即返回。
 * 错误处理：navigator 缺失或提供非法值时静默回退。
 * 复杂度：O(n)，n 为候选语言个数。
 */
export function detectBrowserLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }

  const candidates =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const [primary] = trimmed.split(/[-_]/);
    const normalized = primary?.toLowerCase();
    if (normalized && isSupportedLanguage(normalized)) {
      return normalized;
    }
  }

  return null;
}

/**
 * 意图：在系统语言与浏览器默认语言之间择优确定当前语言。
 * 输入：systemLanguage（用户设置，可能为 auto），browserLanguage（浏览器首选，可能为空）。
 * 输出：可用的语言代码。
 * 流程：
 *  1) 用户设置为受支持语言时直接返回；
 *  2) 否则尝试浏览器首选项；
 *  3) 最终落到默认语言。
 * 错误处理：所有分支未命中时回退 DEFAULT_LANGUAGE。
 * 复杂度：O(1)。
 */
export function resolveLanguage({ systemLanguage, browserLanguage }) {
  if (isSupportedLanguage(systemLanguage)) {
    return systemLanguage;
  }
  if (browserLanguage && isSupportedLanguage(browserLanguage)) {
    return browserLanguage;
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const systemLanguage = useSettingsStore((state) => state.systemLanguage);
  const storeSetSystemLanguage = useSettingsStore(
    (state) => state.setSystemLanguage,
  );
  const [browserLanguage, setBrowserLanguage] = useState(() =>
    detectBrowserLanguage(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const handleLanguageChange = () => {
      setBrowserLanguage(detectBrowserLanguage());
    };
    window.addEventListener("languagechange", handleLanguageChange);
    return () => {
      window.removeEventListener("languagechange", handleLanguageChange);
    };
  }, []);

  const lang = useMemo(
    () => resolveLanguage({ systemLanguage, browserLanguage }),
    [systemLanguage, browserLanguage],
  );

  const t = useMemo(
    () => translations[lang] || translations[DEFAULT_LANGUAGE],
    [lang],
  );

  useEffect(() => {
    document.title = t.welcomeTitle;
    document.documentElement.lang = lang;
  }, [lang, t]);

  const changeLanguage = useCallback(
    (next) => {
      storeSetSystemLanguage(next ?? SYSTEM_LANGUAGE_AUTO);
    },
    [storeSetSystemLanguage],
  );

  const contextValue = useMemo(
    () => ({
      lang,
      t,
      setLang: changeLanguage,
      systemLanguage,
      setSystemLanguage: changeLanguage,
    }),
    [changeLanguage, lang, systemLanguage, t],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
