/* eslint-env jest */
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

import styles from "../DictionaryActionPanel.module.css";

const recordedIconProps = [];

jest.unstable_mockModule("@/components/ui/Icon", () => ({
  __esModule: true,
  default: (props) => {
    recordedIconProps.push(props);
    return <span data-testid="theme-icon-stub" />;
  },
}));

jest.unstable_mockModule("@/components/DictionaryEntryActionBar", () => ({
  __esModule: true,
  default: ({ renderRoot }) =>
    renderRoot({
      children: <div data-testid="dictionary-entry-action-bar" />,
    }),
}));

const DictionaryActionPanel = (await import("../DictionaryActionPanel.jsx"))
  .default;

/**
 * 背景：
 *  - DictionaryActionPanel 使用 ThemeIcon 呈现放大镜按钮，但缺失素材时会退化为字母占位。
 * 目的：
 *  - 确保组件在渲染时向 ThemeIcon 传入 search 图标标识，以匹配新增 SVG 资产。
 * 关键决策与取舍：
 *  - 通过模块模拟记录 ThemeIcon props，避免依赖实际 SVG 解析，提高测试稳定性；
 *  - 同时触发按钮事件以确保交互路径未受影响。
 * 影响范围：
 *  - DictionaryActionPanel 组件的放大镜按钮与 ThemeIcon 调用参数。
 * 演进与TODO：
 *  - 如需覆盖不同尺寸或语义色，可扩展更多断言以验证 props 组合。
 */
describe("DictionaryActionPanel", () => {
  beforeEach(() => {
    recordedIconProps.length = 0;
  });

  /**
   * 测试目标：验证放大镜按钮渲染时 ThemeIcon 收到 search 图标标识与尺寸参数。
   * 前置条件：提供最小化的 actionBarProps 和点击回调；ThemeIcon 被模拟并记录 props。
   * 步骤：
   *  1) 渲染 DictionaryActionPanel；
   *  2) 查找放大镜按钮并触发点击；
   *  3) 检查记录的 ThemeIcon props。
   * 断言：
   *  - ThemeIcon 的 name 为 "search"；
   *  - ThemeIcon 的 width 与 height 均为 18；
   *  - 点击按钮会调用 onRequestSearch 回调。
   * 边界/异常：
   *  - 不涉及额外交互状态。
   */
  test("renders search icon with expected sizing and delegates click", () => {
    const onRequestSearch = jest.fn();

    render(
      <DictionaryActionPanel
        actionBarProps={{ className: "" }}
        onRequestSearch={onRequestSearch}
        searchButtonLabel="返回搜索"
      />,
    );

    const searchButton = screen.getByRole("button", { name: "返回搜索" });
    fireEvent.click(searchButton);

    expect(recordedIconProps[0]?.name).toBe("search");
    expect(recordedIconProps[0]?.width).toBe(18);
    expect(recordedIconProps[0]?.height).toBe(18);
    expect(onRequestSearch).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：验证 SearchBox 在默认与自定义 renderRoot 两种模式下，都会被 panelShell 布局壳包裹。
   * 前置条件：CSS Modules 在测试环境返回稳定类名字符串；DictionaryEntryActionBar 被桩件替换。
   * 步骤：
   *  1) 渲染组件（默认 renderRoot）；
   *  2) 断言 SearchBox 父元素含 panelShell 类；
   *  3) 以自定义 renderRoot 重新渲染；
   *  4) 再次断言父元素类名未变。
   * 断言：
   *  - data-testid 为 dictionary-action-panel 的元素父节点包含 styles.panelShell；
   *  - 重新渲染后依旧满足上述条件。
   * 边界/异常：
   *  - 自定义 renderRoot 返回 null 时组件将不渲染工具栏，此路径不在当前验证范围内。
   */
  test("wraps search box with layout shell across toolbar render modes", () => {
    const { rerender } = render(
      <DictionaryActionPanel
        actionBarProps={{ className: "" }}
        onRequestSearch={jest.fn()}
        searchButtonLabel="返回搜索"
      />,
    );

    const searchBox = screen.getByTestId("dictionary-action-panel");
    expect(searchBox.parentElement).toHaveClass(styles.panelShell);

    rerender(
      <DictionaryActionPanel
        actionBarProps={{
          className: "",
          renderRoot: ({ children }) => <section>{children}</section>,
        }}
        onRequestSearch={jest.fn()}
        searchButtonLabel="返回搜索"
      />,
    );

    const searchBoxAfterRerender = screen.getByTestId(
      "dictionary-action-panel",
    );
    expect(searchBoxAfterRerender.parentElement).toHaveClass(styles.panelShell);
  });
});
