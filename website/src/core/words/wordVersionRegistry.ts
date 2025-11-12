import type {
  WordIdentifier,
  WordVersionMetadata,
  WordVersionLike,
  WordVersion,
  WordCacheRecord,
  VersionSelectionContext,
  VersionSelectionStrategy,
} from "./wordVersionRegistry.types.js";
import {
  normalizeIdentifier,
  parseTimestamp,
} from "./internal/versionIdentifierUtils.js";
import { LatestTimestampStrategy } from "./internal/latestTimestampStrategy.js";

export type {
  WordIdentifier,
  WordVersionMetadata,
  WordVersionLike,
  WordVersion,
  WordCacheRecord,
  VersionSelectionContext,
  VersionSelectionStrategy,
} from "./wordVersionRegistry.types.js";

export { LatestTimestampStrategy };

export class WordVersionRegistry {
  constructor(
    private readonly strategy: VersionSelectionStrategy = new LatestTimestampStrategy(),
  ) {}

  normalizeVersions(
    versions: (WordVersionLike | null | undefined)[],
  ): WordVersion[] {
    return versions
      .filter((version): version is WordVersionLike => Boolean(version))
      .map((version, index) => {
        const fallbackId = `auto-${index}`;
        const normalizedId =
          normalizeIdentifier(version.id) ??
          normalizeIdentifier(version.versionId) ??
          normalizeIdentifier(version.metadata?.id ?? null) ??
          normalizeIdentifier(version.metadata?.versionId ?? null) ??
          fallbackId;
        return {
          ...version,
          id: normalizedId,
        };
      });
  }

  mergeVersionCollections(
    existing: WordVersion[],
    incoming: WordVersion[],
  ): WordVersion[] {
    if (!incoming.length) {
      return existing;
    }

    const registry = new Map<WordIdentifier, WordVersion>();
    const order: WordIdentifier[] = [];

    const register = (
      candidate: WordVersion | undefined,
      preferIncoming: boolean,
    ) => {
      if (!candidate) {
        return;
      }
      const key = candidate.id;
      const stored = registry.get(key);
      if (!stored) {
        registry.set(key, { ...candidate });
        order.push(key);
        return;
      }
      const merged = preferIncoming
        ? { ...stored, ...candidate }
        : { ...candidate, ...stored };
      registry.set(key, merged);
    };

    incoming.forEach((version) => register(version, true));
    existing.forEach((version) => register(version, false));

    return order
      .map((key) => registry.get(key))
      .filter((version): version is WordVersion => Boolean(version));
  }

  resolveActiveVersionId(
    context: VersionSelectionContext,
  ): WordIdentifier | null {
    return this.strategy.pick(context);
  }

  normalizeId(
    value: string | number | null | undefined,
  ): WordIdentifier | null {
    return normalizeIdentifier(value ?? null);
  }

  selectVersion(
    entry: WordCacheRecord | undefined,
    versionId?: string | number | null,
  ): WordVersion | undefined {
    if (!entry || !entry.versions.length) {
      return undefined;
    }

    const preferred =
      normalizeIdentifier(versionId ?? null) ?? entry.activeVersionId;
    if (preferred) {
      const match = entry.versions.find((version) => version.id === preferred);
      if (match) {
        return match;
      }
    }

    return entry.versions[entry.versions.length - 1];
  }

  resolveLatestVersionId(
    versions: WordVersion[],
    metadata?: WordVersionMetadata | null,
  ): WordIdentifier | null {
    if (!versions.length) {
      return null;
    }

    const metadataPreferred =
      normalizeIdentifier(metadata?.latestVersionId ?? null) ??
      normalizeIdentifier(metadata?.activeVersionId ?? null);

    if (metadataPreferred) {
      const matched = versions.find(
        (version) => version.id === metadataPreferred,
      );
      if (matched) {
        return matched.id;
      }
    }

    const ranked = versions
      .map((version, index) => ({
        version,
        index,
        timestamp: parseTimestamp(version.createdAt ?? null),
      }))
      .sort((a, b) => {
        if (a.timestamp == null && b.timestamp == null) {
          return a.index - b.index;
        }
        if (a.timestamp == null) {
          return 1;
        }
        if (b.timestamp == null) {
          return -1;
        }
        if (a.timestamp === b.timestamp) {
          return a.index - b.index;
        }
        return b.timestamp - a.timestamp;
      });

    return ranked[0]?.version?.id ?? versions[0]?.id ?? null;
  }

  mergeMetadata(
    existing?: WordVersionMetadata | null,
    incoming?: WordVersionMetadata | null,
  ): WordVersionMetadata {
    if (!existing && !incoming) {
      return {};
    }
    if (incoming === null) {
      return {};
    }
    return {
      ...(existing ?? {}),
      ...(incoming ?? {}),
    };
  }
}

export const defaultWordVersionRegistry = new WordVersionRegistry();

export const __private__ = {
  normalizeIdentifier,
  parseTimestamp,
};
