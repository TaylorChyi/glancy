import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import { ApiError } from "@shared/api/client.js";
import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";
import {
  historyStore,
  mockApi,
  dataGovernanceStore,
  userStore,
  historyTestUser,
  makeRecord,
  resetHistoryTestState,
  mockWordStore,
} from "./historyStoreTestkit.js";

describe("historyStore loading & mutations", () => {
  beforeEach(() => {
    resetHistoryTestState();
  });

  test("addHistory stores item and calls api", async () => {
    mockApi.searchRecords.fetchSearchRecords.mockResolvedValueOnce([
      {
        id: "rec-1",
        term: "test",
        language: "ENGLISH",
        flavor: WORD_FLAVOR_BILINGUAL,
        createdAt: "2024-05-01T10:00:00Z",
        favorite: false,
        versions: [
          {
            id: "ver-1",
            createdAt: "2024-05-01T10:00:00Z",
            favorite: false,
          },
        ],
      },
    ]);
    await act(async () => {
      await historyStore.getState().addHistory("test", historyTestUser, "ENGLISH");
    });
    expect(mockApi.searchRecords.saveSearchRecord).toHaveBeenCalled();
    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledWith({
      token: historyTestUser.token,
      page: 0,
      size: 20,
    });
    const item = historyStore.getState().history[0];
    expect(item.term).toBe("test");
    expect(item.flavor).toBe(WORD_FLAVOR_BILINGUAL);
    expect(item.versions).toHaveLength(1);
    expect(item.recordId).toBe("rec-1");
    expect(item.versions[0].id).toBe("ver-1");
  });

  test("loadHistory fetches first page and updates pagination", async () => {
    const pageItems = Array.from({ length: 20 }, (_, idx) => makeRecord(idx));
    mockApi.searchRecords.fetchSearchRecords.mockResolvedValueOnce(pageItems);

    await act(async () => {
      await historyStore.getState().loadHistory(historyTestUser);
    });

    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledWith({
      token: historyTestUser.token,
      page: 0,
      size: 20,
    });
    const state = historyStore.getState();
    expect(state.history).toHaveLength(20);
    expect(state.hasMore).toBe(true);
    expect(state.nextPage).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  test("loadMoreHistory appends next page and stops when depleted", async () => {
    const firstPage = Array.from({ length: 20 }, (_, idx) => makeRecord(idx));
    const secondPage = Array.from({ length: 3 }, (_, idx) =>
      makeRecord(20 + idx),
    );
    mockApi.searchRecords.fetchSearchRecords
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    await act(async () => {
      await historyStore.getState().loadHistory(historyTestUser);
    });
    await act(async () => {
      await historyStore.getState().loadMoreHistory(historyTestUser);
    });

    const state = historyStore.getState();
    expect(state.history).toHaveLength(23);
    expect(state.hasMore).toBe(false);
    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(2);

    await act(async () => {
      await historyStore.getState().loadMoreHistory(historyTestUser);
    });

    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(2);
  });

  test("addHistory infers language when missing", async () => {
    await act(async () => {
      await historyStore.getState().addHistory("word", historyTestUser);
    });
    expect(mockApi.searchRecords.saveSearchRecord).toHaveBeenCalledWith({
      token: historyTestUser.token,
      term: "word",
      language: "ENGLISH",
      flavor: WORD_FLAVOR_BILINGUAL,
    });
  });

  test("Given canonical metadata When loading history Then store normalized term", async () => {
    mockApi.searchRecords.fetchSearchRecords.mockResolvedValueOnce([
      {
        id: "rec-1",
        term: "studdent",
        language: "ENGLISH",
        flavor: WORD_FLAVOR_BILINGUAL,
        metadata: { term: "student" },
        createdAt: "2024-05-01T10:00:00Z",
        favorite: false,
        versions: [
          {
            id: "ver-1",
            term: "student",
            metadata: { term: "student" },
            createdAt: "2024-05-01T10:00:00Z",
            favorite: false,
          },
        ],
      },
    ]);

    await act(async () => {
      await historyStore.getState().loadHistory(historyTestUser);
    });

    const item = historyStore.getState().history[0];
    expect(item.term).toBe("student");
    expect(item.termKey).toBe("ENGLISH:BILINGUAL:student");
  });

  test("Given capture disabled When adding history Then skip persistence", async () => {
    dataGovernanceStore.setState({ historyCaptureEnabled: false });

    await act(async () => {
      await historyStore.getState().addHistory("mute", historyTestUser);
    });

    expect(historyStore.getState().history).toHaveLength(0);
    expect(mockApi.searchRecords.saveSearchRecord).not.toHaveBeenCalled();
  });

  test("Given 401 response When loading history Then user cleared and state reset", async () => {
    userStore.setState({ user: { id: "u1", token: "t" } });
    const clearSpy = jest.spyOn(userStore.getState(), "clearUser");

    historyStore.setState({
      history: [
        {
          recordId: "rec-stale",
          term: "stale",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:stale",
          createdAt: "2024-05-01T10:00:00Z",
          favorite: false,
          versions: [],
          latestVersionId: null,
        },
      ],
      error: "previous",
      hasMore: true,
      isLoading: false,
      nextPage: 1,
    });

    mockApi.searchRecords.fetchSearchRecords.mockRejectedValueOnce(
      new ApiError(401, "Unauthorized", undefined),
    );

    await act(async () => {
      await historyStore.getState().loadHistory({ id: "u1", token: "t" });
    });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    const state = historyStore.getState();
    expect(state.history).toHaveLength(0);
    expect(state.error).toBe("Unauthorized");
    expect(state.isLoading).toBe(false);
    expect(state.hasMore).toBe(false);
    clearSpy.mockRestore();
  });

  test("removeHistory clears cache versions", async () => {
    const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");
    historyStore.setState({
      history: [
        {
          recordId: "rec-hello",
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:hello",
          createdAt: "2024-05-01T10:00:00Z",
          favorite: false,
          versions: [
            {
              id: "ver-hello",
              createdAt: "2024-05-01T10:00:00Z",
              favorite: false,
            },
          ],
          latestVersionId: "ver-hello",
        },
      ],
      error: null,
    });

    await act(async () => {
      await historyStore
        .getState()
        .removeHistory("ENGLISH:BILINGUAL:hello", historyTestUser);
    });

    expect(removeSpy).toHaveBeenCalledWith("ENGLISH:BILINGUAL:hello");
    expect(historyStore.getState().history).toHaveLength(0);
    expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
      recordId: "rec-hello",
      token: historyTestUser.token,
    });
    removeSpy.mockRestore();
  });
});
