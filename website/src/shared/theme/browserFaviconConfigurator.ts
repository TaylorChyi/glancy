/**
 * 背景：
 *  - 旧实现直接在 ThemeContext 中根据网页主题切换 favicon，无法覆盖浏览器自身主题变更；
 *  - index.html 内联脚本重复维护逻辑，易于漂移并缺乏测试覆盖。
 * 目的：
 *  - 以配置器模式集中管理浏览器页签 favicon 的浅深色切换，确保与浏览器主题解耦；
 * 关键决策与取舍：
 *  - 采用“配置器 + 注册表”的组合模式：注册表负责资产映射，配置器负责监听浏览器主题并应用（相较于一次性脚本更易扩展及测试）；
 *  - 依赖 matchMedia 构建观察者（Observer）模式，避免手动轮询，同时在缺失能力的环境中安全回退；
 * 影响范围：
 *  - 浏览器 favicon 切换逻辑、ThemeProvider 初始化流程、与 favicon 相关的单测；
 * 演进与TODO：
 *  - 可扩展更多浏览器特性（如 high-contrast）或允许多 favicon 节点，通过策略模式封装匹配规则。
 */
import { FaviconRegistry } from "@shared/theme/faviconRegistry";

const DEFAULT_LINK_ID = "favicon";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export type BrowserFaviconConfiguratorOptions = {
  linkId?: string;
  registry: FaviconRegistry;
  matchMedia?: ((query: string) => MediaQueryList) | null;
  document?: Document | null;
};

type BrowserColorScheme = "dark" | "light";

type MediaChangeListener = (event: MediaQueryListEvent) => void;

export class BrowserFaviconConfigurator {
  private readonly linkId: string;

  private readonly registry: FaviconRegistry;

  private readonly matchMedia: ((query: string) => MediaQueryList) | null;

  private readonly document: Document | null;

  private mediaQueryList: MediaQueryList | null = null;

  private listener: MediaChangeListener | null = null;

  constructor(options: BrowserFaviconConfiguratorOptions) {
    const {
      linkId = DEFAULT_LINK_ID,
      registry,
      matchMedia = null,
      document: doc = null,
    } = options;
    this.linkId = linkId;
    this.registry = registry;
    this.matchMedia = matchMedia;
    this.document = doc;
  }

  /**
   * 意图：启动配置器并根据浏览器主题应用 favicon。
   * 输入：无（依赖构造时注入的 registry/matchMedia/document）。
   * 输出：无显式返回，通过修改 DOM 产生副作用。
   * 流程：
   *  1) 查找目标 link 元素；
   *  2) 依据媒体查询结果确定当前配色；
   *  3) 应用 favicon 并注册监听，实现实时切换。
   * 错误处理：
   *  - 若环境缺失 document 或 link 节点，则直接回退，不抛出异常；
   *  - 若 matchMedia 不存在，则默认使用亮色资源。
   * 复杂度：O(1)，仅涉及常量级 DOM 查询与监听绑定。
   */
  start(): void {
    const targetDocument = this.document;
    if (!targetDocument) {
      return;
    }

    const element = targetDocument.getElementById(this.linkId);
    if (!(element instanceof HTMLLinkElement)) {
      return;
    }

    const applyScheme = (scheme: BrowserColorScheme) => {
      element.href = this.registry.resolve(scheme);
      element.dataset.browserColorScheme = scheme;
    };

    this.stop();

    const mediaQuery = this.matchMedia
      ? this.matchMedia(DARK_MEDIA_QUERY)
      : null;
    const initialScheme: BrowserColorScheme = mediaQuery?.matches
      ? "dark"
      : "light";
    applyScheme(initialScheme);

    if (!mediaQuery) {
      return;
    }

    const handleChange: MediaChangeListener = (event) => {
      applyScheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    this.mediaQueryList = mediaQuery;
    this.listener = handleChange;
  }

  /**
   * 意图：移除媒体查询监听，释放资源，便于热更新或重复初始化。
   * 输入/输出：无。
   * 流程：
   *  1) 若存在已注册的监听器，则解除绑定；
   *  2) 清空内部引用，等待 GC。
   * 错误处理：所有操作安全判空，不抛出异常。
   * 复杂度：O(1)。
   */
  stop(): void {
    if (this.mediaQueryList && this.listener) {
      this.mediaQueryList.removeEventListener("change", this.listener);
    }
    this.mediaQueryList = null;
    this.listener = null;
  }
}

export function createBrowserFaviconConfigurator(
  options: BrowserFaviconConfiguratorOptions,
): BrowserFaviconConfigurator {
  const safeDocument =
    options.document ?? (typeof document !== "undefined" ? document : null);
  const safeMatchMedia =
    options.matchMedia ??
    (typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? (query: string) => window.matchMedia(query)
      : null);

  return new BrowserFaviconConfigurator({
    ...options,
    document: safeDocument,
    matchMedia: safeMatchMedia,
  });
}
