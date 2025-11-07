import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createBrowserFaviconConfigurator } from "@shared/theme/browserFaviconConfigurator";
import { createBrowserFaviconRegistry } from "@shared/theme/browserFaviconManifest";
import {
  ThemeModeOrchestrator,
  inferResolvedTheme,
  persistPreference,
  readStoredPreference,
} from "@shared/theme/mode";



// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

const getStorage = () =>
  typeof window !== "undefined" && window.localStorage
    ? window.localStorage
    : undefined;

export function ThemeProvider({ children }) {
  const storage = getStorage();
  const orchestratorRef = useRef(null);
  const initialPreferenceRef = useRef(null);
  const faviconRegistryRef = useRef(createBrowserFaviconRegistry());
  const browserFaviconConfiguratorRef = useRef(null);

  const ensureOrchestrator = useCallback(() => {
    if (!orchestratorRef.current) {
      orchestratorRef.current = new ThemeModeOrchestrator();
    }
    return orchestratorRef.current;
  }, []);

  if (initialPreferenceRef.current === null) {
    initialPreferenceRef.current = readStoredPreference(storage);
  }

  const initialPreference = initialPreferenceRef.current;
  const [theme, setTheme] = useState(initialPreference);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    inferResolvedTheme(initialPreference, ensureOrchestrator()),
  );

  useEffect(() => {
    const orchestrator = ensureOrchestrator();
    persistPreference(storage, theme);
    orchestrator.apply(theme, setResolvedTheme);
    return () => {
      orchestrator.dispose();
    };
  }, [ensureOrchestrator, setResolvedTheme, storage, theme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    if (!browserFaviconConfiguratorRef.current) {
      browserFaviconConfiguratorRef.current = createBrowserFaviconConfigurator({
        registry: faviconRegistryRef.current,
        document,
      });
    }

    const configurator = browserFaviconConfiguratorRef.current;
    configurator.start();
    return () => {
      configurator.stop();
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
