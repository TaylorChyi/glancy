import type { WordStoreEntries } from "./types.js";

export const removeEntry = (
  entries: WordStoreEntries,
  termKey: string,
): WordStoreEntries => {
  const { [termKey]: _removed, ...rest } = entries;
  return rest;
};

export const buildEntryRemoval = (
  entries: WordStoreEntries,
  termKey: string,
) => ({
  entries: removeEntry(entries, termKey),
});
