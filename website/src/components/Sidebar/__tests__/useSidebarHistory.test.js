import { act, renderHook, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const loadHistory = jest.fn();
const loadMoreHistory = jest.fn();

let historyState = [];
let errorState = null;
let userState = { user: { token: "tkn" } };
let hasMoreState = false;
let isLoadingState = false;

const historyMock = [
  {
    term: "alpha",
    displayTerm: "alpha",
    language: "ENGLISH",
    flavor: "BILINGUAL",
    termKey: "ENGLISH:BILINGUAL:alpha",
    createdAt: "2024-05-01T10:00:00Z",
    favorite: false,
    versions: [
      { id: "v1", createdAt: "2024-05-01T10:00:00Z", favorite: false },
    ],
    latestVersionId: "v1",
  },
  {
    term: "beta",
    displayTerm: "beta",
    language: "ENGLISH",
    flavor: "BILINGUAL",
    termKey: "ENGLISH:BILINGUAL:beta",
    createdAt: "2024-05-02T11:00:00Z",
    favorite: false,
    versions: [
      { id: "v2", createdAt: "2024-05-02T11:00:00Z", favorite: false },
    ],
    latestVersionId: "v2",
  },
];

jest.unstable_mockModule("@/context", () => ({
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

const { default: useSidebarHistory } = await import(
  "../hooks/useSidebarHistory.js"
);

describe("useSidebarHistory", () => {
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
   * 测试目标：验证 Hook 初始化时会根据用户信息触发历史加载。
   * 前置条件：mock 的 useUser 返回含 token 的用户，useHistory 提供 loadHistory。
   * 步骤：
   *  1) 渲染 Hook。
   *  2) 等待副作用执行。
   * 断言：
   *  - loadHistory 按预期携带用户对象被调用。
   * 边界/异常：
   *  - 如无 token，副作用应短路（在其他用例覆盖）。
   */
  test("Given_user_with_token_When_hook_mounts_Then_requests_history", async () => {
    renderHook(() => useSidebarHistory());

    await waitFor(() => {
      expect(loadHistory).toHaveBeenCalledWith(userState.user);
    });
  });

  /**
   * 测试目标：验证 onSelect 回调会携带词条与版本 ID。
   * 前置条件：传入 onSelectHistory 模拟函数，历史数据含 latestVersionId。
   * 步骤：
   *  1) 渲染 Hook 并调用返回的 onSelect。
   * 断言：
   *  - onSelectHistory 接收到 (item, versionId)。
   * 边界/异常：
   *  - 若缺少 latestVersionId，应回退为 undefined。
   */
  test("Given_history_item_When_selected_Then_notifies_with_version", () => {
    const handleSelectHistory = jest.fn();
    const { result } = renderHook(() =>
      useSidebarHistory({ onSelectHistory: handleSelectHistory }),
    );

    act(() => {
      result.current.onSelect(historyMock[0]);
    });

    expect(handleSelectHistory).toHaveBeenCalledWith(historyMock[0], "v1");
  });

  /**
   * 测试目标：验证错误信息会通过 toast 接口暴露并可关闭。
   * 前置条件：mock useHistory 返回 error 字符串。
   * 步骤：
   *  1) 渲染 Hook。
   *  2) 调用 toast.onClose。
   * 断言：
   *  - 初始 open 为 true 且 message 为 error。
   *  - 关闭后 open 变为 false。
   * 边界/异常：
   *  - 多次关闭应安全幂等（此处覆盖一次）。
   */
  test("Given_history_error_When_present_Then_exposes_dismissible_toast", () => {
    errorState = "boom";
    const { result } = renderHook(() => useSidebarHistory());

    expect(result.current.toast.open).toBe(true);
    expect(result.current.toast.message).toBe("boom");

    act(() => {
      result.current.toast.onClose();
    });

    expect(result.current.toast.open).toBe(false);
    expect(result.current.toast.message).toBe("");
  });

  /**
   * 测试目标：验证键盘导航策略会聚焦下一个注册元素。
   * 前置条件：通过 onNavigate 注册两个按钮元素。
   * 步骤：
   *  1) 调用 onNavigate 获取索引 0、1 的绑定。
   *  2) 模拟 ArrowDown 事件。
   * 断言：
   *  - 第二个按钮的 focus 被触发。
   * 边界/异常：
   *  - 当列表为空时不会触发聚焦（默认历史数据覆盖非空场景）。
   */
  test("Given_arrow_navigation_When_arrowDown_pressed_Then_focuses_next", () => {
    const { result } = renderHook(() => useSidebarHistory());

    const firstBindings = result.current.onNavigate(0);
    const secondBindings = result.current.onNavigate(1);

    const firstButton = document.createElement("button");
    const secondButton = document.createElement("button");
    secondButton.focus = jest.fn();

    firstBindings.ref(firstButton);
    secondBindings.ref(secondButton);

    act(() => {
      firstBindings.onKeyDown({ key: "ArrowDown", preventDefault: jest.fn() });
    });

    expect(secondButton.focus).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：验证 loadMore 会在具备用户信息时触发 store 的分页加载。
   * 前置条件：mock useHistory 返回 hasMore=true、用户存在。
   * 步骤：
   *  1) 渲染 Hook 并调用 loadMore。
   * 断言：
   *  - loadMoreHistory 接收用户对象。
   * 边界/异常：
   *  - 若无 token 将不会调用（未在此用例覆盖）。
   */
  test("Given_user_and_more_data_When_loadMore_invoked_Then_calls_store", () => {
    const { result } = renderHook(() => useSidebarHistory());

    act(() => {
      result.current.loadMore();
    });

    expect(loadMoreHistory).toHaveBeenCalledWith(userState.user);
  });
});
