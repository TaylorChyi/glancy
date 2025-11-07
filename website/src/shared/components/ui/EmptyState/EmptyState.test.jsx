import { createElement } from "react";
import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
import styles from "./EmptyState.module.css";

// 以 unstable_mockModule 预先替换 ThemeIcon，避免触发主题 orchestrator 的副作用。
jest.unstable_mockModule("@shared/components/ui/Icon", () => ({
  __esModule: true,
  default: ({ decorative, ...props }) => {
    void decorative;
    return createElement("span", { ...props, "data-testid": "theme-icon" });
  },
}));

const { default: EmptyState } = await import("./EmptyState.jsx");

describe("EmptyState", () => {
  /**
   * 测试目标：验证默认 tone=decorated 时，组件会渲染插画容器及对应图标。
   * 前置条件：提供 iconName，保持 tone 默认为 decorated。
   * 步骤：
   *  1) 渲染组件并传入 iconName。
   *  2) 查询插画容器节点。
   * 断言：
   *  - 找到插画容器，说明默认语态仍保留装饰视觉。
   * 边界/异常：
   *  - 若 iconName 缺失资源，ThemeIcon 将 fallback 但仍渲染容器。
   */
  it("GivenDecoratedTone_WhenIconProvided_ThenRendersIllustrationContainer", () => {
    const { container } = render(
      <EmptyState iconName="target" title="标题" description="描述" />,
    );

    expect(container.querySelector(`.${styles.illustration}`)).not.toBeNull();
  });

  /**
   * 测试目标：验证 tone="plain" 时，组件不会渲染插画容器并正确添加纯净态类名。
   * 前置条件：提供 iconName 但 tone 设置为 plain。
   * 步骤：
   *  1) 渲染组件并传入 tone="plain"。
   *  2) 查询插画容器及包装元素。
   * 断言：
   *  - 插画容器不存在；
   *  - 包装元素包含 tone-plain 类。
   * 边界/异常：
   *  - 若外部误传 illustration 节点，依旧应被 tone 约束。
   */
  it("GivenPlainTone_WhenVisualPropsProvided_ThenSkipsIllustrationAndAppliesPlainClass", () => {
    const { container } = render(
      <EmptyState
        iconName="target"
        tone="plain"
        title="标题"
        description="描述"
      />,
    );

    expect(container.querySelector(`.${styles.illustration}`)).toBeNull();
    const wrapper = container.querySelector(`.${styles.wrapper}`);
    expect(wrapper?.classList.contains(styles["tone-plain"])).toBe(true);
  });
});
