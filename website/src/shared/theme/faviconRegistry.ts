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
