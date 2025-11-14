import { jest } from "@jest/globals";
import { WORD_LANGUAGE_AUTO } from "@shared/utils";

import { resolveHistorySelection } from "../historySelectionResolver.js";
import { prepareLookup } from "../lookupPreparation.js";
import {
  validateLoadEntryInput,
  prepareLoadEntryContext,
} from "../dictionaryRequestValidation.js";
import {
  resolveCacheHit,
  applyFallbackResult,
  buildSuccessResult,
} from "../dictionaryRequestCache.js";
import { normalizeNetworkResponse } from "../dictionaryRequestNetwork.js";
import {
  createDictionaryRequestState,
  createLookupControllers,
} from "./helpers/dictionaryRequestTestFixtures.js";

describe("resolveHistorySelection", () => {
  it("returns null when history selection lacks a term", () => {
    const strategy = { find: jest.fn().mockReturnValue({ term: "" }) };

    const result = resolveHistorySelection({
      strategy,
      identifier: { id: "1" },
      dictionarySourceLanguage: WORD_LANGUAGE_AUTO,
      dictionaryTargetLanguage: "zh",
      dictionaryFlavor: "std",
    });

    expect(result).toBeNull();
  });
});

describe("prepareLookup", () => {
  it("prepares lookup context with sanitized input", () => {
    const state = createDictionaryRequestState();
    const { lookupController, copyController, controller } = createLookupControllers();
    const context = prepareLookup({
      term: "  hello  ",
      options: {},
      state,
      languageConfig: {
        dictionarySourceLanguage: "en",
        dictionaryTargetLanguage: "zh",
        dictionaryFlavor: "std",
      },
      copyController,
      lookupController,
    });

    expect(context.ready).toBe(true);
    expect(context.normalized).toBe("hello");
    expect(state.setCurrentTerm).toHaveBeenCalledWith("hello");
    expect(lookupController.beginLookup).toHaveBeenCalled();
    expect(context.controller).toBe(controller);
  });
});

describe("validateLoadEntryInput", () => {
  it("reports unauthenticated users", () => {
    const popup = { showPopup: jest.fn() };
    const result = validateLoadEntryInput({
      term: "term",
      userId: "",
      popup,
    });

    expect(result.type).toBe("result");
    expect(popup.showPopup).toHaveBeenCalledWith("请先登录");
  });

  it("returns idle result for empty terms", () => {
    const result = validateLoadEntryInput({
      term: "   ",
      userId: "user",
      popup: { showPopup: jest.fn() },
    });

    expect(result).toEqual({ type: "result", result: { status: "idle", term: "" } });
  });
});

describe("prepareLoadEntryContext", () => {
  it("prepares load entry context when lookup is ready", () => {
    const state = createDictionaryRequestState();
    const { lookupController, copyController } = createLookupControllers({
      controller: { signal: {} },
    });
    const resolution = prepareLoadEntryContext({
      term: "hello",
      options: {},
      state,
      languageConfig: {
        dictionarySourceLanguage: "en",
        dictionaryTargetLanguage: "zh",
        dictionaryFlavor: "std",
      },
      copyController,
      lookupController,
    });

    expect(resolution.type).toBe("context");
    expect(resolution.context.ready).toBe(true);
  });
});

describe("resolveCacheHit", () => {
  it("returns cached success results without forcing new lookup", () => {
    const { lookupController } = createLookupControllers();
    const result = resolveCacheHit({
      cached: { term: "hello", language: "en", flavor: "std" },
      options: { forceNew: false },
      context: { normalized: "hello", config: { language: "en", flavor: "std" } },
      lookupController,
      state: { setLoading: jest.fn() },
    });

    expect(result).toEqual(
      buildSuccessResult({
        resolvedTerm: "hello",
        normalized: "hello",
        language: "en",
        flavor: "std",
      }),
    );
    expect(lookupController.clearActiveLookup).toHaveBeenCalled();
  });
});

describe("applyFallbackResult", () => {
  it("hydrates state when network response lacks cache payload", () => {
    const state = createDictionaryRequestState();
    const resolved = applyFallbackResult({
      data: { term: "hello", markdown: "**hi**" },
      normalized: "hello",
      state,
    });

    expect(resolved).toBe("hello");
    expect(state.setEntry).toHaveBeenCalled();
    expect(state.setFinalText).toHaveBeenCalledWith(expect.stringContaining("**hi**"));
  });
});

describe("normalizeNetworkResponse", () => {
  it("normalizes network errors", () => {
    const response = normalizeNetworkResponse({
      response: { error: { message: "boom" } },
      context: { normalized: "hello" },
      options: {},
      applyRecord: jest.fn(),
      wordStoreApi: { getState: () => ({}) },
      state: createDictionaryRequestState(),
    });

    expect(response.type).toBe("error");
    expect(response.message).toBe("boom");
  });

  it("normalizes successful responses and updates cache keys", () => {
    const state = createDictionaryRequestState();
    const response = normalizeNetworkResponse({
      response: {
        data: { term: "hello", markdown: "hi" },
        language: "en",
        flavor: "std",
      },
      context: {
        normalized: "hello",
        cacheKey: "original",
        config: { language: "en", flavor: "std" },
      },
      options: {},
      applyRecord: jest.fn(),
      wordStoreApi: { getState: () => ({ getRecord: () => null }) },
      state,
    });

    expect(response.type).toBe("success");
    expect(response.result.status).toBe("success");
    expect(state.setCurrentTermKey).toHaveBeenCalled();
  });
});
