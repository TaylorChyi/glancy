import { createPersistentStore } from "./createPersistentStore.ts";
import { pickState } from "./persistUtils.ts";

const normalizeVersionId = (version) => {
  if (!version) return undefined;
  return (
    version.id ??
    version.versionId ??
    version.metadata?.id ??
    version.metadata?.versionId ??
    undefined
  );
};

const normalizeVersions = (versions = []) =>
  versions.filter(Boolean).map((version, index) => {
    const id = normalizeVersionId(version) ?? `auto-${index}`;
    return { ...version, id };
  });

const parseTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

const resolveLatestVersionId = (versions = [], metadata) => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }

  const metadataId = metadata?.latestVersionId ?? metadata?.activeVersionId;
  if (metadataId) {
    const matched = versions.find(
      (version) => String(version.id) === String(metadataId),
    );
    if (matched) {
      return matched.id;
    }
  }

  const ranked = [...versions]
    .map((version, index) => ({
      version,
      index,
      timestamp: parseTimestamp(version.createdAt),
    }))
    .sort((a, b) => {
      if (a.timestamp == null && b.timestamp == null) {
        return a.index - b.index;
      }
      if (a.timestamp == null) return 1;
      if (b.timestamp == null) return -1;
      if (a.timestamp === b.timestamp) {
        return a.index - b.index;
      }
      return b.timestamp - a.timestamp;
    });

  return ranked[0]?.version?.id ?? versions[0]?.id ?? null;
};

const resolveActiveVersionId = (currentEntry, versions, preferredId) => {
  if (preferredId) return preferredId;
  if (
    currentEntry?.activeVersionId &&
    versions.some((v) => v.id === currentEntry.activeVersionId)
  ) {
    return currentEntry.activeVersionId;
  }
  return resolveLatestVersionId(versions, currentEntry?.metadata);
};

const selectVersion = (entry, versionId) => {
  if (!entry || !Array.isArray(entry.versions) || entry.versions.length === 0)
    return undefined;
  const targetId = versionId ?? entry.activeVersionId;
  if (!targetId) return entry.versions[entry.versions.length - 1];
  return entry.versions.find(
    (version) => String(version.id) === String(targetId),
  );
};

export const useWordStore = createPersistentStore({
  key: "wordCache",
  initializer: (set, get) => ({
    entries: {},
    setVersions: (termKey, versions, { activeVersionId, metadata } = {}) =>
      set((state) => {
        if (!termKey) return {};
        const normalized = normalizeVersions(versions);
        if (normalized.length === 0) {
          const { [termKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        }
        const current = state.entries[termKey];
        const nextActiveId = resolveActiveVersionId(
          current,
          normalized,
          activeVersionId,
        );
        return {
          entries: {
            ...state.entries,
            [termKey]: {
              versions: normalized,
              activeVersionId: nextActiveId,
              metadata: {
                ...(current?.metadata ?? {}),
                ...(metadata ?? {}),
              },
            },
          },
        };
      }),
    setActiveVersion: (termKey, versionId) =>
      set((state) => {
        if (!termKey) return {};
        const target = state.entries[termKey];
        if (!target) return {};
        if (target.activeVersionId === versionId) return {};
        return {
          entries: {
            ...state.entries,
            [termKey]: {
              ...target,
              activeVersionId: versionId,
            },
          },
        };
      }),
    removeVersions: (termKey, versionIds) =>
      set((state) => {
        if (!termKey) return {};
        const target = state.entries[termKey];
        if (!target) return {};
        if (!versionIds) {
          const { [termKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        }
        const ids = new Set(
          (Array.isArray(versionIds) ? versionIds : [versionIds]).map(String),
        );
        const filtered = target.versions.filter(
          (version) => !ids.has(String(version.id)),
        );
        if (filtered.length === 0) {
          const { [termKey]: _removed, ...rest } = state.entries;
          return { entries: rest };
        }
        const nextActiveId = ids.has(String(target.activeVersionId))
          ? resolveActiveVersionId(
              { ...target, activeVersionId: null },
              filtered,
            )
          : target.activeVersionId;
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
      }),
    getEntry: (termKey, versionId) => {
      const entry = get().entries[termKey];
      return selectVersion(entry, versionId);
    },
    getRecord: (termKey) => get().entries[termKey],
    clear: () => set({ entries: {} }),
  }),
  persistOptions: {
    partialize: pickState(["entries"]),
  },
});

export const __private__ = {
  normalizeVersions,
  resolveActiveVersionId,
  selectVersion,
  resolveLatestVersionId,
};
