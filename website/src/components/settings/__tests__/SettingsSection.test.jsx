import { render, screen } from "@testing-library/react";
import SettingsSection from "@/components/settings/SettingsSection";

/**
 * 测试目标：基础渲染应提供标题区与主体插槽，并维持 aria-labelledby 语义。
 * 前置条件：传入最小 classes 配置与子节点。
 * 步骤：
 *  1) 渲染 SettingsSection；
 *  2) 查询标题与主体内容。
 * 断言：
 *  - section 使用提供的 className；
 *  - 标题带有 tabIndex=-1 以兼容焦点管理；
 *  - 子节点出现在 DOM 中。
 * 边界/异常：
 *  - 若标题缺失或未出现在文档中则视为失败。
 */
test("Given base props When rendering Then section skeleton is present", () => {
  render(
    <SettingsSection
      headingId="general-heading"
      title="General"
      classes={{
        section: "section-class",
        header: "header-class",
        title: "title-class",
        divider: "divider-class",
      }}
    >
      <div>Body content</div>
    </SettingsSection>,
  );

  const section = screen.getByRole("region", { name: "General" });
  expect(section).toHaveClass("section-class");
  expect(screen.getByText("General")).toHaveAttribute("tabindex", "-1");
  expect(screen.getByText("Body content")).toBeInTheDocument();
});

/**
 * 测试目标：当传入描述文案与 descriptionId 时，应建立稳定的 aria-describedby 关联。
 * 前置条件：提供 description 与 descriptionId。
 * 步骤：
 *  1) 渲染 SettingsSection；
 *  2) 读取描述节点与 section 元素属性。
 * 断言：
 *  - 描述节点 id 为传入的 descriptionId；
 *  - section 的 aria-describedby 指向该 id。
 * 边界/异常：
 *  - 若关联缺失将影响屏幕阅读器上下文。
 */
test("Given description props When rendering Then aria linkage is stable", () => {
  render(
    <SettingsSection
      headingId="data-heading"
      title="Data"
      description="Control your data"
      descriptionId="data-description"
      classes={{
        section: "section-class",
        header: "header-class",
        title: "title-class",
        divider: "divider-class",
        description: "description-class",
      }}
    >
      <div />
    </SettingsSection>,
  );

  const section = screen.getByRole("region", { name: "Data" });
  const description = screen.getByText("Control your data");

  expect(description).toHaveAttribute("id", "data-description");
  expect(section).toHaveAttribute("aria-describedby", "data-description");
});

/**
 * 测试目标：显式覆写 describedBy 时，组件不会强制渲染分隔线且使用外部描述。
 * 前置条件：提供 describedBy，并设置 showDivider 为 false。
 * 步骤：
 *  1) 渲染组件并查询 section 与分隔线。
 *  2) 检查 aria-describedby 与分隔线存在性。
 * 断言：
 *  - aria-describedby 使用传入值；
 *  - 不渲染分隔线元素。
 * 边界/异常：
 *  - 若仍渲染分隔线或 aria 未覆写则认为失败。
 */
test("Given describedBy override When rendering Then divider omitted and aria respected", () => {
  render(
    <SettingsSection
      headingId="subscription-heading"
      title="Subscription"
      describedBy="external-desc"
      showDivider={false}
      classes={{
        section: "section-class",
        header: "header-class",
        title: "title-class",
      }}
    >
      <div>Plans</div>
    </SettingsSection>,
  );

  const section = screen.getByRole("region", { name: "Subscription" });
  expect(section).toHaveAttribute("aria-describedby", "external-desc");
  expect(section.querySelector(".divider-class")).toBeNull();
});
