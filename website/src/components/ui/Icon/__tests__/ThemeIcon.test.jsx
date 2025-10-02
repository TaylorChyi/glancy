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
    single: {
      src: "/assets/glancy-web.svg",
      content:
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M0 0h24v24H0z\"/></svg>",
    },
  },
  wechat: {
    single: {
      src: "/assets/wechat.svg",
    },
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
   * 测试目标：在亮色主题下以内联方式渲染 SVG，且保持语义文本颜色类。
   * 前置条件：iconRegistry 为 glancy-web 提供 content；当前主题 light。
   * 步骤：
   *  1) 渲染 ThemeIcon；
   *  2) 获取 role="img" 元素；
   *  3) 定位内部承载 SVG 的包装 span。
   * 断言：
   *  - 根节点为 span，包含 text-onsurface 类；
   *  - 内部包装 span 持有 color: inherit，innerHTML 含 <svg>。
   * 边界/异常：
   *  - 不触发。
   */
  test("renders inline SVG with semantic role class under light theme", () => {
    render(<ThemeIcon name="glancy-web" alt="brand" />);
    const icon = screen.getByRole("img", { name: "brand" });
    expect(icon.tagName).toBe("SPAN");
    expect(icon.className).toContain("text-onsurface");

    const wrapper = icon.querySelector("span[aria-hidden='true']");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("style")).toContain("color: inherit");
    expect(wrapper?.innerHTML).toContain("<svg");
  });

  /**
   * 测试目标：暗色主题自动判定应切换为强对比文本颜色类。
   * 前置条件：currentTheme="dark"；tone 默认为 auto。
   * 步骤：
   *  1) 设定主题上下文为 dark；
   *  2) 渲染 ThemeIcon；
   *  3) 检查根节点 className。
   * 断言：
   *  - className 包含 text-onsurface-strong。
   * 边界/异常：
   *  - tone 未提供时应使用默认 text-onsurface（已由上一测试覆盖）。
   */
  test("prefers strong role class under dark theme", () => {
    currentTheme = "dark";
    render(<ThemeIcon name="glancy-web" alt="brand" />);
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
    const wrapper = icon.querySelector("span[aria-hidden='true']");
    expect(wrapper?.getAttribute("style")).toContain("color: inherit");
  });

  /**
   * 测试目标：在缺失内联文本但仍有 URL 时回退到 <img> 渲染。
   * 前置条件：wechat 图标仅提供 src。
   * 步骤：
   *  1) 渲染 ThemeIcon name="wechat"；
   *  2) 获取 role="img" 元素；
   *  3) 断言元素类型为 img。
   * 断言：
   *  - DOM 节点为 <img>；
   *  - src 属性指向 registry 中的 URL。
   * 边界/异常：
   *  - 确认兼容分支仍然存在。
   */
  test("falls back to image element when inline content missing", () => {
    render(<ThemeIcon name="wechat" alt="wechat" />);
    const icon = screen.getByRole("img", { name: "wechat" });
    expect(icon.tagName).toBe("IMG");
    expect(icon).toHaveAttribute("src", iconRegistry.wechat.single.src);
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
