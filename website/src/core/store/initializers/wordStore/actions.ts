import { wordStoreRegistry as registry, type WordVersionLike } from "./registry.js";
import type {
  NullableVersionId,
  StoreGetter,
  StoreSetter,
  UpsertVersionsOptions,
  WordStoreState,
} from "./types.js";
import { buildSetVersionsResult } from "./versionMerging.js";
import { buildActiveVersionResult } from "./activeVersion.js";
import { buildRemoveVersionsResult } from "./removal.js";

const applySetVersionsUpdate = (
  set: StoreSetter,
  termKey: string,
  versions: (WordVersionLike | null | undefined)[],
  options?: UpsertVersionsOptions,
) => set((state) => buildSetVersionsResult(state, termKey, versions, options));

export const createSetVersionsAction = (set: StoreSetter) =>
  (
    termKey: string,
    versions: (WordVersionLike | null | undefined)[],
    options?: UpsertVersionsOptions,
  ) => applySetVersionsUpdate(set, termKey, versions, options);

export const createSetActiveVersionAction = (set: StoreSetter) =>
  (termKey: string, versionId: NullableVersionId) =>
    set((state) => buildActiveVersionResult(state, termKey, versionId));

const applyRemoveVersionsUpdate = (
  set: StoreSetter,
  termKey: string,
  versionIds?: NullableVersionId | NullableVersionId[],
) => set((state) => buildRemoveVersionsResult(state, termKey, versionIds));

export const createRemoveVersionsAction = (set: StoreSetter) =>
  (termKey: string, versionIds?: NullableVersionId | NullableVersionId[]) =>
    applyRemoveVersionsUpdate(set, termKey, versionIds);

export const buildInitialStoreState = (
  set: StoreSetter,
  get: StoreGetter,
): WordStoreState => ({
  entries: {},
  setVersions: createSetVersionsAction(set),
  setActiveVersion: createSetActiveVersionAction(set),
  removeVersions: createRemoveVersionsAction(set),
  getEntry: (termKey: string, versionId?: NullableVersionId) => {
    const entry = get().entries[termKey];
    return registry.selectVersion(entry, versionId ?? null);
  },
  getRecord: (termKey) => get().entries[termKey],
  clear: () => set({ entries: {} }),
});
