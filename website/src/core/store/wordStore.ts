/**
 * 背景：
 *  - 词条缓存原以 JavaScript 实现，缺乏显式类型与统一 key 管理，导致版本字段不清晰且难以在演进中发现冲突。
 * 目的：
 *  - 以 TypeScript 重构词条 Store，搭配集中式 key 注册，保证版本结构与操作语义可组合、可推断。
 * 关键决策与取舍：
 *  - 采用 Registry + 持久化 Store 模式：通过 storeKeys 导入 key，避免魔法字符串；
 *  - 保留函数式不可变更新，拒绝在 Setter 内写入副作用，确保 Zustand 中间件可预测；
 *  - 引入显式类型（WordVersion、WordStoreEntry），换取严格性并辅助 IDE 自动补全。
 * 影响范围：
 *  - 依赖 useWordStore 的查询、偏好与测试均会受益于类型提示，需更新引用路径的扩展名。
 * 演进与TODO：
 *  - TODO: 当后端支持增量同步时，可扩展版本结构加入 checksum 与来源标识；
 *  - TODO: 可结合数据治理策略在此处承载自动清理策略，避免无界增长。
 */

import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { STORE_KEYS } from "./storeKeys.js";

export type WordVersionMetadata = {
  readonly id?: string | number | null;
  readonly versionId?: string | number | null;
  readonly latestVersionId?: string | number | null;
  readonly activeVersionId?: string | number | null;
  readonly [key: string]: unknown;
} | null;

export type WordVersionPayload = {
  readonly id?: string | number | null;
  readonly versionId?: string | number | null;
  readonly createdAt?: string | null;
  readonly metadata?: WordVersionMetadata;
  readonly [key: string]: unknown;
};

export type WordVersion = Omit<WordVersionPayload, "id"> & {
  readonly id: string;
};

export type WordStoreEntry = {
  readonly versions: WordVersion[];
  readonly activeVersionId: string | null;
  readonly metadata: Record<string, unknown>;
};

type WordStoreEntries = Record<string, WordStoreEntry>;

type SetVersionsOptions = {
  readonly activeVersionId?: string | number | null;
  readonly metadata?: Record<string, unknown> | null;
};

interface WordState {
  entries: WordStoreEntries;
  setVersions: (
    termKey: string,
    versions: readonly WordVersionPayload[] | null | undefined,
    options?: SetVersionsOptions,
  ) => void;
  setActiveVersion: (termKey: string, versionId: string | null) => void;
  removeVersions: (
    termKey: string,
    versionIds: readonly (string | number)[] | string | number | null,
  ) => void;
  getEntry: (termKey: string, versionId?: string | null) => WordVersion | undefined;
  getRecord: (termKey: string) => WordStoreEntry | undefined;
  clear: () => void;
}

const normalizeVersionId = (
  version: WordVersionPayload | null | undefined,
): string | undefined => {
  if (!version) return undefined;
  const candidate =
    version.id ??
    version.versionId ??
    version.metadata?.id ??
    version.metadata?.versionId ??
    undefined;
  return candidate == null ? undefined : String(candidate);
};

const normalizeVersions = (
  versions: readonly WordVersionPayload[] | null | undefined = [],
): WordVersion[] =>
  (versions ?? [])
    .filter((candidate): candidate is WordVersionPayload => Boolean(candidate))
    .map((candidate, index) => ({
      ...candidate,
      id: normalizeVersionId(candidate) ?? `auto-${index}`,
    }));

const mergeVersionCollections = (
  existing: readonly WordVersion[] = [],
  incoming: readonly WordVersion[] = [],
): WordVersion[] => {
  if (incoming.length === 0) {
    return [...existing];
  }

  const nextOrder: string[] = [];
  const registry = new Map<string, WordVersion>();

  const register = (candidate: WordVersion | null | undefined, preferIncoming: boolean) => {
    if (!candidate) return;
    const key = String(candidate.id);
    const stored = registry.get(key);
    if (!stored) {
      registry.set(key, { ...candidate });
      nextOrder.push(key);
      return;
    }
    const merged = preferIncoming
      ? { ...stored, ...candidate }
      : { ...candidate, ...stored };
    registry.set(key, merged);
  };

  incoming.forEach((version) => {
    register(version, true);
  });

  existing.forEach((version) => {
    register(version, false);
  });

  return nextOrder.map((key) => registry.get(key)!).filter(Boolean);
};

