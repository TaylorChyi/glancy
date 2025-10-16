/**
 * 背景：
 *  - 词条缓存逻辑原先散落在 wordStore 中，导致版本合并与激活策略难以复用，且多处手工复制增加冲突概率。
 * 目的：
 *  - 通过集中封装词条版本管理的领域规则，让 store 仅关注状态持久化，提升语义清晰度并利于长期演进。
 * 关键决策与取舍：
 *  - 采用“领域服务 + 策略”组合模式：WordVersionRegistry 提供可组合能力，ActiveVersionStrategy 允许后续根据业务切换策略；
 *    相比继续在 store 内硬编码逻辑，可显著降低页面/特性层与状态实现间的耦合。
 * 影响范围：
 *  - 被 core/store/wordStore 消费，并作为未来词条相关特性共享的领域能力；确保不直接依赖 UI 或网络层。
 * 演进与TODO：
 *  - 可追加基于使用频次的策略实现，或扩展版本分组等高级能力；需在此文件补充取舍说明。
 */

export type WordIdentifier = string;

export interface WordVersionMetadata {
  latestVersionId?: string | number | null;
  activeVersionId?: string | number | null;
  [key: string]: unknown;
}

export interface WordVersionLike {
  id?: string | number | null;
  versionId?: string | number | null;
  metadata?: { id?: string | number | null; versionId?: string | number | null } | null;
  createdAt?: string | Date | null;
  [key: string]: unknown;
}

export interface WordVersion extends WordVersionLike {
  id: WordIdentifier;
}

export interface WordCacheRecord {
  versions: WordVersion[];
  activeVersionId: WordIdentifier | null;
  metadata: WordVersionMetadata;
}

export interface VersionSelectionContext {
  versions: WordVersion[];
  preferredId?: string | number | null;
  current?: WordCacheRecord;
  metadata?: WordVersionMetadata | null;
}

/**
 * 意图：抽象出“如何决定激活版本”的策略，确保未来可以根据业务拓展不同的选择逻辑。
 * 输入：版本上下文（包含候选版本、偏好 ID、现有记录与元数据）。
 * 输出：返回最终应激活的版本 ID，若无可用版本则为 null。
 * 流程：
 *  1) 评估显式偏好；
 *  2) 检查当前缓存是否仍可复用；
 *  3) 根据策略自行降级选择；
 * 错误处理：策略内部自行处理非法值，外部无需捕获。
 * 复杂度：与版本数量线性相关 O(n)。
 */
export interface VersionSelectionStrategy {
  pick(context: VersionSelectionContext): WordIdentifier | null;
}

