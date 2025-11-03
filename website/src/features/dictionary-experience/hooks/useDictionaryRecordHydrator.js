/**
 * 背景：
 *  - 版本菜单移除后，词条缓存仍需在历史回放与初始化时同步至本地状态。
 * 目的：
 *  - 聚合词典记录的归一化与本地状态回填逻辑，避免重复散落在各个副作用中。
 * 关键决策与取舍：
 *  - 延续 normalizeMarkdownEntity 的能力以保持与流式输出一致的 Markdown 结构；
 *  - 优先根据 preferredVersionId/activeVersionId 命中缓存，退化为最新版本或记录本身。
 * 影响范围：
 *  - DictionaryExperience 的缓存回填、历史选择、生命周期初始化。
 * 演进与TODO：
 *  - 后续若引入多语种差异化版本，可在此扩展更多的选择策略。
 */
import { useCallback } from "react";
import { normalizeMarkdownEntity } from "../markdown/dictionaryMarkdownNormalizer.js";

const pickVersionCandidate = ({
  termKey,
  record,
  preferredVersionId,
  wordStoreApi,
}) => {
  const versions = Array.isArray(record?.versions) ? record.versions : [];
  const fallbackId = versions[0]?.id ?? versions[0]?.versionId ?? null;
  const resolvedId =
    preferredVersionId ?? record?.activeVersionId ?? fallbackId ?? null;

  if (resolvedId && wordStoreApi?.getState) {
    const hydrated = wordStoreApi
      .getState()
      .getEntry?.(termKey, resolvedId);
    if (hydrated) {
      return hydrated;
    }
  }

  if (resolvedId) {
    const matched = versions.find(
      (item) => String(item.id ?? item.versionId) === String(resolvedId),
    );
    if (matched) {
      return matched;
    }
  }

  if (record?.entry) {
    return record.entry;
  }

  return versions[versions.length - 1] ?? record ?? null;
};

export function useDictionaryRecordHydrator({
  wordStoreApi,
  setEntry,
  setFinalText,
  setStreamText,
  setCurrentTerm,
}) {
  return useCallback(
    (termKey, record, preferredVersionId) => {
      if (!termKey || !record) {
        return null;
      }

      const candidate = pickVersionCandidate({
        termKey,
        record,
        preferredVersionId,
        wordStoreApi,
      });
      const normalized = normalizeMarkdownEntity(candidate);
      if (!normalized) {
        return null;
      }

      setEntry(normalized);
      setFinalText(normalized.markdown ?? "");
      setStreamText("");
      if (normalized.term) {
        setCurrentTerm(normalized.term);
      }

      return normalized;
    },
    [wordStoreApi, setEntry, setFinalText, setStreamText, setCurrentTerm],
  );
}
