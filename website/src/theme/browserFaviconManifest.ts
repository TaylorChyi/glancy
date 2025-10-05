/**
 * 背景：
 *  - favicon 需根据浏览器颜色方案切换，但设计稿仅提供单个 base SVG；
 *  - 过往方案通过复制多份素材实现，维护成本高且易与品牌资产脱钩。
 * 目的：
 *  - 复用现有 glancy-web.svg，通过运行时着色生成浅深两款 favicon 并挂载到全局供多处复用；
 * 关键决策与取舍：
 *  - 选择“数据 URI + 动态染色”策略，避免额外素材文件；备选方案为预构建静态资源但需调整构建链路，故暂缓；
 *  - 以全局注册表缓存生成结果，确保引导脚本与 React 生命周期共享同一份 manifest；
 * 影响范围：
 *  - 浏览器 favicon 渲染、启动脚本、ThemeContext 中的配置器初始化；
 * 演进与TODO：
 *  - 后续可增加更多配色（如高对比）或改造为服务端可注入的多租户调色板。
 */
import {
  createFaviconRegistry,
  type FaviconManifest,
  type FaviconRegistry,
} from "@/theme/faviconRegistry";

const GLOBAL_KEY = "__GLANCY_BROWSER_FAVICON_MANIFEST__" as const;
const BASE_SVG_KEY = "__GLANCY_BROWSER_FAVICON_BASE_SVG__" as const;

const DEFAULT_LIGHT_COLOR = "#000000";
const DEFAULT_DARK_COLOR = "#ffffff";

const FALLBACK_BASE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>" +
  "<rect x='7' y='5' width='4' height='14' rx='1' fill='currentColor'/>" +
  "<rect x='13' y='3' width='4' height='12' rx='1' fill='currentColor'/>" +
  "<rect x='3' y='9' width='4' height='12' rx='1' fill='currentColor'/></svg>";

const CURRENT_COLOR_PATTERN = /currentColor/g;
const WHITESPACE_PATTERN = new RegExp(">\\s+<", "g");

export type BrowserFaviconManifest = FaviconManifest;

export type BrowserFaviconPalette = {
  light?: string;
  dark?: string;
};

type BrowserGlobalScope = {
  [GLOBAL_KEY]?: BrowserFaviconManifest;
  [BASE_SVG_KEY]?: string;
} &
  Partial<typeof globalThis>;

const sanitizeColor = (hex: string, fallback: string): string => {
  const trimmed = typeof hex === "string" ? hex.trim() : "";
  if (trimmed.startsWith("#")) {
    const normalized = trimmed.slice(1);
    if (
      normalized.length === 3 ||
      normalized.length === 6 ||
      normalized.length === 8
    ) {
      const hexPattern = /^[0-9a-fA-F]+$/;
      if (hexPattern.test(normalized)) {
        return `#${normalized}`;
      }
    }
  }
  return fallback;
};

const encodeSvgDataUri = (svg: string): string => {
  const compact = svg.replace(WHITESPACE_PATTERN, "><").trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(compact)}`;
};

const tintSvg = (svg: string, color: string): string =>
  svg.replace(CURRENT_COLOR_PATTERN, color);

const isValidSvgSource = (svg: unknown): svg is string =>
  typeof svg === "string" && svg.includes("currentColor");

const resolveBaseSvg = (scope: BrowserGlobalScope): string => {
  if (isValidSvgSource(scope[BASE_SVG_KEY])) {
    return scope[BASE_SVG_KEY] as string;
  }
  return FALLBACK_BASE_SVG;
};

export const buildBrowserFaviconManifest = (
  svgSource: string,
  palette: BrowserFaviconPalette = {},
): BrowserFaviconManifest => {
  const lightColor = sanitizeColor(palette.light ?? "", DEFAULT_LIGHT_COLOR);
  const darkColor = sanitizeColor(palette.dark ?? "", DEFAULT_DARK_COLOR);
  const lightSvg = tintSvg(svgSource, lightColor);
  const darkSvg = tintSvg(svgSource, darkColor);
  const lightIcon = encodeSvgDataUri(lightSvg);
  const darkIcon = encodeSvgDataUri(darkSvg);

  return {
    default: lightIcon,
    light: lightIcon,
    dark: darkIcon,
  };
};

const readManifestFromGlobal = (
  scope: BrowserGlobalScope,
): BrowserFaviconManifest | null => {
  const candidate = scope[GLOBAL_KEY];
  if (!candidate) {
    return null;
  }
  const entries = Object.entries(candidate);
  if (entries.every(([, value]) => typeof value === "string" && value.length > 0)) {
    return candidate;
  }
  return null;
};

export const setBrowserFaviconBaseSvg = (
  scope: BrowserGlobalScope,
  svgSource: string,
) => {
  if (isValidSvgSource(svgSource)) {
    scope[BASE_SVG_KEY] = svgSource;
  }
};

const assignManifestToGlobal = (
  scope: BrowserGlobalScope,
  manifest: BrowserFaviconManifest,
) => {
  try {
    scope[GLOBAL_KEY] = manifest;
  } catch {
    // 某些环境（如严格 CSP 或模拟对象）可能拒绝赋值，此时忽略即可。
  }
};

export const ensureBrowserFaviconManifest = (
  scope: BrowserGlobalScope = globalThis as BrowserGlobalScope,
): BrowserFaviconManifest => {
  const existing = readManifestFromGlobal(scope);
  if (existing) {
    return existing;
  }
  const manifest = buildBrowserFaviconManifest(resolveBaseSvg(scope));
  assignManifestToGlobal(scope, manifest);
  return manifest;
};

export const createBrowserFaviconRegistry = (
  scope: BrowserGlobalScope = globalThis as BrowserGlobalScope,
): FaviconRegistry => {
  const manifest = ensureBrowserFaviconManifest(scope);
  return createFaviconRegistry(manifest);
};

export const getBrowserFaviconManifestGlobalKey = () => GLOBAL_KEY;

export const getBrowserFaviconBaseSvgGlobalKey = () => BASE_SVG_KEY;
