import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import api from "@/api/index.js";
import { useHistoryStore, useWordStore } from "@/store";
import { WORD_FLAVOR_BILINGUAL } from "@/utils/language.js";

const mockWordStore = useWordStore;

const mockApi = api;
mockApi.searchRecords = {
  fetchSearchRecords: jest.fn().mockResolvedValue([]),
  saveSearchRecord: jest.fn().mockResolvedValue({
    id: "r1",
    term: "test",
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
    createdAt: "2024-05-01T10:00:00Z",
    favorite: false,
    versions: [
      {
        id: "r1",
        createdAt: "2024-05-01T10:00:00Z",
        favorite: false,
      },
    ],
  }),
  clearSearchRecords: jest.fn().mockResolvedValue(undefined),
  deleteSearchRecord: jest.fn().mockResolvedValue(undefined),
  favoriteSearchRecord: jest.fn().mockResolvedValue(undefined),
  unfavoriteSearchRecord: jest.fn().mockResolvedValue(undefined),
};

const user = { id: "u1", token: "t" };

describe("historyStore", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    useHistoryStore.setState({ history: [], error: null });
    mockWordStore.setState({ entries: {} });
  });

  /**
   * 验证新增历史记录时会调用后端接口并将返回的版本写入状态树。
   */
  test("addHistory stores item and calls api", async () => {
    mockApi.searchRecords.fetchSearchRecords.mockResolvedValueOnce([
      {
        id: "r1",
        term: "test",
        language: "ENGLISH",
        flavor: WORD_FLAVOR_BILINGUAL,
        createdAt: "2024-05-01T10:00:00Z",
        favorite: false,
        versions: [
          {
            id: "r1",
            createdAt: "2024-05-01T10:00:00Z",
            favorite: false,
          },
        ],
      },
    ]);
    await act(async () => {
      await useHistoryStore.getState().addHistory("test", user, "ENGLISH");
    });
    expect(mockApi.searchRecords.saveSearchRecord).toHaveBeenCalled();
    const item = useHistoryStore.getState().history[0];
    expect(item.term).toBe("test");
    expect(item.flavor).toBe(WORD_FLAVOR_BILINGUAL);
    expect(item.versions).toHaveLength(1);
    expect(item.versions[0].id).toBe("r1");
  });

  /**
   * 验证当未指定语言时，新增历史会自动推断并携带默认语言。
   */
  test("addHistory infers language when missing", async () => {
    await act(async () => {
      await useHistoryStore.getState().addHistory("word", user);
    });
    expect(mockApi.searchRecords.saveSearchRecord).toHaveBeenCalledWith({
      token: user.token,
      term: "word",
      language: "ENGLISH",
      flavor: WORD_FLAVOR_BILINGUAL,
    });
  });

  /**
   * 确认清空历史时会调用接口并重置本地状态列表。
   */
  test("clearHistory empties store", async () => {
    await act(async () => {
      await useHistoryStore.getState().addHistory("a", user);
    });
    await act(async () => {
      await useHistoryStore.getState().clearHistory(user);
    });
    expect(useHistoryStore.getState().history).toHaveLength(0);
  });

  /**
   * 验证删除历史后会同步清理词条缓存并移除对应分组。
   */
  test("removeHistory clears cache versions", async () => {
    const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");
    useHistoryStore.setState({
      history: [
        {
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:hello",
          createdAt: "2024-05-01T10:00:00Z",
          favorite: false,
          versions: [
            { id: "v1", createdAt: "2024-05-01T10:00:00Z", favorite: false },
          ],
          latestVersionId: "v1",
        },
      ],
      error: null,
    });

    await act(async () => {
      await useHistoryStore
        .getState()
        .removeHistory("ENGLISH:BILINGUAL:hello", user);
    });

    expect(removeSpy).toHaveBeenCalledWith("ENGLISH:BILINGUAL:hello");
    expect(useHistoryStore.getState().history).toHaveLength(0);
    removeSpy.mockRestore();
  });
});
