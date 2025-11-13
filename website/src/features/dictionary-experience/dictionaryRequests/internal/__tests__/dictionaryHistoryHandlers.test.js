import { jest } from "@jest/globals";
import { WORD_LANGUAGE_AUTO } from "@shared/utils";

import { buildCacheKey } from "../dictionaryCacheUtils.js";
import createDictionaryHistoryDeleteHandler from "../dictionaryHistoryDeleteHandler.js";
import createDictionaryHistorySelectHandler from "../dictionaryHistorySelectHandler.js";
import createDictionaryHistorySendHandler from "../dictionaryHistorySendHandler.js";

describe("dictionary history handlers", () => {
  describe("createDictionaryHistorySendHandler", () => {
    it("redirects unauthenticated users", async () => {
      const navigate = jest.fn();
      const handler = createDictionaryHistorySendHandler({
        user: null,
        navigate,
        text: "hello",
        setText: jest.fn(),
        loadEntry: jest.fn(),
        historyCaptureEnabled: true,
        addHistory: jest.fn(),
        dictionaryFlavor: "std",
      });

      await handler({ preventDefault: jest.fn() });

      expect(navigate).toHaveBeenCalledWith("/login");
    });

    it("records successful lookups", async () => {
      const setText = jest.fn();
      const addHistory = jest.fn();
      const handler = createDictionaryHistorySendHandler({
        user: { id: "1" },
        navigate: jest.fn(),
        text: " hello ",
        setText,
        loadEntry: jest.fn().mockResolvedValue({
          status: "success",
          term: "hello",
          queriedTerm: "hello",
          detectedLanguage: "en",
          flavor: "std",
        }),
        historyCaptureEnabled: true,
        addHistory,
        dictionaryFlavor: "std",
      });

      await handler({ preventDefault: jest.fn() });

      expect(setText).toHaveBeenCalledWith("");
      expect(addHistory).toHaveBeenCalledWith("hello", { id: "1" }, "en", "std");
    });
  });

  describe("createDictionaryHistorySelectHandler", () => {
    const baseDeps = () => {
      const term = "hello";
      const language = "en";
      const flavor = "std";
      const cacheKey = buildCacheKey({ term, language, flavor });
      const selection = { term, language, flavor, versionId: "v1", cacheKey };

      return {
        user: { id: "1" },
        navigate: jest.fn(),
        historyStrategy: { find: jest.fn().mockReturnValue(selection) },
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
    };

    it("hydrates cached records when available", async () => {
      const deps = baseDeps();
      deps.hydrateRecord.mockReturnValue({ term: "hello" });
      const handler = createDictionaryHistorySelectHandler(deps);

      await handler("hello");

      expect(deps.setActiveView).toHaveBeenCalled();
      expect(deps.setCurrentTermKey).toHaveBeenCalledWith(expect.any(String));
      expect(deps.setLoading).toHaveBeenCalledWith(false);
      expect(deps.loadEntry).not.toHaveBeenCalled();
    });

    it("requests fresh data when cache miss occurs", async () => {
      const deps = baseDeps();
      deps.hydrateRecord.mockReturnValue(null);
      const handler = createDictionaryHistorySelectHandler(deps);

      await handler("hello", "override");

      expect(deps.loadEntry).toHaveBeenCalledWith("hello", {
        language: "en",
        flavor: "std",
        versionId: "override",
      });
    });
  });

  describe("createDictionaryHistoryDeleteHandler", () => {
    it("ignores requests without an active term", async () => {
      const removeHistory = jest.fn();
      const handler = createDictionaryHistoryDeleteHandler({
        entry: null,
        currentTerm: "",
        removeHistory,
        user: { id: "1" },
        setEntry: jest.fn(),
        setFinalText: jest.fn(),
        setCurrentTermKey: jest.fn(),
        setCurrentTerm: jest.fn(),
        resetCopyFeedback: jest.fn(),
        showPopup: jest.fn(),
      });

      await handler();

      expect(removeHistory).not.toHaveBeenCalled();
    });

    it("reports errors through the popup", async () => {
      const showPopup = jest.fn();
      const handler = createDictionaryHistoryDeleteHandler({
        entry: { term: "hello" },
        currentTerm: "hello",
        removeHistory: jest.fn().mockRejectedValue(new Error("boom")),
        user: { id: "1" },
        setEntry: jest.fn(),
        setFinalText: jest.fn(),
        setCurrentTermKey: jest.fn(),
        setCurrentTerm: jest.fn(),
        resetCopyFeedback: jest.fn(),
        showPopup,
      });

      await handler();

      expect(showPopup).toHaveBeenCalledWith("boom");
    });
  });
});
