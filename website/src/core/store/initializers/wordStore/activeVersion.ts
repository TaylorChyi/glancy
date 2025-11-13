import { wordStoreRegistry as registry } from "./registry.js";
import type { NullableVersionId, WordStoreState } from "./types.js";

export const buildActiveVersionResult = (
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
