import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import translations from "@core/i18n/index.js";
import {
  SYSTEM_LANGUAGE_AUTO,
  isSupportedLanguage,
} from "@core/i18n/languages.js";
import { useSettingsStore } from "@core/store/settings";
import { useLocale } from "./LocaleContext.jsx";

const DEFAULT_LANGUAGE = "zh";

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  t: translations[DEFAULT_LANGUAGE],
  setLang: () => {},
  systemLanguage: SYSTEM_LANGUAGE_AUTO,
  setSystemLanguage: () => {},
});

function resolveLanguage({ systemLanguage, locale }) {
  if (isSupportedLanguage(systemLanguage)) {
    return systemLanguage;
  }
  const candidate = locale?.lang;
  if (candidate && isSupportedLanguage(candidate)) {
    return candidate;
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const systemLanguage = useSettingsStore((state) => state.systemLanguage);
  const storeSetSystemLanguage = useSettingsStore(
    (state) => state.setSystemLanguage,
  );
  const { locale } = useLocale();

  const lang = useMemo(
    () => resolveLanguage({ systemLanguage, locale }),
    [systemLanguage, locale],
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
