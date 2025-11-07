import { render, screen } from "@testing-library/react";
import SettingsBody from "../SettingsBody.jsx";

function Navigation() {
  return (
    <nav aria-label="Example sections">
      <button type="button">General</button>
    </nav>
  );
}

function Panel() {
  return (
    <section aria-labelledby="panel-heading">
      <h2 id="panel-heading">Panel content</h2>
    </section>
  );
}

/**
 * 测试目标：容器应应用传入的 style，从而对外暴露统一高度变量。
 * 前置条件：渲染 SettingsBody 并注入 style、导航与内容节点。
 * 步骤：
 *  1) 渲染组件；
 *  2) 读取根节点 style。
 * 断言：
 *  - style 中包含 --settings-body-height: 480px。
 * 边界/异常：
 *  - 若未来改用其他变量名需同步更新断言。
 */
test("Given custom style When rendering SettingsBody Then applies height variable", () => {
  const { container } = render(
    <SettingsBody style={{ "--settings-body-height": "480px" }}>
      <Navigation />
      <Panel />
    </SettingsBody>,
  );

  expect(container.firstChild).toHaveStyle("--settings-body-height: 480px");
});

/**
 * 测试目标：当提供 measurementProbe 时应挂载探针节点供高度同步逻辑消费。
 * 前置条件：渲染 SettingsBody，传入 measurementProbe。
 * 步骤：
 *  1) 通过 data-testid 查询探针节点；
 *  2) 检查探针节点仍位于文档流中。
 * 断言：
 *  - 探针节点成功渲染。
 * 边界/异常：
 *  - 若未来调整插槽位置，应保证测试能定位到新的探针容器。
 */
test("Given measurement probe When rendering SettingsBody Then renders hidden replica", () => {
  render(
    <SettingsBody
      measurementProbe={<div data-testid="height-probe">probe</div>}
    >
      <Navigation />
      <Panel />
    </SettingsBody>,
  );

  expect(screen.getByTestId("height-probe")).toBeInTheDocument();
});
