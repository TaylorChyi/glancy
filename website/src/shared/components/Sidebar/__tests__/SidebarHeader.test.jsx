import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

jest.unstable_mockModule("@shared/components/ui/Icon", () => ({
  __esModule: true,
  default: ({ name }) => <span data-testid={`icon-${name}`} />,
}));

const { default: SidebarHeader } = await import("../header/SidebarHeader.jsx");

const createItems = () => [
  {
    key: "dictionary",
    icon: "brand-glancy-website",
    label: "Dictionary",
    active: true,
    onClick: jest.fn(),
    testId: "sidebar-nav-dictionary",
  },
];

describe("SidebarHeader", () => {
  /**
   * 测试目标：点击导航项时应触发对应 onClick。
   * 前置条件：提供带有 onClick mock 的导航项数组并渲染组件。
   * 步骤：
   *  1) 渲染 SidebarHeader。
   *  2) 点击唯一的导航按钮。
   * 断言：
   *  - onClick 被调用一次（失败信息：词典入口未触发回调）。
   * 边界/异常：
   *  - 若 items 为空组件返回 null，本用例不覆盖。
   */
  test("Given items When click dictionary Then invokes handler", () => {
    const items = createItems();
    render(<SidebarHeader items={items} ariaLabel="Navigation" />);

    fireEvent.click(screen.getByTestId("sidebar-nav-dictionary"));

    expect(items[0].onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：激活项需要暴露 aria-current 属性以支持样式与无障碍。
   * 前置条件：提供带 active 标记的导航项数组。
   * 步骤：
   *  1) 渲染 SidebarHeader。
   *  2) 获取 active 项。
   * 断言：
   *  - aria-current 值为 "page"（失败信息：激活态未映射到 aria-current）。
   * 边界/异常：
   *  - 未设置 active 时应省略 aria-current，本用例不覆盖。
   */
  test("Given active item When rendered Then exposes aria current", () => {
    const items = createItems();
    render(<SidebarHeader items={items} ariaLabel="Navigation" />);

    const activeButton = screen.getByTestId("sidebar-nav-dictionary");
    expect(activeButton).toHaveAttribute("aria-current", "page");
  });

  /**
   * 测试目标：头部导航应采用平铺交互变体以移除高亮边框。
   * 前置条件：渲染包含激活项的头部导航列表。
   * 步骤：
   *  1) 渲染 SidebarHeader。
   *  2) 获取导航按钮。
   * 断言：
   *  - 元素包含 flat 类且未包含 active 类（失败信息：头部导航仍使用高亮变体）。
   * 边界/异常：
   *  - 若未来允许自定义变体需更新断言，本用例仅覆盖默认头部行为。
   */
  test("Given header navigation When rendered Then uses flat variant", () => {
    const items = createItems();
    render(<SidebarHeader items={items} ariaLabel="Navigation" />);

    const dictionaryButton = screen.getByTestId("sidebar-nav-dictionary");
    expect(dictionaryButton).toHaveClass("flat");
    expect(dictionaryButton).not.toHaveClass("active");
  });
});
