import { act, renderHook, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const loadHistory = jest.fn();
const loadMoreHistory = jest.fn();
let historyState = [];
let errorState = null;
let userState = { user: { token: "tkn" } };
let hasMoreState = false;
let isLoadingState = false;

jest.unstable_mockModule("@core/context", () => ({
  useHistory: () => ({
    history: historyState,
    loadHistory,
    loadMoreHistory,
    error: errorState,
    hasMore: hasMoreState,
    isLoading: isLoadingState,
  }),
  useUser: () => userState,
}));

let useHistoryLoading;

beforeAll(async () => {
  ({ default: useHistoryLoading } = await import("../useHistoryLoading.js"));
});

describe("useHistoryLoading", () => {
  const historyMock = [
    {
      term: "alpha",
      latestVersionId: "v1",
    },
    {
      term: "beta",
      latestVersionId: "v2",
    },
  ];

  beforeEach(() => {
    loadHistory.mockClear();
    loadMoreHistory.mockClear();
    historyState = historyMock;
    errorState = null;
    userState = { user: { token: "tkn" } };
    hasMoreState = true;
    isLoadingState = false;
  });

  /**
   * 测试目标：初始化时应根据登录用户触发历史列表拉取。
   */
  test("Given user with token When hook mounts Then loads history", async () => {
    renderHook(() => useHistoryLoading());

    await waitFor(() => {
      expect(loadHistory).toHaveBeenCalledWith(userState.user);
    });
  });

  /**
   * 测试目标：选择历史条目时应携带最新版本 ID。
   */
  test("Given history item When selected Then forwards latest version", () => {
    const handleSelectHistory = jest.fn();
    const { result } = renderHook(() =>
      useHistoryLoading({ onSelectHistory: handleSelectHistory }),
    );

    act(() => {
      result.current.onSelect(historyMock[0]);
    });

    expect(handleSelectHistory).toHaveBeenCalledWith(historyMock[0], "v1");
  });

  /**
   * 测试目标：分页加载需携带当前用户凭证。
   */
  test("Given more data When loadMore called Then delegates to store", () => {
    const { result } = renderHook(() => useHistoryLoading());

    act(() => {
      result.current.loadMore();
    });

    expect(loadMoreHistory).toHaveBeenCalledWith(userState.user);
  });

  /**
   * 测试目标：对外暴露的错误应与历史 store 保持一致。
   */
  test("Given history error When reading hook state Then mirrors message", () => {
    errorState = "boom";
    const { result } = renderHook(() => useHistoryLoading());

    expect(result.current.error).toBe("boom");
  });
});
