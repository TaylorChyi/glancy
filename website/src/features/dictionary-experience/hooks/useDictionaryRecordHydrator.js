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
      if (normalized.term) {
        setCurrentTerm(normalized.term);
      }

      return normalized;
    },
    [wordStoreApi, setEntry, setFinalText, setCurrentTerm],
  );
}
