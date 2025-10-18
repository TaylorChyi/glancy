/**
 * 背景：
 *  - 词典版本的切换与缓存回填逻辑此前散落在主 Hook 中，难以维护。
 * 目的：
 *  - 以组合式 Hook 聚焦版本管理，向外提供 apply/commit/navigate/select 等稳定接口。
 * 关键决策与取舍：
 *  - 采用门面 + 策略组合，将全局 store 访问与本地状态更新集中处理；
 *  - 对外暴露纯函数式 API，方便单元测试通过依赖注入覆盖。
 * 影响范围：
 *  - DictionaryExperience 版本切换、历史回放。
 * 演进与TODO：
 *  - 可在此追加版本差异比较或埋点统计，保持主 Hook 精简。
 */
import { useCallback } from "react";
import { normalizeMarkdownEntity } from "../markdown/dictionaryMarkdownNormalizer.js";

/**
 * 意图：封装词条版本的选择逻辑，确保全局缓存与本地状态一致。
 * 输入：全局 store API、本地状态 setter 与当前版本数据。
 * 输出：applyRecord/commitVersionSelection/handleNavigateVersion/handleSelectVersion。
 */
export function useDictionaryVersionControls({
  wordStoreApi,
  setEntry,
  setFinalText,
  setStreamText,
  setVersions,
  setActiveVersionId,
  setCurrentTerm,
  versions,
  activeVersionId,
  currentTermKey,
}) {
  const applyRecord = useCallback(
    (termKey, record, preferredVersionId) => {
      if (!termKey || !record || !Array.isArray(record.versions)) return null;
      if (record.versions.length === 0) {
        setVersions([]);
        setActiveVersionId(null);
        return null;
      }
      const fallbackId =
        record.versions[0]?.id ?? record.versions[0]?.versionId ?? null;
      const resolvedActiveId =
        preferredVersionId ?? record.activeVersionId ?? fallbackId;
      const resolvedEntry =
        wordStoreApi.getState().getEntry?.(termKey, resolvedActiveId) ??
        record.versions.find(
          (item) => String(item.id) === String(resolvedActiveId),
        ) ??
        record.versions[record.versions.length - 1];
      const normalizedVersions = record.versions.map(normalizeMarkdownEntity);
      setVersions(normalizedVersions);
      setActiveVersionId(resolvedActiveId ?? null);
      const normalizedEntry = normalizeMarkdownEntity(resolvedEntry);
      if (normalizedEntry) {
        setEntry(normalizedEntry);
        setFinalText(normalizedEntry.markdown ?? "");
        if (normalizedEntry.term) {
          setCurrentTerm(normalizedEntry.term);
        }
      }
      return normalizedEntry ?? null;
    },
    [
      wordStoreApi,
      setVersions,
      setActiveVersionId,
      setEntry,
      setFinalText,
      setCurrentTerm,
    ],
  );

  const commitVersionSelection = useCallback(
    (nextVersion) => {
      if (!currentTermKey || !nextVersion) return false;
      const nextId = nextVersion.id ?? nextVersion.versionId;
      if (nextId == null) return false;

      wordStoreApi.getState().setActiveVersion?.(currentTermKey, nextId);
      setActiveVersionId(nextId ?? null);
      const normalizedVersion = normalizeMarkdownEntity(nextVersion);
      setEntry(normalizedVersion);
      setFinalText(normalizedVersion?.markdown ?? "");
      setStreamText("");
      if (normalizedVersion?.term) {
        setCurrentTerm(normalizedVersion.term);
      }
      return true;
    },
    [
      currentTermKey,
      wordStoreApi,
      setActiveVersionId,
      setEntry,
      setFinalText,
      setStreamText,
      setCurrentTerm,
    ],
  );

  const handleNavigateVersion = useCallback(
    (direction) => {
      if (!currentTermKey || versions.length === 0) return;
      const currentIndex = versions.findIndex(
        (item) => String(item.id) === String(activeVersionId),
      );
      const safeIndex = currentIndex >= 0 ? currentIndex : versions.length - 1;
      const delta = direction === "next" ? 1 : -1;
      const nextIndex = Math.min(
        versions.length - 1,
        Math.max(0, safeIndex + delta),
      );
      if (nextIndex === safeIndex) return;
      const nextVersion = versions[nextIndex];
      if (!nextVersion) return;
      commitVersionSelection(nextVersion);
    },
    [currentTermKey, versions, activeVersionId, commitVersionSelection],
  );

  const handleSelectVersion = useCallback(
    (versionId) => {
      if (!currentTermKey || !versionId || versions.length === 0) return;
      const target = versions.find(
        (item) => String(item.id ?? item.versionId) === String(versionId ?? ""),
      );
      if (!target) return;
      commitVersionSelection(target);
    },
    [commitVersionSelection, currentTermKey, versions],
  );

  return {
    applyRecord,
    commitVersionSelection,
    handleNavigateVersion,
    handleSelectVersion,
  };
}
