import { jest } from "@jest/globals";
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
  invokeHistoryStore,
} from "../test-support/historyStore.fixtures.js";

const registerClearHistoryTests = () => {
  test("clearHistory empties store", async () => {
    await invokeHistoryStore((state) => state.addHistory, "a", historyTestUser);
    await invokeHistoryStore((state) => state.clearHistory, historyTestUser);

    expect(historyStore.getState().history).toHaveLength(0);
  });
};

const verifyScopedLanguageClearance = async () => {
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

  const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");

  await invokeHistoryStore(
    (state) => state.clearHistoryByLanguage,
    "CHINESE",
    historyTestUser,
  );

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
};

const verifyCachePrunedWhenEmpty = async () => {
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

  await invokeHistoryStore((state) => state.clearHistoryByLanguage, "ENGLISH");

  const entries = mockWordStore.getState().entries;
  expect(entries).not.toHaveProperty(englishKey);
  expect(entries).toHaveProperty(chineseKey);
};

const verifyRemotePagesCleared = async () => {
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

  await invokeHistoryStore(
    (state) => state.clearHistoryByLanguage,
    "ENGLISH",
    historyTestUser,
  );

  expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
    recordId: "rec-en-extra",
    token: historyTestUser.token,
  });
  expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(3);
  expect(historyStore.getState().history).toHaveLength(0);
};

const registerLanguageClearanceTests = () => {
  test(
    "clearHistoryByLanguage removes scoped records and prunes word cache",
    verifyScopedLanguageClearance,
  );

  test(
    "clearHistoryByLanguage prunes word cache even when history is empty",
    verifyCachePrunedWhenEmpty,
  );

  test(
    "clearHistoryByLanguage removes remote pages for paginated responses",
    verifyRemotePagesCleared,
  );
};

const registerRetentionPolicyTests = () => {
  test("applyRetentionPolicy prunes stale history", async () => {
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

    await invokeHistoryStore(
      (state) => state.applyRetentionPolicy,
      7,
      historyTestUser,
    );

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
};

describe("historyStore clearance policies", () => {
  beforeEach(() => {
    resetHistoryTestState();
  });

  registerClearHistoryTests();
  registerLanguageClearanceTests();
  registerRetentionPolicyTests();
});
