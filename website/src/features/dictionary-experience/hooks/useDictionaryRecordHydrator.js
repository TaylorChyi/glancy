import { useCallback } from "react";
import { normalizeMarkdownEntity } from "../markdown/dictionaryMarkdownNormalizer.js";

const collectRecordVersions = (record) =>
  Array.isArray(record?.versions) ? record.versions : [];

const resolvePreferredVersionId = (record, preferredVersionId, versions) => {
  const fallbackId = versions[0]?.id ?? versions[0]?.versionId ?? null;
  return preferredVersionId ?? record?.activeVersionId ?? fallbackId ?? null;
};

const hydrateFromStore = (termKey, resolvedId, wordStoreApi) => {
  if (!resolvedId || !wordStoreApi?.getState) {
    return null;
  }
  return wordStoreApi.getState().getEntry?.(termKey, resolvedId) ?? null;
};

const findVersionMatch = (versions, resolvedId) => {
  if (!resolvedId) {
    return null;
  }
  return (
    versions.find(
      (item) => String(item.id ?? item.versionId) === String(resolvedId),
    ) ?? null
  );
};

const pickVersionCandidate = ({
  termKey,
  record,
  preferredVersionId,
  wordStoreApi,
}) => {
  const versions = collectRecordVersions(record);
  const resolvedId = resolvePreferredVersionId(record, preferredVersionId, versions);

  const storeMatch = hydrateFromStore(termKey, resolvedId, wordStoreApi);
  if (storeMatch) {
    return storeMatch;
  }

  const directMatch = findVersionMatch(versions, resolvedId);
  if (directMatch) {
    return directMatch;
  }

  if (record?.entry) {
    return record.entry;
  }

  return versions[versions.length - 1] ?? record ?? null;
};

const applyHydratedEntry = (
  setEntry,
  setFinalText,
  setCurrentTerm,
  normalized,
) => {
  setEntry(normalized);
  setFinalText(normalized.markdown ?? "");
  if (normalized.term) {
    setCurrentTerm(normalized.term);
  }
};

export function useDictionaryRecordHydrator(deps) {
  const { wordStoreApi, setEntry, setFinalText, setCurrentTerm } = deps;
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

      applyHydratedEntry(setEntry, setFinalText, setCurrentTerm, normalized);
      return normalized;
    },
    [setCurrentTerm, setEntry, setFinalText, wordStoreApi],
  );
}
