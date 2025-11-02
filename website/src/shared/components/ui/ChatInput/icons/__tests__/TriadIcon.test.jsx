import { render } from "@testing-library/react";

/**
 * 测试目标：三点三角图标需暴露 data 标识，便于后续主题化替换。
 * 前置条件：渲染 TriadIcon 并传入自定义类名。
 * 步骤：
 *  1) 渲染组件。
 *  2) 读取 svg 属性。
 * 断言：
 *  - data-icon-name === "language-triad"；
 *  - 透传的 className 被保留，确保外层可控样式。
 * 边界/异常：
 *  - 若属性缺失将影响测试定位与样式覆盖。
 */
test("GivenTriadIcon_WhenRendered_ThenExposeDataMarker", async () => {
  const { default: TriadIcon } = await import("../TriadIcon.jsx");
  const { container } = render(<TriadIcon className="icon" />);

  const svg = container.querySelector("svg");

  expect(svg).not.toBeNull();
  expect(svg?.getAttribute("data-icon-name")).toBe("language-triad");
  expect(svg?.getAttribute("class")).toContain("icon");
});
