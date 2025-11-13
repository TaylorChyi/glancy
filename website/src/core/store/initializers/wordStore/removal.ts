import { buildEntryRemoval } from "./entry.js";
import {
  resolveActiveVersionId,
} from "./versionMerging.js";
import {
  wordStoreRegistry as registry,
  type WordCacheRecord,
  type WordIdentifier,
  type WordVersion,
} from "./registry.js";
import type {
  NullableVersionId,
  WordStoreState,
} from "./types.js";

const normalizeVersionIdentifiers = (
  versionIds?: NullableVersionId | NullableVersionId[],
): WordIdentifier[] => {
  if (versionIds == null) {
    return [];
  }
  const ids = Array.isArray(versionIds) ? versionIds : [versionIds];
  return ids
    .map((candidate) => registry.normalizeId(candidate ?? null))
    .filter((candidate): candidate is WordIdentifier => Boolean(candidate));
};

const resolveNormalizedIdSet = (
  versionIds?: NullableVersionId | NullableVersionId[],
) => new Set(normalizeVersionIdentifiers(versionIds));

const filterVersionsByIds = (
  versions: WordVersion[],
  normalizedIds: Set<WordIdentifier>,
) => versions.filter((version) => !normalizedIds.has(version.id));

const computeNextActiveAfterRemoval = (
  target: WordCacheRecord,
  filtered: WordVersion[],
  normalizedIds: Set<WordIdentifier>,
) => {
  const shouldResolveActive = normalizedIds.has(target.activeVersionId ?? "");
  if (!shouldResolveActive) {
    return target.activeVersionId;
  }
  return resolveActiveVersionId({
    versions: filtered,
    preferredId: null,
    current: { ...target, activeVersionId: null },
    metadata: target.metadata ?? {},
  });
};

const resolveFilteredVersions = (
  target: WordCacheRecord,
  versionIds?: NullableVersionId | NullableVersionId[],
) => {
  if (versionIds == null) {
    return {
      shouldRemove: true,
      filtered: [] as WordVersion[],
      normalizedIds: new Set<WordIdentifier>(),
    };
  }
  const normalizedIds = resolveNormalizedIdSet(versionIds);
  const filtered = filterVersionsByIds(target.versions, normalizedIds);
  return {
    shouldRemove: !filtered.length,
    filtered,
    normalizedIds,
  };
};

export const buildRemoveVersionsResult = (
  state: WordStoreState,
  termKey: string,
  versionIds?: NullableVersionId | NullableVersionId[],
) => {
  if (!termKey) return {};
  const target = state.entries[termKey];
  if (!target) return {};
  const { shouldRemove, filtered, normalizedIds } = resolveFilteredVersions(
    target,
    versionIds,
  );
  if (shouldRemove) return buildEntryRemoval(state.entries, termKey);
  const nextActiveId =
    computeNextActiveAfterRemoval(target, filtered, normalizedIds) ??
    target.activeVersionId ??
    null;
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
};
