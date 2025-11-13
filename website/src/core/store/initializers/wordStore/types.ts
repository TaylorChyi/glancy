import type {
  WordCacheRecord,
  WordVersion,
  WordVersionLike,
  WordVersionMetadata,
} from "./registry.js";

export type NullableVersionId = string | number | null | undefined;

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

export type StoreSetter = (
  updater: (state: WordStoreState) => Partial<WordStoreState>,
) => void;

export type StoreGetter = () => WordStoreState;
