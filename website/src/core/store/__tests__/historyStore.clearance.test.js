import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";
import {
  historyStore,
  mockApi,
  mockWordStore,
  historyTestUser,
  resetHistoryTestState,
  createBilingualRecord,
  seedHistory,
  queueHistoryPages,
  buildTermKey,
} from "./historyStoreTestkit.js";

describe("historyStore clearance policies", () => {
  beforeEach(() => {
    resetHistoryTestState();
  });

  describe("clearHistory", () => {
    test("empties store", async () => {
      await act(async () => {
        await historyStore.getState().addHistory("a", historyTestUser);
      });

      await act(async () => {
        await historyStore.getState().clearHistory(historyTestUser);
      });

      expect(historyStore.getState().history).toHaveLength(0);
    });
  });

  describe("clearHistoryByLanguage", () => {
    test("removes scoped records and prunes word cache", async () => {
      const createdAt = "2024-05-01T10:00:00Z";
      const englishRecord = createBilingualRecord({
        id: "rec-en-1",
        term: "hello",
        language: "ENGLISH",
        createdAt,
        versions: [{ id: "ver-en-1", createdAt, favorite: false }],
      });
      const chineseRecord = createBilingualRecord({
        id: "rec-zh-1",
        term: "你好",
        language: "CHINESE",
        createdAt,
        versions: [{ id: "ver-zh-1", createdAt, favorite: false }],
      });

      queueHistoryPages([englishRecord, chineseRecord], [englishRecord]);
      seedHistory([englishRecord, chineseRecord]);

      const removeSpy = jest.spyOn(
        mockWordStore.getState(),
        "removeVersions",
      );

      await act(async () => {
        await historyStore
          .getState()
          .clearHistoryByLanguage("CHINESE", historyTestUser);
      });

      const remaining = historyStore.getState().history;
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toMatchObject({
        language: "ENGLISH",
        recordId: "rec-en-1",
      });
      expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
        recordId: "rec-zh-1",
        token: historyTestUser.token,
      });
      expect(removeSpy).toHaveBeenCalledWith(
        buildTermKey("CHINESE", WORD_FLAVOR_BILINGUAL, "你好"),
      );
      removeSpy.mockRestore();
    });

    test("prunes word cache even when history is empty", async () => {
      const englishKey = buildTermKey("ENGLISH", WORD_FLAVOR_BILINGUAL, "alpha");
      const chineseKey = buildTermKey("CHINESE", WORD_FLAVOR_BILINGUAL, "你好");

      mockWordStore.setState({
        entries: {
          [englishKey]: {
            versions: [{ id: "alpha-v1" }],
            activeVersionId: "alpha-v1",
            metadata: {},
          },
          [chineseKey]: {
            versions: [{ id: "nihao-v1" }],
            activeVersionId: "nihao-v1",
            metadata: {},
          },
        },
      });

      await act(async () => {
        await historyStore.getState().clearHistoryByLanguage("ENGLISH");
      });

      const entries = mockWordStore.getState().entries;
      expect(entries).not.toHaveProperty(englishKey);
      expect(entries).toHaveProperty(chineseKey);
    });

    test("removes remote pages for paginated responses", async () => {
      const createdAt = "2024-05-01T10:00:00Z";
      const firstPage = Array.from({ length: 20 }, (_, idx) =>
        createBilingualRecord({
          id: `rec-en-${idx}`,
          term: `term-${idx}`,
          language: "ENGLISH",
          createdAt,
          versions: [{ id: `ver-en-${idx}`, createdAt, favorite: false }],
        }),
      );
      const extra = createBilingualRecord({
        id: "rec-en-extra",
        term: "beyond",
        language: "ENGLISH",
        createdAt,
        versions: [{ id: "ver-en-extra", createdAt, favorite: false }],
      });

      queueHistoryPages(firstPage, [extra], []);
      seedHistory([
        createBilingualRecord({
          id: "rec-seed",
          term: "seed",
          language: "ENGLISH",
          createdAt,
          versions: [{ id: "ver-en-seed", createdAt, favorite: false }],
        }),
      ]);

      await act(async () => {
        await historyStore
          .getState()
          .clearHistoryByLanguage("ENGLISH", historyTestUser);
      });

      expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
        recordId: "rec-en-extra",
        token: historyTestUser.token,
      });
      expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(3);
      expect(historyStore.getState().history).toHaveLength(0);
    });
  });

  describe("applyRetentionPolicy", () => {
    test("prunes stale history", async () => {
      const now = new Date();
      const oldDate = new Date(
        now.getTime() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const newDate = now.toISOString();

      seedHistory([
        createBilingualRecord({
          id: "rec-legacy",
          term: "legacy",
          language: "ENGLISH",
          createdAt: oldDate,
          versions: [
            { id: "ver-legacy-1", createdAt: oldDate, favorite: false },
          ],
        }),
        createBilingualRecord({
          id: "rec-fresh",
          term: "fresh",
          language: "ENGLISH",
          createdAt: newDate,
          versions: [
            { id: "ver-fresh-1", createdAt: newDate, favorite: false },
          ],
        }),
      ]);

      const removeSpy = jest.spyOn(
        mockWordStore.getState(),
        "removeVersions",
      );

      await act(async () => {
        await historyStore.getState().applyRetentionPolicy(7, historyTestUser);
      });

      const history = historyStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0].term).toBe("fresh");
      expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
        recordId: "rec-legacy",
        token: historyTestUser.token,
      });
      expect(removeSpy).toHaveBeenCalledWith(
        buildTermKey("ENGLISH", WORD_FLAVOR_BILINGUAL, "legacy"),
      );
      removeSpy.mockRestore();
    });
  });
});
