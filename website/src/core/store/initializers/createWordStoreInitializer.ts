import {
  defaultWordVersionRegistry,
  type WordCacheRecord,
  type WordIdentifier,
  type WordVersion,
  type WordVersionLike,
  type WordVersionMetadata,
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
  getEntry: (
    termKey: string,
    versionId?: NullableVersionId,
  ) => WordVersion | undefined;
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

type StoreSetter = (
  updater: (state: WordStoreState) => Partial<WordStoreState>,
) => void;

type StoreGetter = () => WordStoreState;

const buildEntryRemoval = (entries: WordStoreEntries, termKey: string) => ({
  entries: removeEntry(entries, termKey),
});

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

const resolveActiveVersionId = ({
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

const buildSetVersionsResult = (
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
  const mergedVersions = mergeVersions(current, normalized);
  const mergedMetadata = mergeMetadata(current, options?.metadata ?? null);
  const nextActiveId = resolveActiveVersionId({
    versions: mergedVersions,
    preferredId: options?.activeVersionId ?? null,
    current,
    metadata: mergedMetadata,
  });

  return {
    entries: {
      ...state.entries,
      [termKey]: {
        versions: mergedVersions,
        metadata: mergedMetadata,
        activeVersionId: nextActiveId,
      },
    },
  };
};

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

const buildActiveVersionResult = (
  state: WordStoreState,
  termKey: string,
  versionId: NullableVersionId,
) => {
  if (!termKey) {
    return {};
  }
  const entry = state.entries[termKey];
  if (!entry) {
    return {};
  }

  const normalized = registry.normalizeId(versionId ?? null);
  const nextActive = normalized ?? entry.activeVersionId ?? null;
  return {
    entries: {
      ...state.entries,
      [termKey]: {
        ...entry,
        activeVersionId: nextActive,
      },
    },
  };
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

const buildRemoveVersionsResult = (
  state: WordStoreState,
  termKey: string,
  versionIds?: NullableVersionId | NullableVersionId[],
) => {
  if (!termKey) {
    return {};
  }
  const target = state.entries[termKey];
  if (!target) {
    return {};
  }
  if (versionIds == null) {
    return buildEntryRemoval(state.entries, termKey);
  }

  const normalizedIds = resolveNormalizedIdSet(versionIds);
  const filtered = filterVersionsByIds(target.versions, normalizedIds);

  if (!filtered.length) {
    return buildEntryRemoval(state.entries, termKey);
  }

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

const applySetVersionsUpdate = (
  set: StoreSetter,
  termKey: string,
  versions: (WordVersionLike | null | undefined)[],
  options?: UpsertVersionsOptions,
) => set((state) => buildSetVersionsResult(state, termKey, versions, options));

const createSetVersionsAction =
  (set: StoreSetter) =>
  (
    termKey: string,
    versions: (WordVersionLike | null | undefined)[],
    options?: UpsertVersionsOptions,
  ) =>
    applySetVersionsUpdate(set, termKey, versions, options);

const createSetActiveVersionAction =
  (set: StoreSetter) => (termKey: string, versionId: NullableVersionId) =>
    set((state) => buildActiveVersionResult(state, termKey, versionId));

const applyRemoveVersionsUpdate = (
  set: StoreSetter,
  termKey: string,
  versionIds?: NullableVersionId | NullableVersionId[],
) => set((state) => buildRemoveVersionsResult(state, termKey, versionIds));

const createRemoveVersionsAction =
  (set: StoreSetter) =>
  (termKey: string, versionIds?: NullableVersionId | NullableVersionId[]) =>
    applyRemoveVersionsUpdate(set, termKey, versionIds);

const buildInitialStoreState = (set: StoreSetter, get: StoreGetter) => ({
  entries: {},
  setVersions: createSetVersionsAction(set),
  setActiveVersion: createSetActiveVersionAction(set),
  removeVersions: createRemoveVersionsAction(set),
  getEntry: (termKey, versionId) => {
    const entry = get().entries[termKey];
    return registry.selectVersion(entry, versionId ?? null);
  },
  getRecord: (termKey) => get().entries[termKey],
  clear: () => set({ entries: {} }),
});

export const createWordStoreInitializer = () => (set: StoreSetter, get: StoreGetter) =>
  buildInitialStoreState(set, get);

export type {
  WordVersion,
  WordCacheRecord,
  WordIdentifier,
  WordVersionMetadata,
};

export const wordStoreRegistry = registry;
