/**
 * 背景：
 *  - 旧实现将词条版本合并、激活策略与状态读写紧耦合，难以扩展也易造成逻辑分叉。
 * 目的：
 *  - 借助领域服务 WordVersionRegistry 管理业务规则，store 专注于持久化与对外 API，减少冲突覆盖风险。
 * 关键决策与取舍：
 *  - 采用策略模式将激活版本的决策注入，后续可按业务替换；同时保持 API 向后兼容便于渐进迁移。
 * 影响范围：
 *  - 所有消费 useWordStore 的特性、hooks 与页面；同时为历史记录等模块提供更稳健的缓存语义。
 * 演进与TODO：
 *  - 可暴露派生 selector，以便 UI 层直接消费规范化结构；必要时支持多租户/多词典隔离。
 */
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import {
  defaultWordVersionRegistry,
  type WordCacheRecord,
  type WordVersion,
  type WordVersionMetadata,
  type WordVersionLike,
  type WordIdentifier,
  WordVersionRegistry,
} from "@core/words/wordVersionRegistry.js";

const registry: WordVersionRegistry = defaultWordVersionRegistry;

type NullableVersionId = string | number | null | undefined;

export interface UpsertVersionsOptions {
  activeVersionId?: NullableVersionId;
  metadata?: WordVersionMetadata | null;
}

export interface WordStoreEntries {
  [termKey: string]: WordCacheRecord | undefined;
}

export interface WordStoreState {
  entries: WordStoreEntries;
  setVersions: (
    termKey: string,
    versions: (WordVersionLike | null | undefined)[],
    options?: UpsertVersionsOptions,
  ) => void;
  setActiveVersion: (termKey: string, versionId: NullableVersionId) => void;
  removeVersions: (
    termKey: string,
    versionIds?: NullableVersionId | NullableVersionId[],
  ) => void;
  getEntry: (termKey: string, versionId?: NullableVersionId) => WordVersion | undefined;
  getRecord: (termKey: string) => WordCacheRecord | undefined;
  clear: () => void;
}

const removeEntry = (
  entries: WordStoreEntries,
  termKey: string,
): WordStoreEntries => {
  const { [termKey]: _removed, ...rest } = entries;
  return rest;
};

export const useWordStore = createPersistentStore<WordStoreState>({
  key: "wordCache",
  initializer: (set, get) => ({
    entries: {},
    setVersions: (termKey, versions, options) =>
      set((state) => {
        if (!termKey) {
          return {};
        }

        const normalized = registry.normalizeVersions(versions ?? []);
        if (normalized.length === 0) {
          return { entries: removeEntry(state.entries, termKey) };
        }

        const current = state.entries[termKey];
        const mergedVersions = current
          ? registry.mergeVersionCollections(current.versions, normalized)
          : normalized;

        const mergedMetadata = registry.mergeMetadata(
          current?.metadata ?? {},
          options?.metadata ?? undefined,
        );

        const nextActiveId =
          registry.resolveActiveVersionId({
            versions: mergedVersions,
            preferredId: options?.activeVersionId ?? null,
            current,
            metadata: mergedMetadata,
          }) ?? null;

        return {
          entries: {
            ...state.entries,
            [termKey]: {
              versions: mergedVersions,
              activeVersionId: nextActiveId,
              metadata: mergedMetadata,
            },
          },
        };
      }),
    setActiveVersion: (termKey, versionId) =>
      set((state) => {
        const target = state.entries[termKey];
        if (!termKey || !target) {
          return {};
        }
        const normalizedId = registry.normalizeId(versionId) ?? null;
        if (normalizedId === target.activeVersionId) {
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
        if (!termKey) {
          return {};
        }
        const target = state.entries[termKey];
        if (!target) {
          return {};
        }

        if (versionIds == null) {
          return { entries: removeEntry(state.entries, termKey) };
        }

        const ids = Array.isArray(versionIds) ? versionIds : [versionIds];
        const normalizedIds = new Set(
          ids
            .map((id) => registry.normalizeId(id))
            .filter((id): id is WordIdentifier => Boolean(id)),
        );

        const filtered = target.versions.filter(
          (version) => !normalizedIds.has(version.id),
        );

        if (filtered.length === 0) {
          return { entries: removeEntry(state.entries, termKey) };
        }

        const shouldResolveActive = normalizedIds.has(target.activeVersionId ?? "");
        const nextActiveId = shouldResolveActive
          ? registry.resolveActiveVersionId({
              versions: filtered,
              preferredId: null,
              current: { ...target, activeVersionId: null },
              metadata: target.metadata,
            })
          : target.activeVersionId;

        return {
          entries: {
            ...state.entries,
            [termKey]: {
              ...target,
              versions: filtered,
              activeVersionId: nextActiveId ?? target.activeVersionId ?? null,
            },
          },
        };
      }),
    getEntry: (termKey, versionId) => {
      const entry = get().entries[termKey];
      return registry.selectVersion(entry, versionId ?? null);
    },
    getRecord: (termKey) => get().entries[termKey],
    clear: () => set({ entries: {} }),
  }),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});

export type { WordVersion, WordCacheRecord, WordIdentifier };

export const __private__ = {
  registry,
};
