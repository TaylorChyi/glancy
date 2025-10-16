/**
 * 背景：历史模块内存在多处语言、口味与词形归一化逻辑分散在 Store 中，易造成重复实现与冲突覆盖。
 * 目的：沉淀可复用的纯函数工具集，统一词条标识构造与排序行为，供 Store 与策略层组合使用。
 * 关键决策与取舍：优先抽离无副作用的工具函数，暂不引入 class 以保持调用方简洁；若未来出现多策略需求，可在此基础上包裹新的策略对象。
 * 影响范围：historyStore 将转而引用这些工具函数，避免直接操作字符串常量。
 * 演进与TODO：后续可将语言与口味映射拓展为配置驱动，或引入 memoization 以优化频繁调用场景。
 */

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

export const resolveHistoryItem = (history: HistoryItem[], identifier: string) =>
  history.find(
    (item) =>
      item.recordId === identifier ||
      item.termKey === identifier ||
      item.term === identifier ||
      `${item.language}:${item.term}` === identifier,
  );