const normalizeIdentifier = (value?: string | number | null): WordIdentifier | null => {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const parseTimestamp = (value: string | Date | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }

  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

const findMatchingId = (versions: WordVersion[], candidate: WordIdentifier | null) => {
  if (!candidate) {
    return null;
  }
  return versions.some((version) => version.id === candidate) ? candidate : null;
};

/**
 * 背景：默认策略需要兼顾“显式选择”与“时间最新”两种优先级。
 * 取舍：优先返回显式指定的 ID，其次沿用现有激活版本，再退化至最新时间戳。
 */
export class LatestTimestampStrategy implements VersionSelectionStrategy {
  pick({ versions, preferredId, current, metadata }: VersionSelectionContext): WordIdentifier | null {
    if (!versions.length) {
      return null;
    }

    const prioritized = [
      normalizeIdentifier(preferredId),
      normalizeIdentifier(current?.activeVersionId ?? null),
      normalizeIdentifier(metadata?.latestVersionId ?? null),
      normalizeIdentifier(metadata?.activeVersionId ?? null),
    ];

    for (const candidate of prioritized) {
      const matched = findMatchingId(versions, candidate ?? null);
      if (matched) {
        return matched;
      }
    }

    const ranked = versions
      .map((version, index) => ({
        version,
        index,
        timestamp: parseTimestamp(version.createdAt ?? null),
      }))
      .sort((a, b) => {
        if (a.timestamp == null && b.timestamp == null) {
          return a.index - b.index;
        }
        if (a.timestamp == null) {
          return 1;
        }
        if (b.timestamp == null) {
          return -1;
        }
        if (a.timestamp === b.timestamp) {
          return a.index - b.index;
        }
        return b.timestamp - a.timestamp;
      });

    return ranked[0]?.version?.id ?? versions[0]?.id ?? null;
  }
}

/**
 * 意图：集中维护词条版本的增量合并、元数据合流与激活选择逻辑。
 * 输入：创建时可注入自定义策略，默认使用时间优先策略。
 * 输出：提供 normalize/merge/select 等纯函数能力，供状态层调用。
 * 流程：
 *  1) normalizeVersions -> 保证 ID 规范化；
 *  2) mergeVersionCollections -> 聚合新旧版本并消除冲突；
 *  3) resolveActiveVersionId -> 根据策略决定活跃版本；
 * 错误处理：内部使用防御式编程，遇到非法 key 返回空对象，调用方无需额外 try/catch。
 * 复杂度：操作整体保持 O(n)。
 */
export class WordVersionRegistry {
  constructor(private readonly strategy: VersionSelectionStrategy = new LatestTimestampStrategy()) {}

  normalizeVersions(versions: (WordVersionLike | null | undefined)[]): WordVersion[] {
    return versions
      .filter((version): version is WordVersionLike => Boolean(version))
      .map((version, index) => {
        const fallbackId = `auto-${index}`;
        const normalizedId =
          normalizeIdentifier(version.id) ??
          normalizeIdentifier(version.versionId) ??
          normalizeIdentifier(version.metadata?.id ?? null) ??
          normalizeIdentifier(version.metadata?.versionId ?? null) ??
          fallbackId;
        return {
          ...version,
          id: normalizedId,
        };
      });
  }

  mergeVersionCollections(existing: WordVersion[], incoming: WordVersion[]): WordVersion[] {
    if (!incoming.length) {
      return existing;
    }

    const registry = new Map<WordIdentifier, WordVersion>();
    const order: WordIdentifier[] = [];

    const register = (candidate: WordVersion | undefined, preferIncoming: boolean) => {
      if (!candidate) {
        return;
      }
      const key = candidate.id;
      const stored = registry.get(key);
      if (!stored) {
        registry.set(key, { ...candidate });
        order.push(key);
        return;
      }
      const merged = preferIncoming
        ? { ...stored, ...candidate }
        : { ...candidate, ...stored };
      registry.set(key, merged);
    };

    incoming.forEach((version) => register(version, true));
    existing.forEach((version) => register(version, false));

    return order
      .map((key) => registry.get(key))
      .filter((version): version is WordVersion => Boolean(version));
  }

  resolveActiveVersionId(context: VersionSelectionContext): WordIdentifier | null {
    return this.strategy.pick(context);
  }

  normalizeId(value: string | number | null | undefined): WordIdentifier | null {
    return normalizeIdentifier(value ?? null);
  }

  selectVersion(entry: WordCacheRecord | undefined, versionId?: string | number | null): WordVersion | undefined {
    if (!entry || !entry.versions.length) {
      return undefined;
    }

    const preferred = normalizeIdentifier(versionId ?? null) ?? entry.activeVersionId;
    if (preferred) {
      const match = entry.versions.find((version) => version.id === preferred);
      if (match) {
        return match;
      }
    }

    return entry.versions[entry.versions.length - 1];
  }

  resolveLatestVersionId(versions: WordVersion[], metadata?: WordVersionMetadata | null): WordIdentifier | null {
    if (!versions.length) {
      return null;
    }

    const metadataPreferred =
      normalizeIdentifier(metadata?.latestVersionId ?? null) ??
      normalizeIdentifier(metadata?.activeVersionId ?? null);

    if (metadataPreferred) {
      const matched = versions.find((version) => version.id === metadataPreferred);
      if (matched) {
        return matched.id;
      }
    }

    const ranked = versions
      .map((version, index) => ({
        version,
        index,
        timestamp: parseTimestamp(version.createdAt ?? null),
      }))
      .sort((a, b) => {
        if (a.timestamp == null && b.timestamp == null) {
          return a.index - b.index;
        }
        if (a.timestamp == null) {
          return 1;
        }
        if (b.timestamp == null) {
          return -1;
        }
        if (a.timestamp === b.timestamp) {
          return a.index - b.index;
        }
        return b.timestamp - a.timestamp;
      });

    return ranked[0]?.version?.id ?? versions[0]?.id ?? null;
  }

  mergeMetadata(
    existing?: WordVersionMetadata | null,
    incoming?: WordVersionMetadata | null,
  ): WordVersionMetadata {
    if (!existing && !incoming) {
      return {};
    }
    if (incoming === null) {
      return {};
    }
    return {
      ...(existing ?? {}),
      ...(incoming ?? {}),
    };
  }
}

export const defaultWordVersionRegistry = new WordVersionRegistry();

export const __private__ = {
  normalizeIdentifier,
  parseTimestamp,
};
