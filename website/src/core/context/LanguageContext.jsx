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

const useBrowserLanguageSource = () => {
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
  return browserLanguage;
};

const useResolvedLanguage = (systemLanguage) => {
  const browserLanguage = useBrowserLanguageSource();
  return useMemo(
    () => resolveLanguage({ systemLanguage, browserLanguage }),
    [systemLanguage, browserLanguage],
  );
};

const useLanguageTranslations = (lang) =>
  useMemo(
    () => translations[lang] || translations[DEFAULT_LANGUAGE],
    [lang],
  );

const useLanguageContextValue = ({
  changeLanguage,
  lang,
  systemLanguage,
  t,
}) =>
  useMemo(
    () => ({
      lang,
      t,
      setLang: changeLanguage,
      systemLanguage,
      setSystemLanguage: changeLanguage,
    }),
    [changeLanguage, lang, systemLanguage, t],
  );

const useLanguagePreference = () => {
  const systemLanguage = useSettingsStore((state) => state.systemLanguage);
  const storeSetSystemLanguage = useSettingsStore(
    (state) => state.setSystemLanguage,
  );
  const changeLanguage = useCallback(
    (next) => {
      storeSetSystemLanguage(next ?? SYSTEM_LANGUAGE_AUTO);
    },
    [storeSetSystemLanguage],
  );
  const lang = useResolvedLanguage(systemLanguage);
  const t = useLanguageTranslations(lang);

  return {
    changeLanguage,
    lang,
    systemLanguage,
    t,
  };
};

const useDocumentLanguageSync = (lang, t) => {
  useEffect(() => {
    document.title = t.welcomeTitle;
    document.documentElement.lang = lang;
  }, [lang, t]);
};

function useLanguageController() {
  const { changeLanguage, lang, systemLanguage, t } = useLanguagePreference();
  useDocumentLanguageSync(lang, t);
  return useLanguageContextValue({
    changeLanguage,
    lang,
    systemLanguage,
    t,
  });
}

export function LanguageProvider({ children }) {
  const contextValue = useLanguageController();
  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
