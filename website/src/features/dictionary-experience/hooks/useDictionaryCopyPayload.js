import { useMemo } from "react";
import { extractMarkdownPreview } from "@shared/utils";
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";

const findNormalizedCandidate = (candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }
    const preview = extractMarkdownPreview(candidate);
    const normalized = preview == null ? candidate : preview;
    return normalizeDictionaryMarkdown(normalized);
  }
  return null;
};

const fallbackToEntryPayload = (entry, fallback) => {
  if (entry && typeof entry === "object") {
    try {
      return JSON.stringify(entry, null, 2);
    } catch {
      return fallback ?? "";
    }
  }
  return fallback ?? "";
};

export const resolveCopyPayload = ({ entry, finalText, currentTerm }) => {
  const normalizedCandidate = findNormalizedCandidate([
    typeof entry?.markdown === "string" ? entry.markdown : null,
    typeof finalText === "string" ? finalText : null,
  ]);
  if (normalizedCandidate != null) {
    return normalizedCandidate;
  }
  return fallbackToEntryPayload(entry, currentTerm);
};

export const useCopyPayload = ({ entry, finalText, currentTerm }) =>
  useMemo(
    () => resolveCopyPayload({ entry, finalText, currentTerm }),
    [entry, finalText, currentTerm],
  );

export const useCopyAvailability = (copyPayload) =>
  useMemo(
    () => typeof copyPayload === "string" && copyPayload.trim().length > 0,
    [copyPayload],
  );
