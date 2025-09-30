import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import lightIcon from "@/assets/brand/glancy-web-light.svg";
import darkIcon from "@/assets/brand/glancy-web-dark.svg";
import {
  ThemeModeOrchestrator,
  inferResolvedTheme,
  persistPreference,
  readStoredPreference,
} from "@/theme/mode";

/**
 * 背景：
 *  - 早期主题切换仅依赖 data-theme，未同步 Tailwind 的 dark 类，导致新旧样式系统割裂。
 * 目的：
 *  - 通过 ThemeModeOrchestrator 统一管理 light/dark/system 策略，确保数据存储、DOM 状态与语义变量同步。
 * 关键决策与取舍：
 *  - 使用策略模式（封装在 orchestrator 内部）处理主题逻辑，避免组件中散落的 matchMedia 监听；
 *  - 继续维护 favicon 切换逻辑，以保证品牌识别与旧行为兼容。
 * 影响范围：
 *  - 全局主题状态、依赖 useTheme 的组件、Tailwind darkMode class。
 * 演进与TODO：
 *  - 后续可在 orchestrator 中加入高对比主题或按租户注入的自定义策略。
 */

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
    if (typeof window === "undefined") {
      return undefined;
    }

    const link = document.getElementById("favicon");
    if (!link) {
      return undefined;
    }

    link.href = resolvedTheme === "dark" ? darkIcon : lightIcon;
    return undefined;
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
