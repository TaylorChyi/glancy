import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import {
  createWordStoreInitializer,
  wordStoreRegistry,
  type WordCacheRecord,
  type WordIdentifier,
  type WordStoreState,
  type WordVersion,
  type WordStoreEntries,
  type UpsertVersionsOptions,
} from "./initializers/createWordStoreInitializer.ts";

export const useWordStore = createPersistentStore<WordStoreState>({
  key: "wordCache",
  initializer: createWordStoreInitializer(),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});

export type {
  WordVersion,
  WordCacheRecord,
  WordIdentifier,
  WordStoreState,
  WordStoreEntries,
  UpsertVersionsOptions,
};

export const __private__ = {
  registry: wordStoreRegistry,
};
