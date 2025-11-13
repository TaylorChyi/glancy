import {
  defaultWordVersionRegistry,
  type WordCacheRecord,
  type WordIdentifier,
  type WordVersion,
  type WordVersionLike,
  type WordVersionMetadata,
  WordVersionRegistry,
} from "@core/words/wordVersionRegistry.js";

export const wordStoreRegistry: WordVersionRegistry = defaultWordVersionRegistry;

export type {
  WordCacheRecord,
  WordIdentifier,
  WordVersion,
  WordVersionLike,
  WordVersionMetadata,
};
