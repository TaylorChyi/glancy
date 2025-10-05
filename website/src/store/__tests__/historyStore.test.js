import { jest } from "@jest/globals";
import { act } from "@testing-library/react";
import api from "@/api/index.js";
import { useHistoryStore, useWordStore, useDataGovernanceStore } from "@/store";
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

const makeRecord = (idx) => {
  const createdAt = new Date(
    Date.UTC(2024, 0, idx + 1, 10, 0, 0),
  ).toISOString();
  return {
    id: `r${idx}`,
    term: `term-${idx}`,
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
    createdAt,
    favorite: false,
    versions: [
      {
        id: `r${idx}`,
        createdAt,
        favorite: false,
      },
    ],
  };
};

describe("historyStore", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    useHistoryStore.setState({
      history: [],
      error: null,
      isLoading: false,
      hasMore: false,
      nextPage: 0,
    });
    mockWordStore.setState({ entries: {} });
    useDataGovernanceStore.setState({
      retentionPolicyId: "90d",
      historyCaptureEnabled: true,
    });
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
    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledWith({
      token: user.token,
      page: 0,
      size: 20,
    });
    const item = useHistoryStore.getState().history[0];
    expect(item.term).toBe("test");
    expect(item.flavor).toBe(WORD_FLAVOR_BILINGUAL);
    expect(item.versions).toHaveLength(1);
    expect(item.versions[0].id).toBe("r1");
  });

  /**
   * 验证首次加载历史会按分页策略请求并更新分页元数据。
   */
  test("loadHistory fetches first page and updates pagination", async () => {
    const pageItems = Array.from({ length: 20 }, (_, idx) => makeRecord(idx));
    mockApi.searchRecords.fetchSearchRecords.mockResolvedValueOnce(pageItems);

    await act(async () => {
      await useHistoryStore.getState().loadHistory(user);
    });

    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledWith({
      token: user.token,
      page: 0,
      size: 20,
    });
    const state = useHistoryStore.getState();
    expect(state.history).toHaveLength(20);
    expect(state.hasMore).toBe(true);
    expect(state.nextPage).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  /**
   * 验证向下滚动触发分页加载时会累积历史并在无更多数据后停止请求。
   */
  test("loadMoreHistory appends next page and stops when depleted", async () => {
    const firstPage = Array.from({ length: 20 }, (_, idx) => makeRecord(idx));
    const secondPage = Array.from({ length: 3 }, (_, idx) =>
      makeRecord(20 + idx),
    );
    mockApi.searchRecords.fetchSearchRecords
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    await act(async () => {
      await useHistoryStore.getState().loadHistory(user);
    });
    await act(async () => {
      await useHistoryStore.getState().loadMoreHistory(user);
    });

    const state = useHistoryStore.getState();
    expect(state.history).toHaveLength(23);
    expect(state.hasMore).toBe(false);
    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(2);

    await act(async () => {
      await useHistoryStore.getState().loadMoreHistory(user);
    });

    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(2);
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
   * 测试目标：当历史采集开关关闭时，不应触发持久化与 API 调用。
   * 前置条件：historyCaptureEnabled 设为 false。
   * 步骤：
   *  1) 关闭采集开关；
   *  2) 调用 addHistory。
   * 断言：
   *  - store.history 仍为空；
   *  - saveSearchRecord 未被调用。
   * 边界/异常：
   *  - 若仍被调用则说明与数据治理开关未对齐。
   */
  test("Given capture disabled When adding history Then skip persistence", async () => {
    useDataGovernanceStore.setState({ historyCaptureEnabled: false });

    await act(async () => {
      await useHistoryStore.getState().addHistory("mute", user);
    });

    expect(useHistoryStore.getState().history).toHaveLength(0);
    expect(mockApi.searchRecords.saveSearchRecord).not.toHaveBeenCalled();
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

  /**
   * 测试目标：按语言清除历史时，仅移除对应语言的记录并调用删除接口。
   * 前置条件：历史包含英文与中文两种语言。
   * 步骤：
   *  1) 预置两条记录；
   *  2) 调用 clearHistoryByLanguage("CHINESE")。
   * 断言：
   *  - 中文记录被删除、英文记录保留；
   *  - deleteSearchRecord 按版本被调用。
   * 边界/异常：
   *  - 若筛选失败则可能误删全部记录。
   */
  test("Given bilingual history When clearing language Then scoped records removed", async () => {
    const createdAt = "2024-05-01T10:00:00Z";
    mockApi.searchRecords.fetchSearchRecords
      .mockResolvedValueOnce([
        {
          id: "en-1",
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          createdAt,
          favorite: false,
          versions: [{ id: "en-1", createdAt, favorite: false }],
        },
        {
          id: "zh-1",
          term: "你好",
          language: "CHINESE",
          flavor: WORD_FLAVOR_BILINGUAL,
          createdAt,
          favorite: false,
          versions: [{ id: "zh-1", createdAt, favorite: false }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "en-1",
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          createdAt,
          favorite: false,
          versions: [{ id: "en-1", createdAt, favorite: false }],
        },
      ]);
    useHistoryStore.setState({
      history: [
        {
          term: "hello",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:hello",
          createdAt,
          favorite: false,
          versions: [{ id: "en-1", createdAt, favorite: false }],
          latestVersionId: "en-1",
        },
        {
          term: "你好",
          language: "CHINESE",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "CHINESE:BILINGUAL:你好",
          createdAt,
          favorite: false,
          versions: [{ id: "zh-1", createdAt, favorite: false }],
          latestVersionId: "zh-1",
        },
      ],
      error: null,
    });

    const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");

    await act(async () => {
      await useHistoryStore.getState().clearHistoryByLanguage("CHINESE", user);
    });

    const remaining = useHistoryStore.getState().history;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].language).toBe("ENGLISH");
    expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
      recordId: "zh-1",
      token: user.token,
    });
    expect(removeSpy).toHaveBeenCalledWith("CHINESE:BILINGUAL:你好");
    removeSpy.mockRestore();
  });

  /**
   * 测试目标：当本地历史为空时仍能清除词条缓存中的指定语言记录。
   * 前置条件：wordStore 预置中英文缓存，history 为空。
   * 步骤：
   *  1) 写入两条缓存词条；
   *  2) 调用 clearHistoryByLanguage("ENGLISH")；
   * 断言：
   *  - 英文缓存被移除，中文缓存仍在；
   * 边界/异常：
   *  - 若逻辑提前返回则无法移除英文缓存。
   */
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
      await useHistoryStore.getState().clearHistoryByLanguage("ENGLISH");
    });

    const entries = mockWordStore.getState().entries;
    expect(entries).not.toHaveProperty("ENGLISH:BILINGUAL:alpha");
    expect(entries).toHaveProperty("CHINESE:BILINGUAL:你好");
  });

  /**
   * 测试目标：分页加载时仍能彻底清除某语言的全部历史记录。
   * 前置条件：后端第 1 页返回 20 条英文记录，第 2 页仍有额外英文记录。
   * 步骤：
   *  1) 预置一条英文历史以激活清理流程；
   *  2) 模拟分页接口返回两页英文记录；
   *  3) 调用 clearHistoryByLanguage("ENGLISH")。
   * 断言：
   *  - deleteSearchRecord 覆盖到第 2 页的版本 ID；
   *  - fetchSearchRecords 被调用 3 次（两页收集 + 重载首屏）。
   * 边界/异常：
   *  - 若遍历提前终止，将遗漏尾页导致记录残留。
   */
  test("Given paginated history When clearing language Then remote pages removed", async () => {
    const createdAt = "2024-05-01T10:00:00Z";
    const firstPage = Array.from({ length: 20 }, (_, idx) => ({
      id: `en-${idx}`,
      term: `term-${idx}`,
      language: "ENGLISH",
      flavor: WORD_FLAVOR_BILINGUAL,
      createdAt,
      favorite: false,
      versions: [{ id: `en-${idx}`, createdAt, favorite: false }],
    }));
    const extra = {
      id: "en-extra",
      term: "beyond",
      language: "ENGLISH",
      flavor: WORD_FLAVOR_BILINGUAL,
      createdAt,
      favorite: false,
      versions: [{ id: "en-extra", createdAt, favorite: false }],
    };
    mockApi.searchRecords.fetchSearchRecords
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([extra])
      .mockResolvedValueOnce([]);

    useHistoryStore.setState({
      history: [
        {
          term: "seed",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:seed",
          createdAt,
          favorite: false,
          versions: [{ id: "en-seed", createdAt, favorite: false }],
          latestVersionId: "en-seed",
        },
      ],
      error: null,
    });

    await act(async () => {
      await useHistoryStore.getState().clearHistoryByLanguage("ENGLISH", user);
    });

    expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
      recordId: "en-extra",
      token: user.token,
    });
    expect(mockApi.searchRecords.fetchSearchRecords).toHaveBeenCalledTimes(3);
    expect(useHistoryStore.getState().history).toHaveLength(0);
  });

  /**
   * 测试目标：应用保留策略时，早于窗口的记录会被剔除。
   * 前置条件：历史包含一条 10 天前、一条今日记录，保留期 7 天。
   * 步骤：
   *  1) 预置两条记录；
   *  2) 调用 applyRetentionPolicy(7)。
   * 断言：
   *  - 旧记录被移除，新记录保留；
   *  - deleteSearchRecord 为旧版本调用。
   * 边界/异常：
   *  - 若时间解析失败，策略应宽松地跳过该记录。
   */
  test("Given retention window When applying policy Then prune stale history", async () => {
    const now = new Date();
    const oldDate = new Date(
      now.getTime() - 10 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const newDate = now.toISOString();
    useHistoryStore.setState({
      history: [
        {
          term: "legacy",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:legacy",
          createdAt: oldDate,
          favorite: false,
          versions: [{ id: "legacy-1", createdAt: oldDate, favorite: false }],
          latestVersionId: "legacy-1",
        },
        {
          term: "fresh",
          language: "ENGLISH",
          flavor: WORD_FLAVOR_BILINGUAL,
          termKey: "ENGLISH:BILINGUAL:fresh",
          createdAt: newDate,
          favorite: false,
          versions: [{ id: "fresh-1", createdAt: newDate, favorite: false }],
          latestVersionId: "fresh-1",
        },
      ],
      error: null,
    });

    const removeSpy = jest.spyOn(mockWordStore.getState(), "removeVersions");

    await act(async () => {
      await useHistoryStore.getState().applyRetentionPolicy(7, user);
    });

    const history = useHistoryStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0].term).toBe("fresh");
    expect(mockApi.searchRecords.deleteSearchRecord).toHaveBeenCalledWith({
      recordId: "legacy-1",
      token: user.token,
    });
    expect(removeSpy).toHaveBeenCalledWith("ENGLISH:BILINGUAL:legacy");
    removeSpy.mockRestore();
  });
});
