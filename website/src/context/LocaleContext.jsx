import { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi.js";

// eslint-disable-next-line react-refresh/only-export-components
export const LocaleContext = createContext({
  locale: null,
  setLocale: () => {},
});

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const stored = localStorage.getItem("locale");
    return stored ? JSON.parse(stored) : null;
  });
  const api = useApi();

  useEffect(() => {
    if (locale) return;
    api.locale
      .getLocale()
      .then((data) => {
        setLocale(data);
        localStorage.setItem("locale", JSON.stringify(data));
      })
      .catch((err) => {
        console.error(err);
      });
  }, [locale, api]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLocale = () => useContext(LocaleContext);
