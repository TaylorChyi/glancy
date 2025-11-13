import type { StoreGetter, StoreSetter } from "./wordStore/types.js";
import {
  buildInitialStoreState,
  createRemoveVersionsAction,
  createSetActiveVersionAction,
  createSetVersionsAction,
} from "./wordStore/actions.js";
import {
  wordStoreRegistry,
  type WordCacheRecord,
  type WordIdentifier,
  type WordVersion,
  type WordVersionLike,
  type WordVersionMetadata,
} from "./wordStore/registry.js";
import type {
  NullableVersionId,
  UpsertVersionsOptions,
  WordStoreEntries,
  WordStoreState,
} from "./wordStore/types.js";

export const createWordStoreInitializer = () => (set: StoreSetter, get: StoreGetter) =>
  buildInitialStoreState(set, get);

export type {
  NullableVersionId,
  UpsertVersionsOptions,
  WordCacheRecord,
  WordIdentifier,
  WordVersion,
  WordVersionLike,
  WordVersionMetadata,
  WordStoreEntries,
  WordStoreState,
  StoreSetter,
  StoreGetter,
};

export {
  buildInitialStoreState,
  createRemoveVersionsAction,
  createSetActiveVersionAction,
  createSetVersionsAction,
  wordStoreRegistry,
};
