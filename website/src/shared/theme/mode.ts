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

/**
 * 意图：统一同步根节点的主题数据属性，确保 data-theme 始终指向解析后的主题，
 *       同时保留用户偏好以便未来调试或界面展示。
 * 输入：root - 主题挂载根节点；preference/resolved - 用户偏好与解析结果。
 * 输出：无返回值，通过 DOM 副作用更新 data 属性与 dark class。
 * 流程：
 *  1) 写入 data-theme-preference 便于消费层识别真实偏好；
 *  2) 写入 data-theme 为解析后的 light/dark，以复用同一套 tokens；
 *  3) 根据解析结果决定 dark 类是否存在。
 * 错误处理：无显式异常路径，依赖调用方保证 root 存在。
 * 复杂度：O(1)。
 */
const syncRootState = (
  root: HTMLElement,
  preference: ThemePreference,
  resolved: ResolvedTheme,
) => {
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  root.classList.toggle(DARK_CLASS, resolved === "dark");
};

const buildLightStrategy = (): ThemeStrategy => ({
  apply(root, notify) {
    syncRootState(root, "light", "light");
    notify("light");
    return { resolved: "light", detach: noop };
  },
  snapshot: () => "light",
});

const buildDarkStrategy = (): ThemeStrategy => ({
  apply(root, notify) {
    syncRootState(root, "dark", "dark");
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
    const media = env.matchMedia ? env.matchMedia(DARK_MEDIA_QUERY) : null;
    const applyFromMedia = (targetMedia: MediaQueryList | null | undefined) => {
      const next = resolveSystemTheme(targetMedia);
      syncRootState(root, "system", next);
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
