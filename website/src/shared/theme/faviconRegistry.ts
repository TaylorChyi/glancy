/**
 * 背景：
 *  - ThemeContext 过去直接依赖具体 SVG 路径，难以在主题扩展或更换品牌资产时复用；
 *  - 缺失资源会导致构建失败，且排查入口不集中。
 * 目的：
 *  - 抽象可复用的 favicon 注册表，集中管理主题到资源的映射，并提供回退策略。
 * 关键决策与取舍：
 *  - 采用注册表模式封装解析逻辑，而将资源注入交由调用方处理（便于多租户或按品牌切换）；
 *  - 保持同步 API，避免在 favicon 这类轻量资源上引入懒加载复杂度。
 * 影响范围：
 *  - ThemeContext 及潜在引用 favicon 注册表的组件或服务。
 * 演进与TODO：
 *  - 后续可扩展为多租户策略或增加事件钩子，用于监控 fallback 命中率。
 */

const FALLBACK_KEY = "default";

export type FaviconManifest = Record<string, string>;

type RegistryOptions = {
  manifest: FaviconManifest;
  fallbackKey?: string;
};

export class FaviconRegistry {
  private readonly manifest: FaviconManifest;

  private readonly fallbackKey: string;

  constructor(options: RegistryOptions) {
    const { manifest, fallbackKey = FALLBACK_KEY } = options;
    if (!manifest[fallbackKey]) {
      throw new Error(
        `favicon manifest missing fallback entry \"${fallbackKey}\"`,
      );
    }
    this.manifest = { ...manifest };
    this.fallbackKey = fallbackKey;
  }

  /**
   * 意图：根据主题解析 favicon 资源并在未命中时回退。
   * 输入：theme - ThemeContext 的主题标识，可空。
   * 输出：对应的 favicon 资源路径。
   * 流程：
   *  1) 标准化主题标识；
   *  2) 查找注册表；
   *  3) 缺失时使用 fallback。
   * 错误处理：未命中时不会抛错，而是回退；可在未来加入指标或日志钩子。
   * 复杂度：O(1)。
   */
  resolve(theme?: string | null): string {
    const normalized =
      typeof theme === "string" ? theme.trim().toLowerCase() : "";
    return this.manifest[normalized] ?? this.manifest[this.fallbackKey];
  }

  snapshot(): FaviconManifest {
    return { ...this.manifest };
  }
}

export function createFaviconRegistry(
  manifest: FaviconManifest,
): FaviconRegistry {
  return new FaviconRegistry({ manifest });
}
