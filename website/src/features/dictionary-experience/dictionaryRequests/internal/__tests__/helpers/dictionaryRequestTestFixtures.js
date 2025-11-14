import { jest } from "@jest/globals";
import { WORD_LANGUAGE_AUTO } from "@shared/utils";

import { buildCacheKey } from "../../dictionaryCacheUtils.js";

export const createDictionaryRequestState = () => ({
  setActiveView: jest.fn(),
  setLoading: jest.fn(),
  setEntry: jest.fn(),
  setFinalText: jest.fn(),
  setCurrentTerm: jest.fn(),
  setCurrentTermKey: jest.fn(),
});

export const createLookupControllers = ({ controller } = {}) => {
  const resolvedController = controller ?? { signal: { aborted: false } };

  return {
    lookupController: {
      beginLookup: jest.fn().mockReturnValue(resolvedController),
      clearActiveLookup: jest.fn(),
    },
    copyController: { resetCopyFeedback: jest.fn() },
    controller: resolvedController,
  };
};

export const createHistorySelection = ({
  term = "hello",
  language = "en",
  flavor = "std",
  versionId = "v1",
  cacheKey,
} = {}) => ({
  term,
  language,
  flavor,
  versionId,
  cacheKey: cacheKey ?? buildCacheKey({ term, language, flavor }),
});

export const createHistorySelectDependencies = (overrides = {}) => {
  const selection = overrides.selection ?? createHistorySelection(overrides);

  const defaults = {
    user: { id: "1" },
    navigate: jest.fn(),
    historyStrategy: {
      find: jest.fn().mockReturnValue(selection),
    },
    dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
    dictionaryTargetLanguage: "zh",
    dictionaryFlavor: "std",
    setActiveView: jest.fn(),
    setCurrentTermKey: jest.fn(),
    setCurrentTerm: jest.fn(),
    resetCopyFeedback: jest.fn(),
    cancelActiveLookup: jest.fn(),
    hydrateRecord: jest.fn(),
    setLoading: jest.fn(),
    loadEntry: jest.fn().mockResolvedValue(undefined),
  };

  return {
    ...defaults,
    ...overrides,
    historyStrategy: overrides.historyStrategy ?? defaults.historyStrategy,
  };
};

export const createHydrateSelectionArgs = ({
  selection = createHistorySelection(),
  hydrateRecord = jest.fn(),
  setLoading = jest.fn(),
  loadEntry = jest.fn(),
} = {}) => ({
  dependencies: {
    hydrateRecord,
    setLoading,
    loadEntry,
  },
  selection,
});