const parseTimestamp = (value: unknown): number | null => {
  if (!value) return null;
  const date = new Date(value as string);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

type CollectionMetadata = {
  readonly latestVersionId?: string | number | null;
  readonly activeVersionId?: string | number | null;
  readonly [key: string]: unknown;
};

const resolveLatestVersionId = (
  versions: readonly WordVersion[] | null | undefined,
  metadata: CollectionMetadata | null | undefined,
): string | null => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }

  const metadataId = metadata?.latestVersionId ?? metadata?.activeVersionId;
  if (metadataId != null) {
    const matched = versions.find(
      (version) => String(version.id) === String(metadataId),
    );
    if (matched) {
      return matched.id;
    }
  }

  const ranked = [...versions]
    .map((version, index) => ({
      version,
      index,
      timestamp: parseTimestamp(version.createdAt),
    }))
    .sort((a, b) => {
      if (a.timestamp == null && b.timestamp == null) {
        return a.index - b.index;
      }
      if (a.timestamp == null) return 1;
      if (b.timestamp == null) return -1;
      if (a.timestamp === b.timestamp) {
        return a.index - b.index;
      }
      return b.timestamp - a.timestamp;
    });

  return ranked[0]?.version?.id ?? versions[0]?.id ?? null;
};

const resolveActiveVersionId = (
  currentEntry: WordStoreEntry | undefined,
  versions: readonly WordVersion[],
  preferredId?: string | number | null,
): string | null => {
  if (preferredId != null) return String(preferredId);
  if (
    currentEntry?.activeVersionId &&
    versions.some((version) => version.id === currentEntry.activeVersionId)
  ) {
    return currentEntry.activeVersionId;
  }
  return resolveLatestVersionId(versions, currentEntry?.metadata ?? null);
};

const selectVersion = (
  entry: WordStoreEntry | undefined,
  versionId: string | number | null | undefined,
): WordVersion | undefined => {
  if (!entry || entry.versions.length === 0) {
    return undefined;
  }
  const targetId = versionId != null ? String(versionId) : entry.activeVersionId;
  if (!targetId) {
    return entry.versions[entry.versions.length - 1];
  }
  return entry.versions.find((version) => String(version.id) === targetId);
};

export const useWordStore = createPersistentStore<WordState>({
  key: STORE_KEYS.WORD_CACHE,
  initializer: (set, get) => ({
    entries: {},
    setVersions: (termKey, versions, options) =>
      set((state) => {
        if (!termKey) return {};
        const normalized = normalizeVersions(versions ?? []);
        if (normalized.length === 0) {
          const { [termKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        }
        const current = state.entries[termKey];
        const versionsToPersist = current
          ? mergeVersionCollections(current.versions, normalized)
          : normalized;
        const nextActiveId = resolveActiveVersionId(
          current,
          versionsToPersist,
          options?.activeVersionId ?? null,
        );
        const nextMetadata = {
          ...(current?.metadata ?? {}),
          ...(options?.metadata ?? {}),
        } as Record<string, unknown>;
        return {
          entries: {
            ...state.entries,
            [termKey]: {
              versions: versionsToPersist,
              activeVersionId: nextActiveId,
              metadata: nextMetadata,
            },
          },
        };
      }),
    setActiveVersion: (termKey, versionId) =>
      set((state) => {
        if (!termKey) return {};
        const target = state.entries[termKey];
        if (!target) return {};
        const normalizedId = versionId == null ? null : String(versionId);
        if (target.activeVersionId === normalizedId) return {};
        if (
          normalizedId != null &&
          !target.versions.some((version) => version.id === normalizedId)
        ) {
          return {};
        }
        return {
          entries: {
            ...state.entries,
            [termKey]: {
              ...target,
              activeVersionId: normalizedId,
            },
          },
        };
      }),
    removeVersions: (termKey, versionIds) =>
      set((state) => {
        if (!termKey) return {};
        const target = state.entries[termKey];
        if (!target) return {};
        if (versionIds == null) {
          const { [termKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        }
        const ids = Array.isArray(versionIds)
          ? versionIds.map((value) => String(value))
          : [String(versionIds)];
        const idSet = new Set(ids);
        const filtered = target.versions.filter(
          (version) => !idSet.has(String(version.id)),
        );
        if (filtered.length === 0) {
          const { [termKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        }
        const nextActiveId = idSet.has(String(target.activeVersionId))
          ? resolveActiveVersionId({ ...target, activeVersionId: null }, filtered)
          : target.activeVersionId;
        return {
          entries: {
            ...state.entries,
            [termKey]: {
              ...target,
              versions: filtered,
              activeVersionId: nextActiveId,
            },
          },
        };
      }),
    getEntry: (termKey, versionId) => {
      const entry = get().entries[termKey];
      return selectVersion(entry, versionId ?? null);
    },
    getRecord: (termKey) => get().entries[termKey],
    clear: () => set({ entries: {} }),
  }),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});

export const __private__ = {
  normalizeVersions,
  resolveActiveVersionId,
  selectVersion,
  resolveLatestVersionId,
};
