import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import translations from "@core/i18n/index.js";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import { useSettingsStore } from "@core/store/settings";
import {
  DEFAULT_LANGUAGE,
  detectBrowserLanguage,
  resolveLanguage,
} from "./languageUtils.js";

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  t: translations[DEFAULT_LANGUAGE],
  setLang: () => {},
  systemLanguage: SYSTEM_LANGUAGE_AUTO,
  setSystemLanguage: () => {},
});

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
