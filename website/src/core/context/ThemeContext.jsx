import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

const useThemePreference = (storage) => {
  const orchestratorRef = useRef(null);
  const initialPreferenceRef = useRef(null);

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

  return { resolvedTheme, setTheme, theme };
};

const useFaviconSync = () => {
  const faviconRegistryRef = useRef(createBrowserFaviconRegistry());
  const browserFaviconConfiguratorRef = useRef(null);

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
};

const useThemeContextValue = ({ resolvedTheme, setTheme, theme }) =>
  useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme],
  );

const useThemeController = () => {
  const storage = getStorage();
  const { resolvedTheme, setTheme, theme } = useThemePreference(storage);
  useFaviconSync();
  return useThemeContextValue({ resolvedTheme, setTheme, theme });
};

export function ThemeProvider({ children }) {
  const value = useThemeController();
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
