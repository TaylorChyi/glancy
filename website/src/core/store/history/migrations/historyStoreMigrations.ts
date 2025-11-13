import type { HistoryItem } from "@core/history/index.ts";
import {
  createTermKey,
  normalizeFlavor,
  normalizeLanguage,
} from "@core/history/index.ts";

const ensureHistoryArray = (history: unknown): any[] =>
  Array.isArray(history) ? history : [];

const upgradePreV2History = (history: any[]): HistoryItem[] =>
  history.map((item) => {
    if (typeof item === "string") {
      const language = normalizeLanguage(item);
      const flavor = normalizeFlavor();
      return {
        term: item,
        language,
        flavor,
        termKey: createTermKey(item, language, flavor),
        createdAt: null,
        favorite: false,
        versions: [],
        latestVersionId: null,
      } satisfies HistoryItem;
    }
    if (item && typeof item === "object") {
      const language = normalizeLanguage(item.term, item.language);
      const flavor = normalizeFlavor("flavor" in item ? item.flavor : undefined);
      return {
        ...item,
        language,
        flavor,
        termKey: createTermKey(item.term, language, flavor),
      } as HistoryItem;
    }
    return item;
  });

const normalizePostV2History = (history: any[]): HistoryItem[] =>
  history.map((item: any) => {
    if (!item || typeof item !== "object") {
      return item;
    }
    const language = normalizeLanguage(item.term, item.language);
    const flavor = normalizeFlavor(item.flavor);
    return {
      ...item,
      language,
      flavor,
      termKey: createTermKey(item.term, language, flavor),
    } as HistoryItem;
  });

const normalizeRecordIdentifiers = (history: any[]): HistoryItem[] =>
  history.map((item: any) => {
    if (!item || typeof item !== "object") {
      return item;
    }
    const recordId = item.recordId == null ? null : String(item.recordId);
    return { ...item, recordId } as HistoryItem;
  });

export const migrateHistoryState = (
  persistedState: any,
  version: number | undefined,
) => {
  if (!persistedState) {
    return persistedState;
  }

  let nextState = persistedState;
  let history = ensureHistoryArray(nextState.history);

  if (version === undefined || version < 2) {
    history = upgradePreV2History(history);
  }

  if (version !== undefined && version < 3) {
    history = normalizePostV2History(history);
  }

  nextState = { ...nextState, history };

  if (Array.isArray(nextState.history)) {
    nextState = {
      ...nextState,
      history: normalizeRecordIdentifiers(nextState.history),
    };
  }

  return nextState;
};
