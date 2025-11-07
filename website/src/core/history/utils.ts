import {
  resolveWordLanguage,
  WORD_FLAVOR_BILINGUAL,
  WORD_LANGUAGE_AUTO,
} from "@shared/utils/language.js";

import type { HistoryItem } from "./types.js";

export const createTermKey = (term: string, language: string, flavor: string) =>
  `${language}:${flavor}:${term}`;

export const normalizeLanguage = (term: string, language?: string | null) =>
  resolveWordLanguage(term, language ?? WORD_LANGUAGE_AUTO).toUpperCase();

export const normalizeFlavor = (flavor?: string | null) => {
  if (!flavor) return WORD_FLAVOR_BILINGUAL;
  const upper = String(flavor).trim().toUpperCase();
  return upper || WORD_FLAVOR_BILINGUAL;
};

export const sanitizeHistoryTerm = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const compareByCreatedAtDesc = (a: HistoryItem, b: HistoryItem) => {
  const left = a.createdAt ?? "";
  const right = b.createdAt ?? "";
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return right.localeCompare(left);
};

export const mergeHistory = (
  existing: HistoryItem[],
  incoming: HistoryItem[],
): HistoryItem[] => {
  const map = new Map<string, HistoryItem>();
  const orderedIncoming = [...incoming].sort(compareByCreatedAtDesc);
  orderedIncoming.forEach((item) => {
    map.set(item.termKey, item);
  });
  existing.forEach((item) => {
    if (!map.has(item.termKey)) {
      map.set(item.termKey, item);
    }
  });
  return Array.from(map.values());
};

export const resolveHistoryItem = (
  history: HistoryItem[],
  identifier: string,
) =>
  history.find(
    (item) =>
      item.recordId === identifier ||
      item.termKey === identifier ||
      item.term === identifier ||
      `${item.language}:${item.term}` === identifier,
  );
