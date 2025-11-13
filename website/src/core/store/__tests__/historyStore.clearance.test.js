import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";
import {
  historyStore,
  mockApi,
  mockWordStore,
  historyTestUser,
  resetHistoryTestState,
} from "./historyStoreTestkit.js";

describe("historyStore clearance policies", () => {
  beforeEach(() => {
    resetHistoryTestState();
  });

  test("clearHistory empties store", async () => {
    await act(async () => {
      await historyStore.getState().addHistory("a", historyTestUser);
    });
    await act(async () => {
      await historyStore.getState().clearHistory(historyTestUser);
    });
    expect(historyStore.getState().history).toHaveLength(0);
  });

  test("Given bilingual history When clearing language Then scoped records removed", async () => {
    const createdAt = "2024-05-01T10:00:00Z";
    mockApi.searchRecords.fetchSearchRecords
      .mockResolvedValueOnce([
        {
          id: "rec-en-1",
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          createdAt,
          favorite: false,
          versions: [{ id: "ver-en-1", createdAt, favorite: false }],
        },
        {
          id: "rec-zh-1",
          term: "你好",
          language: "CHINESE",
          flavor: WORD_FLAVOR_BILINGUAL,
          createdAt,
          favorite: false,
          versions: [{ id: "ver-zh-1", createdAt, favorite: false }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "rec-en-1",
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          createdAt,
          favorite: false,
          versions: [{ id: "ver-en-1", createdAt, favorite: false }],
        },
      ]);
    historyStore.setState({
      history: [
        {
          recordId: "rec-en-1",
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:hello",
          createdAt,
          favorite: false,
          versions: [{ id: "ver-en-1", createdAt, favorite: false }],
          latestVersionId: "ver-en-1",
        },
        {
          recordId: "rec-zh-1",
          term: "你好",
          language: "CHINESE",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "CHINESE:BILINGUAL:你好",
          createdAt,
          favorite: false,
          versions: [{ id: "ver-zh-1", createdAt, favorite: false }],
          latestVersionId: "ver-zh-1",
        },
      ],
      error: null,
    });

    const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");

    await act(async () => {
      await historyStore.getState().clearHistoryByLanguage("CHINESE", historyTestUser);
    });

    const remaining = historyStore.getState().history;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].language).toBe("ENGLISH");
    expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
      recordId: "rec-zh-1",
      token: historyTestUser.token,
    });
    expect(removeSpy).toHaveBeenCalledWith("CHINESE:BILINGUAL:你好");
    removeSpy.mockRestore();
  });

  test("Given empty history When clearing language Then word cache pruned", async () => {
    mockWordStore.setState({
      entries: {
        "ENGLISH:BILINGUAL:alpha": {
          versions: [{ id: "alpha-v1" }],
          activeVersionId: "alpha-v1",
          metadata: {},
        },
        "CHINESE:BILINGUAL:你好": {
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
    expect(entries).not.toHaveProperty("ENGLISH:BILINGUAL:alpha");
    expect(entries).toHaveProperty("CHINESE:BILINGUAL:你好");
  });

  test("Given paginated history When clearing language Then remote pages removed", async () => {
    const createdAt = "2024-05-01T10:00:00Z";
    const firstPage = Array.from({ length: 20 }, (_, idx) => ({
      id: `rec-en-${idx}`,
      term: `term-${idx}`,
      language: "ENGLISH",
      flavor: WORD_FLAVOR_BILINGUAL,
      createdAt,
      favorite: false,
      versions: [{ id: `ver-en-${idx}`, createdAt, favorite: false }],
    }));
    const extra = {
      id: "rec-en-extra",
      term: "beyond",
      language: "ENGLISH",
      flavor: WORD_FLAVOR_BILINGUAL,
      createdAt,
      favorite: false,
      versions: [{ id: "ver-en-extra", createdAt, favorite: false }],
    };
    mockApi.searchRecords.fetchSearchRecords
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([extra])
      .mockResolvedValueOnce([]);

    historyStore.setState({
      history: [
        {
          recordId: "rec-seed",
          term: "seed",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:seed",
          createdAt,
          favorite: false,
          versions: [{ id: "ver-en-seed", createdAt, favorite: false }],
          latestVersionId: "ver-en-seed",
        },
      ],
      error: null,
    });

    await act(async () => {
      await historyStore.getState().clearHistoryByLanguage("ENGLISH", historyTestUser);
    });

    expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
      recordId: "rec-en-extra",
      token: historyTestUser.token,
    });
    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(3);
    expect(historyStore.getState().history).toHaveLength(0);
  });

  test("Given retention window When applying policy Then prune stale history", async () => {
    const now = new Date();
    const oldDate = new Date(
      now.getTime() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const newDate = now.toISOString();
    historyStore.setState({
      history: [
        {
          recordId: "rec-legacy",
          term: "legacy",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:legacy",
          createdAt: oldDate,
          favorite: false,
          versions: [
            { id: "ver-legacy-1", createdAt: oldDate, favorite: false },
          ],
          latestVersionId: "ver-legacy-1",
        },
        {
          recordId: "rec-fresh",
          term: "fresh",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:fresh",
          createdAt: newDate,
          favorite: false,
          versions: [
            { id: "ver-fresh-1", createdAt: newDate, favorite: false },
          ],
          latestVersionId: "ver-fresh-1",
        },
      ],
      error: null,
    });

    const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");

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
    expect(removeSpy).toHaveBeenCalledWith("ENGLISH:BILINGUAL:legacy");
    removeSpy.mockRestore();
  });
});
