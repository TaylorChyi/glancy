import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";
import styles from "../HistoryList.module.css";

const loadHistory = jest.fn();

const historyMock = [
  {
    term: "alpha",
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
    history: historyMock,
    loadHistory,
    error: null,
  }),
  useUser: () => ({ user: { token: "tkn" } }),
  useLanguage: () => ({
    t: { searchHistory: "历史" },
    lang: "zh",
  }),
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
    resolvedTheme: "light",
  }),
}));

const { default: HistoryListView } = await import("../HistoryListView.jsx");

describe("HistoryListView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 测试目标：验证渲染结果包含无障碍语义，确保列表项可被聚焦与点击。
   * 前置条件：提供包含两个项的列表数据，注入自定义导航绑定函数。
   * 步骤：
   *  1) 渲染组件并传入模拟导航函数。
   *  2) 查询具有 listbox 语义的容器与按钮。
   * 断言：
   *  - 存在 role 为 listbox 的元素。
   *  - 每个词条渲染为可点击按钮，并继承对齐样式类。
   * 边界/异常：
   *  - 如导航函数返回空对象亦应安全渲染。
   */
  test("Given_items_When_rendered_Then_provides_accessible_structure", () => {
    const onNavigate = jest.fn(() => ({}));

    const items = [
      { termKey: "term-1", term: "alpha", latestVersionId: "v1" },
      { termKey: "term-2", term: "beta", latestVersionId: "v2" },
    ];

    render(<HistoryListView items={items} onNavigate={onNavigate} />);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const firstButton = screen.getByRole("button", { name: "alpha" });
    const secondButton = screen.getByRole("button", { name: "beta" });

    expect(firstButton).toBeInTheDocument();
    expect(secondButton).toBeInTheDocument();
    expect(firstButton).toHaveClass(styles.entryButton);
    expect(secondButton).toHaveClass(styles.entryButton);
    expect(onNavigate).toHaveBeenCalledTimes(items.length);
  });

  /**
   * 测试目标：验证点击行为会回调传入的 onSelect 函数。
   * 前置条件：传入 onSelect 模拟函数与列表数据。
   * 步骤：
   *  1) 渲染组件。
   *  2) 触发第一个项的点击事件。
   * 断言：
   *  - onSelect 按预期携带词条数据被调用。
   * 边界/异常：
   *  - 若回调未提供则不会抛出异常（默认实现为 undefined）。
   */
  test("Given_click_When_item_selected_Then_invokes_onSelect_with_payload", () => {
    const handleSelect = jest.fn();
    const onNavigate = jest.fn(() => ({}));

    const items = [
      { termKey: "term-1", term: "alpha", latestVersionId: "v1" },
      { termKey: "term-2", term: "beta", latestVersionId: "v2" },
    ];

    render(
      <HistoryListView
        items={items}
        onSelect={handleSelect}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "alpha" }));
    expect(handleSelect).toHaveBeenCalledWith(items[0]);
  });

  /**
   * 测试目标：验证键盘事件会透传给导航策略函数。
   * 前置条件：自定义导航函数返回带有 onKeyDown 的处理器。
   * 步骤：
   *  1) 渲染组件并获取第一个按钮。
   *  2) 触发键盘事件。
   * 断言：
   *  - 自定义 onKeyDown 收到事件。
   * 边界/异常：
   *  - onNavigate 必须返回包含 onKeyDown 的对象，否则事件被忽略。
   */
  test("Given_key_event_When_navigation_triggered_Then_forwards_to_strategy", () => {
    const onKeyDown = jest.fn();
    const onNavigate = jest.fn(() => ({ onKeyDown }));

    const items = [
      { termKey: "term-1", term: "alpha", latestVersionId: "v1" },
      { termKey: "term-2", term: "beta", latestVersionId: "v2" },
    ];

    render(
      <HistoryListView
        items={items}
        onSelect={jest.fn()}
        onNavigate={onNavigate}
      />,
    );

    const firstItem = screen.getByRole("button", { name: "alpha" });
    fireEvent.keyDown(firstItem, { key: "ArrowDown" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
