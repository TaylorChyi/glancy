/**
 * 背景：历史记录的 DTO 到领域模型转换散落于 store 中，流程复杂且易被遗漏。
 * 目的：使用模板方法（Template Method）模式固定映射步骤，让不同来源的历史记录可通过覆写钩子扩展。
 * 关键决策与取舍：选择模板方法而非单纯导出多个工具函数，是为了保证映射流程顺序的一致性；若未来需要根据来源切换策略，可派生新的 Mapper 子类。
 * 影响范围：historyStore 将通过默认实现统一完成 DTO 归一化；测试将覆盖元数据优先级与降级路径。
 * 演进与TODO：后续可考虑引入缓存策略或将钩子抽象为策略对象以支持多服务端形态。
 */

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
