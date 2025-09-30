/**
 * 背景：
 *  - 主题切换历史上依赖 `data-theme`，未与 Tailwind `dark` 类协同，导致样式体系割裂。
 * 目的：
 *  - 通过策略模式统一管理主题偏好（light/dark/system），同时驱动 data-theme 与 dark class。
 * 关键决策与取舍：
 *  - 以策略模式隔离不同主题应用逻辑，便于未来扩展高对比或自动模式；
 *  - 将 `matchMedia` 监听封装在 System 策略中，提供可解除的订阅，避免内存泄漏。
 * 影响范围：
 *  - ThemeContext、按钮与图标等依赖主题变量的组件。
 * 演进与TODO：
 *  - 预留策略注册点，后续可接入自定义主题或按租户差异化皮肤。
 */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

const DARK_CLASS = "dark";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const noop = () => {};

export interface ThemeEnvironment {
  root: HTMLElement | null;
  matchMedia?: (query: string) => MediaQueryList | null;
}

const defaultEnvironment: ThemeEnvironment = {
  root:
    typeof document !== "undefined" && document.documentElement
      ? document.documentElement
      : null,
  matchMedia:
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? (query: string) => window.matchMedia(query)
      : undefined,
};

type ThemeStrategyResult = {
  resolved: ResolvedTheme;
  detach: () => void;
};

type ThemeStrategy = {
  apply: (
    root: HTMLElement,
    notify: (theme: ResolvedTheme) => void,
  ) => ThemeStrategyResult;
  snapshot: () => ResolvedTheme;
};

const addMediaListener = (
  media: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) => {
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }

  if ("addListener" in media && typeof media.addListener === "function") {
    // @ts-expect-error - `addListener` 兼容旧浏览器
    media.addListener(listener);
    return () => {
      // @ts-expect-error - `removeListener` 与上同
      media.removeListener(listener);
    };
  }

  return noop;
};

const buildLightStrategy = (): ThemeStrategy => ({
  apply(root, notify) {
    root.dataset.theme = "light";
    root.classList.remove(DARK_CLASS);
    notify("light");
    return { resolved: "light", detach: noop };
  },
  snapshot: () => "light",
});

const buildDarkStrategy = (): ThemeStrategy => ({
  apply(root, notify) {
    root.dataset.theme = "dark";
    root.classList.add(DARK_CLASS);
    notify("dark");
    return { resolved: "dark", detach: noop };
  },
  snapshot: () => "dark",
});

const resolveSystemTheme = (
  media: MediaQueryList | null | undefined,
): ResolvedTheme => (media && media.matches ? "dark" : "light");

const buildSystemStrategy = (env: ThemeEnvironment): ThemeStrategy => ({
  apply(root, notify) {
    root.dataset.theme = "system";
    const media = env.matchMedia ? env.matchMedia(DARK_MEDIA_QUERY) : null;
    const applyFromMedia = (targetMedia: MediaQueryList | null | undefined) => {
      const next = resolveSystemTheme(targetMedia);
      root.classList.toggle(DARK_CLASS, next === "dark");
      notify(next);
      return next;
    };

    const initial = applyFromMedia(media);

    if (!media) {
      return { resolved: initial, detach: noop };
    }

    const handler = (event: MediaQueryListEvent) => {
      applyFromMedia(event.currentTarget as MediaQueryList);
    };

    const detach = addMediaListener(media, handler);
    return { resolved: initial, detach };
  },
  snapshot() {
    const media = env.matchMedia ? env.matchMedia(DARK_MEDIA_QUERY) : null;
    return resolveSystemTheme(media);
  },
});

const createStrategies = (env: ThemeEnvironment) => ({
  light: buildLightStrategy(),
  dark: buildDarkStrategy(),
  system: buildSystemStrategy(env),
});

export class ThemeModeOrchestrator {
  private readonly env: ThemeEnvironment;

  private readonly strategies: Record<ThemePreference, ThemeStrategy>;

  private detachListener: () => void = noop;

  constructor(env: ThemeEnvironment = defaultEnvironment) {
    this.env = env;
    this.strategies = createStrategies(env);
  }

  apply(preference: ThemePreference, notify: (theme: ResolvedTheme) => void) {
    const root = this.env.root;
    const strategy = this.strategies[preference] ?? this.strategies.system;
    const safeNotify = notify ?? noop;

    this.detachListener();
    this.detachListener = noop;

    if (!root) {
      const resolved = strategy.snapshot();
      safeNotify(resolved);
      return resolved;
    }

    const { resolved, detach } = strategy.apply(root, safeNotify);
    this.detachListener = detach;
    return resolved;
  }

  snapshot(preference: ThemePreference): ResolvedTheme {
    const strategy = this.strategies[preference] ?? this.strategies.system;
    return strategy.snapshot();
  }

  dispose() {
    this.detachListener();
    this.detachListener = noop;
  }
}

export const readStoredPreference = (
  storage: Pick<Storage, "getItem"> | undefined,
  fallback: ThemePreference = "system",
): ThemePreference => {
  if (!storage) {
    return fallback;
  }

  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return fallback;
  } catch (error) {
    console.warn("[theme] failed to read preference:", error);
    return fallback;
  }
};

export const persistPreference = (
  storage: Pick<Storage, "setItem"> | undefined,
  preference: ThemePreference,
) => {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.warn("[theme] failed to persist preference:", error);
  }
};

export const inferResolvedTheme = (
  preference: ThemePreference,
  orchestrator: ThemeModeOrchestrator,
): ResolvedTheme => orchestrator.snapshot(preference);
