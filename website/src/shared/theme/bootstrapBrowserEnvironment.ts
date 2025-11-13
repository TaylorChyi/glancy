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

const getGlobalScope = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  return window as typeof window & { [key: string]: unknown };
};

const bootstrapFaviconManifest = (globalScope: ReturnType<typeof getGlobalScope>) => {
  if (!globalScope) {
    return null;
  }
  const baseSvgKey = getBrowserFaviconBaseSvgGlobalKey();
  globalScope[baseSvgKey] = glancyWebBaseSvg;
  setBrowserFaviconBaseSvg(globalScope, glancyWebBaseSvg);
  const manifest = ensureBrowserFaviconManifest(globalScope);
  const manifestKey = getBrowserFaviconManifestGlobalKey();
  globalScope[manifestKey] = manifest;
  return createBrowserFaviconRegistry(globalScope);
};

const readStoredValue = (key: string, fallback: string) => {
  try {
    return window.localStorage?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const applyStoredLanguage = () => {
  const storedLang = readStoredValue("lang", "");
  if (storedLang) {
    document.documentElement.lang = storedLang;
  }
};

const resolveThemePreference = () => readStoredValue("theme", "system");

const applyThemeToDocument = (preference: string, resolvedTheme: string) => {
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolvedTheme;
};

const updateFaviconLink = (registry: ReturnType<typeof createBrowserFaviconRegistry>, prefersDark: boolean) => {
  if (!registry) {
    return;
  }
  const link = document.getElementById("favicon");
  if (link instanceof HTMLLinkElement) {
    const scheme = prefersDark ? "dark" : "light";
    const asset = registry.resolve(scheme);
    link.href = asset;
    link.dataset.browserColorScheme = scheme;
  }
};

(() => {
  const globalScope = getGlobalScope();
  if (!globalScope) {
    return;
  }

  const registry = bootstrapFaviconManifest(globalScope);
  applyStoredLanguage();

  const preference = resolveThemePreference();
  const prefersDark = window.matchMedia(DARK_MEDIA_QUERY).matches;
  const resolvedTheme = resolveResolvedTheme(preference, prefersDark);
  applyThemeToDocument(preference, resolvedTheme);
  updateFaviconLink(registry, prefersDark);
})();
