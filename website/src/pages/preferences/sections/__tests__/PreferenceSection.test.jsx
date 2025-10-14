/**
 * 背景：
 *  - PreferenceSection 抽象自多个设置分区的重复结构，需要通过单测确保语义化外壳与扩展点行为稳定。
 * 目的：
 *  - 验证标题/描述/可自定义插槽在可访问性语义与类名组合上的一致性，防止后续回归破坏。
 * 关键决策与取舍：
 *  - 使用 React Testing Library 聚焦语义断言，避免与具体样式实现强耦合；
 *  - 通过描述渲染回调覆盖视觉隐藏场景，确保 renderDescription 扩展点可靠。
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import PreferenceSection, {
  PREFERENCE_SECTION_VARIANTS,
} from "../PreferenceSection.jsx";
import styles from "../../Preferences.module.css";

/**
 * 测试目标：基础渲染时应输出具名 region，并复用默认 section 与 plain 类。
 * 前置条件：提供标题、headingId 与一个子节点。
 * 步骤：
 *  1) 渲染组件；
 *  2) 获取具名 region 与标题节点；
 * 断言：
 *  - section 具备默认类名与 plain variant；
 *  - 标题元素存在且文本匹配；
 *  - 子节点被渲染。
 * 边界/异常：
 *  - 若未来 variant 默认值调整需同步更新断言。
 */
test("Given basic props When rendering Then section shell and heading appear", () => {
  render(
    <PreferenceSection title="General" headingId="general-section">
      <div data-testid="content">Body</div>
    </PreferenceSection>,
  );

  const region = screen.getByRole("region", { name: "General" });
  expect(region).toHaveClass(styles.section);
  expect(region).toHaveClass(styles["section-plain"]);
  expect(screen.getByRole("heading", { level: 3, name: "General" })).toBeInTheDocument();
  expect(screen.getByTestId("content")).toBeInTheDocument();
});

/**
 * 测试目标：当传入字符串描述时，应生成段落并自动串联 aria-describedby。
 * 前置条件：提供 description 与 descriptionId。
 * 步骤：
 *  1) 渲染组件；
 *  2) 查询描述段落与 section。
 * 断言：
 *  - 描述元素 id 等于传入值；
 *  - section 的 aria-describedby 指向该 id。
 * 边界/异常：
 *  - 若描述为空字符串，则应由组件回退为无描述（未在本用例覆盖）。
 */
test("Given string description When rendering Then description node links via aria", () => {
  render(
    <PreferenceSection
      title="Data"
      headingId="data-heading"
      description="Manage history"
      descriptionId="data-description"
    >
      <div />
    </PreferenceSection>,
  );

  const description = screen.getByText("Manage history");
  expect(description).toHaveAttribute("id", "data-description");
  const region = screen.getByRole("region", { name: "Data" });
  expect(region).toHaveAttribute("aria-describedby", "data-description");
});

/**
 * 测试目标：renderDescription 回调应支持自定义结构并保留 aria 语义。
 * 前置条件：提供 descriptionId 与 renderDescription，description 留空。
 * 步骤：
 *  1) 渲染组件；
 *  2) 获取回调生成的描述元素；
 *  3) 检查 aria-describedby。
 * 断言：
 *  - 描述元素 id 与类名包含默认 class；
 *  - section 的 aria-describedby 指向描述；
 *  - 组件额外 className 合并成功。
 * 边界/异常：
 *  - 若 renderDescription 返回 null，应回退为无描述（需另立用例覆盖）。
 */
test("Given renderDescription When rendering Then custom description integrates", () => {
  render(
    <PreferenceSection
      title="Response"
      headingId="response-heading"
      descriptionId="response-description"
      className="custom-section"
      variant={PREFERENCE_SECTION_VARIANTS.PLAIN}
      renderDescription={({ id, className }) => (
        <p id={id} className={`${className} hidden-copy`}>
          Hidden hint
        </p>
      )}
    >
      <div />
    </PreferenceSection>,
  );

  const description = screen.getByText("Hidden hint");
  expect(description).toHaveClass(styles["section-description"]);
  expect(description).toHaveClass("hidden-copy");
  expect(description).toHaveAttribute("id", "response-description");
  const region = screen.getByRole("region", { name: "Response" });
  expect(region).toHaveAttribute("aria-describedby", "response-description");
  expect(region).toHaveClass("custom-section");
});

/**
 * 测试目标：外部描述 id 覆盖时，即便未渲染描述节点也应保留 aria-describedby。
 * 前置条件：仅传入 describedBy。
 * 步骤：
 *  1) 渲染组件；
 *  2) 检查 section 的 aria-describedby；
 * 断言：
 *  - 属性值等于传入 id；
 *  - DOM 中不存在同名元素。
 * 边界/异常：
 *  - 若后续引入外部描述，需要确保 id 同步存在。
 */
test("Given external describedBy When rendering Then aria mapping persists without node", () => {
  render(
    <PreferenceSection
      title="Subscription"
      headingId="subscription-heading"
      describedBy="subscription-summary"
    >
      <div />
    </PreferenceSection>,
  );

  const region = screen.getByRole("region", { name: "Subscription" });
  expect(region).toHaveAttribute("aria-describedby", "subscription-summary");
  expect(document.getElementById("subscription-summary")).toBeNull();
});
