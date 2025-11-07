import ICONS from "@assets/icons.js";
import type { ResolvedTheme } from "@shared/theme/mode";

export type IconVariantResource = {
  url: string | null;
  inline: string | null;
};

export type IconModuleEntry = {
  single?: IconVariantResource;
  [variant: string]: IconVariantResource | undefined;
};

const hasRenderablePayload = (resource: IconVariantResource | undefined) => {
  if (!resource) {
    return false;
  }
  return Boolean(resource.inline) || Boolean(resource.url);
};

interface IconVariantStrategy {
  resolve(
    entry: IconModuleEntry | undefined,
    theme: ResolvedTheme,
  ): IconVariantResource | null;
}

class ThemedVariantStrategy implements IconVariantStrategy {
  /**
   * 意图：优先返回与当前主题匹配的资源变体。
   * 输入：entry - 图标资源记录；theme - 已解析主题。
   * 输出：命中则返回具体资源地址，否则为 null。
   * 流程：
   *  1) 直接尝试当前主题对应变体；
   *  2) 若缺失，则尝试对立主题的资源以保持兼容；
   * 错误处理：全部 miss 时返回 null，由后续策略接管。
   * 复杂度：O(1)。
   */
  resolve(
    entry: IconModuleEntry | undefined,
    theme: ResolvedTheme,
  ): IconVariantResource | null {
    if (!entry) {
      return null;
    }

    const direct = entry[theme];
    if (hasRenderablePayload(direct)) {
      return direct;
    }

    const fallbackVariant = theme === "dark" ? "light" : "dark";
    const fallback = entry[fallbackVariant];
    return hasRenderablePayload(fallback) ? (fallback ?? null) : null;
  }
}

class SingleVariantStrategy implements IconVariantStrategy {
  /**
   * 意图：兼容仅提供 single 资源的历史图标。
   * 输入：entry - 图标资源记录。
   * 输出：若存在 single 字段则返回其资源地址，否则 null。
   * 流程：直接读取 entry.single。
   * 错误处理：缺失则返回 null。
   * 复杂度：O(1)。
   */
  resolve(
    entry: IconModuleEntry | undefined,
    _theme: ResolvedTheme,
  ): IconVariantResource | null {
    void _theme;
    if (!entry) {
      return null;
    }
    const single = entry.single ?? null;
    return hasRenderablePayload(single) ? single : null;
  }
}

export class IconSourceResolver {
  constructor(
    private readonly registry: Record<string, IconModuleEntry>,
    private readonly strategies: IconVariantStrategy[],
  ) {}

  /**
   * 意图：按策略顺序解析图标资源，直至找到第一个可用地址。
   * 输入：name - 图标名称；theme - 当前解析主题。
   * 输出：命中时返回资源地址，否则 null。
   * 流程：
   *  1) 提取图标记录；
   *  2) 遍历策略列表并执行；
   *  3) 首个返回值非空的策略即终止循环。
   * 错误处理：找不到记录时返回 null，交由调用方处理回退。
   * 复杂度：O(n)，n 为策略数量（当前为常量 2）。
   */
  resolve(name: string, theme: ResolvedTheme): IconVariantResource | null {
    const entry = this.registry[name];
    for (const strategy of this.strategies) {
      const resolved = strategy.resolve(entry, theme);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }
}

const defaultStrategies: IconVariantStrategy[] = [
  new ThemedVariantStrategy(),
  new SingleVariantStrategy(),
];

export const iconSourceResolver = new IconSourceResolver(
  ICONS as Record<string, IconModuleEntry>,
  defaultStrategies,
);
