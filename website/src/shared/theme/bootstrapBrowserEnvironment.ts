import glancyWebBaseSvg from "@assets/brand/glancy/brand-glancy-website.svg?raw";
import {
  createBrowserFaviconRegistry,
  ensureBrowserFaviconManifest,
  getBrowserFaviconBaseSvgGlobalKey,
  getBrowserFaviconManifestGlobalKey,
  setBrowserFaviconBaseSvg,
} from "@shared/theme/browserFaviconManifest";

const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const resolveResolvedTheme = (preference: string, prefersDark: boolean) => {
  if (preference === "dark" || preference === "light") {
    return preference;
  }
  return prefersDark ? "dark" : "light";
};

(() => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const globalScope = window as typeof window & {
    [key: string]: unknown;
  };
  const baseSvgKey = getBrowserFaviconBaseSvgGlobalKey();
  globalScope[baseSvgKey] = glancyWebBaseSvg;
  setBrowserFaviconBaseSvg(globalScope, glancyWebBaseSvg);
  const manifest = ensureBrowserFaviconManifest(globalScope);
  const manifestKey = getBrowserFaviconManifestGlobalKey();
  // 将 manifest 写回全局，供 React 生命周期与调试复用。
  globalScope[manifestKey] = manifest;

  const { localStorage } = window;
  try {
    const storedLang = localStorage?.getItem("lang");
    if (storedLang) {
      document.documentElement.lang = storedLang;
    }
  } catch {
    // 访问 localStorage 可能因隐私模式被拒绝，忽略即可。
  }

  let preference = "system";
  try {
    preference = localStorage?.getItem("theme") ?? "system";
  } catch {
    preference = "system";
  }

  const prefersDark = window.matchMedia(DARK_MEDIA_QUERY).matches;
  const resolvedTheme = resolveResolvedTheme(preference, prefersDark);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolvedTheme;

  const registry = createBrowserFaviconRegistry(globalScope);
  const link = document.getElementById("favicon");
  if (link instanceof HTMLLinkElement) {
    const scheme = prefersDark ? "dark" : "light";
    const asset = registry.resolve(scheme);
    link.href = asset;
    link.dataset.browserColorScheme = scheme;
  }
})();
