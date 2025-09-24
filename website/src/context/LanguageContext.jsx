import { createContext, useContext, useState, useEffect } from "react";
import translations from "@/i18n/index.js";
import { useLocale } from "./LocaleContext.jsx";

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext({
  lang: "zh",
  t: translations.zh,
  setLang: () => {},
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "zh");
  const [t, setT] = useState(
    () => translations[localStorage.getItem("lang")] || translations.zh,
  );

  const { locale } = useLocale();

  useEffect(() => {
    if (localStorage.getItem("lang") || !locale) return;
    if (translations[locale.lang]) {
      setLang(locale.lang);
      setT(translations[locale.lang]);
      localStorage.setItem("lang", locale.lang);
    }
  }, [locale]);

  useEffect(() => {
    document.title = t.welcomeTitle;
    document.documentElement.lang = lang;
  }, [lang, t]);

  const changeLanguage = (l) => {
    if (translations[l]) {
      setLang(l);
      setT(translations[l]);
      localStorage.setItem("lang", l);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, t, setLang: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);
