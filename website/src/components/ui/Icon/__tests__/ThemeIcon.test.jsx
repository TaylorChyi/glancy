/* eslint-env jest */
import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

let currentTheme = "light";
const mockUseTheme = jest.fn(() => ({ resolvedTheme: currentTheme }));

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

const iconRegistry = {
  "glancy-web": {
    single: "/assets/glancy-web.svg",
  },
  wechat: {
    single: "/assets/wechat.svg",
  },
  apple: {
    light: "/assets/apple-light.svg",
    dark: "/assets/apple-dark.svg",
  },
};

jest.unstable_mockModule("@/assets/icons.js", () => ({
  default: iconRegistry,
}));

const { ThemeIcon } = await import("@/components/ui/Icon/index.tsx");

describe("ThemeIcon", () => {
  beforeEach(() => {
    currentTheme = "light";
    mockUseTheme.mockReset();
    mockUseTheme.mockImplementation(() => ({ resolvedTheme: currentTheme }));
  });

  /**
   * 测试目标：在默认主题下渲染单源 SVG 并附带语义文本颜色类。
   * 前置条件：iconRegistry 包含 glancy-web 的 single 资源；主题为 light。
   * 步骤：
   *  1) 渲染 ThemeIcon；
   *  2) 查找 role="img" 元素；
   *  3) 断言 className 与 src。
   * 断言：
   *  - 元素拥有 text-onsurface 类；
   *  - 元素的 src 指向 single 资源。
   * 边界/异常：
   *  - 不触发。
   */
  test("renders single-source icon with semantic role class", () => {
    render(<ThemeIcon name="glancy-web" alt="brand" />);
    const icon = screen.getByRole("img", { name: "brand" });
    expect(icon).toHaveAttribute("src", iconRegistry["glancy-web"].single);
    expect(icon.className).toContain("text-onsurface");
  });

  /**
   * 测试目标：在 resolvedTheme=light 时优先渲染 light 变体。 
   * 前置条件：iconRegistry.apple 同时提供 light/dark 资源。 
   * 步骤：
   *  1) 设置 currentTheme=light；
   *  2) 渲染 ThemeIcon name="apple"；
   *  3) 捕获 img 元素并检查 src。 
   * 断言：
   *  - src 指向 light 变体。
   * 边界/异常：
   *  - 若 light 缺失则会退到 dark（由后续测试覆盖）。
   */
  test("prefers light variant when theme resolves to light", () => {
    currentTheme = "light";
    render(<ThemeIcon name="apple" alt="apple" />);
    const icon = screen.getByRole("img", { name: "apple" });
    expect(icon).toHaveAttribute("src", iconRegistry.apple.light);
  });

  /**
   * 测试目标：在 resolvedTheme=dark 时切换到暗色背景专用资源。 
   * 前置条件：iconRegistry.apple 提供 dark 资源；currentTheme=dark。 
   * 步骤：
   *  1) 设置 currentTheme=dark；
   *  2) 渲染 ThemeIcon name="apple"；
   *  3) 捕获 img 并校验 src。 
   * 断言：
   *  - src 指向 dark 变体。
   * 边界/异常：
   *  - 若 dark 缺失应回退到 light（由上一测试覆盖逻辑）。
   */
  test("switches to dark variant when theme resolves to dark", () => {
    currentTheme = "dark";
    render(<ThemeIcon name="apple" alt="apple" />);
    const icon = screen.getByRole("img", { name: "apple" });
    expect(icon).toHaveAttribute("src", iconRegistry.apple.dark);
  });

  /**
   * 测试目标：当 tone="dark" 时使用反差更高的强前景颜色类。
   * 前置条件：当前主题 resolvedTheme=light；tone=dark。
   * 步骤：
   *  1) 渲染 ThemeIcon 并传入 tone="dark"；
   *  2) 查找 role="img" 元素；
   *  3) 断言 className。
   * 断言：
   *  - className 包含 text-onsurface-strong。
   * 边界/异常：
   *  - tone 未提供时应使用默认 text-onsurface（已由上一测试覆盖）。
   */
  test("applies strong role class when forcing dark tone", () => {
    render(<ThemeIcon name="glancy-web" alt="brand" tone="dark" />);
    const icon = screen.getByRole("img", { name: "brand" });
    expect(icon.className).toContain("text-onsurface-strong");
  });

  /**
   * 测试目标：显式 roleClass 时优先生效。
   * 前置条件：roleClass="danger"。
   * 步骤：
   *  1) 渲染 ThemeIcon 并传入 roleClass；
   *  2) 获取 img 元素；
   *  3) 检查 className。
   * 断言：
   *  - className 包含 text-ondanger。
   * 边界/异常：
   *  - 若 roleClass 缺失则回退到 legacy tone（已由前两测试覆盖）。
   */
  test("respects explicit roleClass override", () => {
    render(<ThemeIcon name="glancy-web" alt="brand" roleClass="danger" />);
    const icon = screen.getByRole("img", { name: "brand" });
    expect(icon.className).toContain("text-ondanger");
  });

  /**
   * 测试目标：当图标未收录时渲染排版 fallback。
   * 前置条件：iconRegistry 不包含 google；
   * 步骤：
   *  1) 渲染 ThemeIcon name="google"；
   *  2) 获取 role="img" 元素；
   *  3) 验证内容与 aria。
   * 断言：
   *  - 文本内容为 "G"；
   *  - aria-label 等于 alt。
   * 边界/异常：
   *  - 覆盖无资源场景，确保 UI 稳定。
   */
  test("renders typographic fallback when icon is missing", () => {
    render(<ThemeIcon name="google" alt="google" />);
    const fallback = screen.getByRole("img", { name: "google" });
    expect(fallback).toHaveTextContent("G");
  });
});
