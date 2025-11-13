import {
  wordStoreRegistry as registry,
  type WordCacheRecord,
  type WordVersion,
  type WordVersionLike,
  type WordVersionMetadata,
} from "./registry.js";
import { buildEntryRemoval } from "./entry.js";
import type {
  NullableVersionId,
  UpsertVersionsOptions,
  WordStoreState,
} from "./types.js";

const resolveNormalizedVersions = (
  versions: (WordVersionLike | null | undefined)[],
) => registry.normalizeVersions(versions ?? []);

const mergeVersions = (
  current: WordCacheRecord | undefined,
  normalized: WordVersion[],
) =>
  current
    ? registry.mergeVersionCollections(current.versions, normalized)
    : normalized;

const mergeMetadata = (
  current: WordCacheRecord | undefined,
  incoming?: WordVersionMetadata | null,
) => registry.mergeMetadata(current?.metadata ?? {}, incoming ?? undefined);

export const resolveActiveVersionId = ({
  versions,
  preferredId,
  current,
  metadata,
}: {
  versions: WordVersion[];
  preferredId: NullableVersionId;
  current: WordCacheRecord | undefined;
  metadata: WordVersionMetadata;
}) =>
  registry.resolveActiveVersionId({
    versions,
    preferredId: preferredId ?? null,
    current,
    metadata,
  }) ?? null;

const buildMergedEntry = (
  current: WordCacheRecord | undefined,
  normalized: WordVersion[],
  options?: UpsertVersionsOptions,
): WordCacheRecord => {
  const mergedVersions = mergeVersions(current, normalized);
  const mergedMetadata = mergeMetadata(current, options?.metadata ?? null);
  const activeVersionId = resolveActiveVersionId({
    versions: mergedVersions,
    preferredId: options?.activeVersionId ?? null,
    current,
    metadata: mergedMetadata,
  });
  return {
    versions: mergedVersions,
    metadata: mergedMetadata,
    activeVersionId,
  };
};

export const buildSetVersionsResult = (
  state: WordStoreState,
  termKey: string,
  versions: (WordVersionLike | null | undefined)[],
  options?: UpsertVersionsOptions,
) => {
  if (!termKey) {
    return {};
  }

  const normalized = resolveNormalizedVersions(versions);
  if (!normalized.length) {
    return buildEntryRemoval(state.entries, termKey);
  }
  const current = state.entries[termKey];
  const merged = buildMergedEntry(current, normalized, options);
  return {
    entries: {
      ...state.entries,
      [termKey]: merged,
    },
  };
};
