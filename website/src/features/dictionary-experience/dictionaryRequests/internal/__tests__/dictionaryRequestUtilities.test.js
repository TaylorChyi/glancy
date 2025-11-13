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

const buildState = () => ({
  setActiveView: jest.fn(),
  setLoading: jest.fn(),
  setEntry: jest.fn(),
  setFinalText: jest.fn(),
  setCurrentTerm: jest.fn(),
  setCurrentTermKey: jest.fn(),
});

describe("dictionary request utilities", () => {
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

  it("prepares lookup context with sanitized input", () => {
    const controller = { signal: { aborted: false } };
    const state = buildState();
    const lookupController = { beginLookup: jest.fn().mockReturnValue(controller) };
    const copyController = { resetCopyFeedback: jest.fn() };
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
  });

  it("validates load entry input and reports unauthenticated users", () => {
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

  it("prepares load entry context when lookup is ready", () => {
    const state = buildState();
    const lookupController = { beginLookup: jest.fn().mockReturnValue({ signal: {} }) };
    const copyController = { resetCopyFeedback: jest.fn() };
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

  it("resolves cache hits without forcing new lookup", () => {
    const result = resolveCacheHit({
      cached: { term: "hello", language: "en", flavor: "std" },
      options: { forceNew: false },
      context: { normalized: "hello", config: { language: "en", flavor: "std" } },
      lookupController: { clearActiveLookup: jest.fn() },
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
  });

  it("applies fallback results when network response lacks cache", () => {
    const state = buildState();
    const resolved = applyFallbackResult({
      data: { term: "hello", markdown: "**hi**" },
      normalized: "hello",
      state,
    });

    expect(resolved).toBe("hello");
    expect(state.setEntry).toHaveBeenCalled();
    expect(state.setFinalText).toHaveBeenCalledWith(expect.stringContaining("**hi**"));
  });

  it("normalizes network errors", () => {
    const response = normalizeNetworkResponse({
      response: { error: { message: "boom" } },
      context: { normalized: "hello" },
      options: {},
      applyRecord: jest.fn(),
      wordStoreApi: { getState: () => ({}) },
      state: buildState(),
    });

    expect(response.type).toBe("error");
    expect(response.message).toBe("boom");
  });

  it("normalizes successful responses and updates cache keys", () => {
    const state = buildState();
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
