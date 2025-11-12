import type {
  WordIdentifier,
  VersionSelectionContext,
  VersionSelectionStrategy,
  WordVersion,
} from "../wordVersionRegistry.types.js";
import {
  normalizeIdentifier,
  parseTimestamp,
  findMatchingId,
} from "./versionIdentifierUtils.js";

const rankVersionsByTimestamp = (versions: WordVersion[]) =>
  versions
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

export class LatestTimestampStrategy implements VersionSelectionStrategy {
  pick({
    versions,
    preferredId,
    current,
    metadata,
  }: VersionSelectionContext): WordIdentifier | null {
    if (!versions.length) {
      return null;
    }

    const prioritized = [
      normalizeIdentifier(preferredId),
      normalizeIdentifier(current?.activeVersionId ?? null),
      normalizeIdentifier(metadata?.latestVersionId ?? null),
      normalizeIdentifier(metadata?.activeVersionId ?? null),
    ];

    for (const candidate of prioritized) {
      const matched = findMatchingId(versions, candidate ?? null);
      if (matched) {
        return matched;
      }
    }

    const ranked = rankVersionsByTimestamp(versions);
    return ranked[0]?.version?.id ?? versions[0]?.id ?? null;
  }
}
