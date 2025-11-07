import type {
  HistoryItem,
  HistoryVersion,
  HistoryVersionPayload,
  SearchRecordDto,
} from "./types.js";
import {
  createTermKey,
  normalizeFlavor,
  normalizeLanguage,
  sanitizeHistoryTerm,
} from "./utils.js";

abstract class AbstractHistoryRecordMapper {
  map(record: SearchRecordDto): HistoryItem {
    const prepared = this.preprocess(record);
    const versions = this.ensureVersions(prepared);
    const latestVersionId = this.resolveLatestVersionId(versions);
    const canonicalTerm = this.resolveCanonicalTerm(prepared, latestVersionId);
    const fallbackTerm = this.resolveFallbackTerm(prepared);
    const term = canonicalTerm || fallbackTerm;
    const language = normalizeLanguage(term, prepared.language);
    const flavor = normalizeFlavor(prepared.flavor);
    return {
      recordId: this.resolveRecordId(prepared),
      term,
      language,
      flavor,
      termKey: createTermKey(term, language, flavor),
      createdAt: this.resolveCreatedAt(prepared, versions),
      favorite: this.resolveFavorite(prepared, versions),
      versions,
      latestVersionId,
    };
  }

  protected preprocess(record: SearchRecordDto): SearchRecordDto {
    return record;
  }

  protected resolveRecordId(record: SearchRecordDto): string | null {
    return record.id == null ? null : String(record.id);
  }

  protected resolveLatestVersionId(versions: HistoryVersion[]): string | null {
    return versions.length ? (versions[0]?.id ?? null) : null;
  }

  protected resolveFallbackTerm(record: SearchRecordDto): string {
    return sanitizeHistoryTerm(record.term) || record.term || "";
  }

  protected resolveCreatedAt(
    record: SearchRecordDto,
    versions: HistoryVersion[],
  ): string | null {
    return record.createdAt ?? versions[0]?.createdAt ?? null;
  }

  protected resolveFavorite(
    record: SearchRecordDto,
    versions: HistoryVersion[],
  ): boolean {
    return Boolean(record.favorite ?? versions[0]?.favorite ?? false);
  }

  protected abstract ensureVersions(record: SearchRecordDto): HistoryVersion[];

  protected abstract resolveCanonicalTerm(
    record: SearchRecordDto,
    latestVersionId: string | null,
  ): string;
}

const sanitizeVersion = (
  version: HistoryVersionPayload | null | undefined,
  fallback: { createdAt?: string | null; favorite?: boolean | null },
): HistoryVersion | null => {
  if (!version || version.id == null) return null;
  return {
    id: String(version.id),
    createdAt: version.createdAt ?? fallback.createdAt ?? null,
    favorite: Boolean(version.favorite ?? fallback.favorite ?? false),
  };
};

class DefaultHistoryRecordMapper extends AbstractHistoryRecordMapper {
  protected override ensureVersions(record: SearchRecordDto): HistoryVersion[] {
    const fallback = {
      createdAt: record.createdAt ?? null,
      favorite: record.favorite ?? null,
    };
    const provided = (record.versions ?? [])
      .map((version) => sanitizeVersion(version, fallback))
      .filter((v): v is HistoryVersion => Boolean(v));
    if (provided.length > 0) {
      return provided.sort((a, b) => {
        const left = a.createdAt ?? "";
        const right = b.createdAt ?? "";
        return right.localeCompare(left);
      });
    }
    if (record.id == null) return [];
    return [
      {
        id: String(record.id),
        createdAt: record.createdAt ?? null,
        favorite: Boolean(record.favorite ?? false),
      },
    ];
  }

  protected override resolveCanonicalTerm(
    record: SearchRecordDto,
    latestVersionId: string | null,
  ): string {
    const metadataTerm = sanitizeHistoryTerm(record.metadata?.term);
    if (metadataTerm) {
      return metadataTerm;
    }
    const versionTerm = this.resolveTermFromVersions(
      record.versions,
      latestVersionId,
    );
    if (versionTerm) {
      return versionTerm;
    }
    return "";
  }

  private resolveTermFromVersions(
    versions: SearchRecordDto["versions"],
    latestVersionId: string | null,
  ): string {
    if (!Array.isArray(versions) || versions.length === 0) {
      return "";
    }

    const preferred = versions.find((candidate) => {
      if (!candidate) return false;
      const candidateTerm = sanitizeHistoryTerm(
        candidate.term ?? candidate.metadata?.term,
      );
      if (!candidateTerm) {
        return false;
      }
      if (!latestVersionId) {
        return true;
      }
      return String(candidate.id) === String(latestVersionId);
    });

    if (!preferred) {
      return "";
    }

    return (
      sanitizeHistoryTerm(preferred.term) ||
      sanitizeHistoryTerm(preferred.metadata?.term)
    );
  }
}

export const historyRecordMapper = new DefaultHistoryRecordMapper();

export const toHistoryItem = (record: SearchRecordDto): HistoryItem =>
  historyRecordMapper.map(record);
