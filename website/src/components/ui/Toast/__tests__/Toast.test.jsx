import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toast from "../Toast.jsx";

/**
 * 背景：
 *  - Toast 组件承担多入口的即时反馈提示，需要验证自动关闭与交互语义。
 * 目的：
 *  - 确认组件在定时关闭、自定义样式及用户主动关闭时的表现与无障碍语义。
 * 关键决策与取舍：
 *  - 采用真实渲染 + 假定时器，确保行为测试贴近运行时；避免浅渲染导致副作用缺失。
 * 影响范围：
 *  - 覆盖偏好设置、TTS 等引用 Toast 的场景，保证升级后的提示条兼容。
 * 演进与TODO：
 *  - TODO: 后续可扩展多实例队列时补充并发场景测试。
 */
describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * 测试目标：确认开启状态下会在指定时长后触发 onClose。
   * 前置条件：渲染开启的 Toast，注入 1s 时长与 onClose 桩函数。
   * 步骤：
   *  1) 渲染组件。
   *  2) 推进计时器至接近阈值并断言尚未触发。
   *  3) 再推进 1ms 断言回调执行。
   * 断言：
   *  - onClose 在 1000ms 后被调用一次。
   * 边界/异常：
   *  - 若提前触发或未触发则测试失败。
   */
  test("Given_open_toast_When_duration_elapsed_Then_invokes_onClose_once", () => {
    const handleClose = jest.fn();

    render(
      <Toast
        open
        message="Redeem success"
        duration={1000}
        onClose={handleClose}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：点击关闭按钮应立即触发 onClose 并提供无障碍标签。
   * 前置条件：渲染开启的 Toast。
   * 步骤：
   *  1) 渲染组件。
   *  2) 点击关闭按钮。
   * 断言：
   *  - onClose 被调用一次。
   *  - 按钮的无障碍名称与默认文案一致。
   * 边界/异常：
   *  - 若按钮缺失或文案不匹配则测试失败。
   */
  test("Given_open_toast_When_user_dismisses_Then_calls_onClose_with_default_label", async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<Toast open message="Rate limited" onClose={handleClose} />);

    const dismissButton = screen.getByRole("button", {
      name: /dismiss notification/i,
    });

    await user.click(dismissButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  /**
   * 测试目标：确认背景色/文本色通过 CSS 变量暴露给调用方。
   * 前置条件：传入自定义颜色并保持开启状态。
   * 步骤：
   *  1) 渲染组件。
   *  2) 读取容器的 style 属性。
   * 断言：
   *  - --toast-bg 与 --toast-color 均被赋值。
   * 边界/异常：
   *  - 若变量缺失则说明样式未透出。
   */
  test("Given_custom_palette_When_rendered_Then_exposes_css_variables", () => {
    render(
      <Toast
        open
        message="Custom"
        backgroundColor="var(--brand-primary)"
        textColor="var(--text-inverse-light)"
        onClose={jest.fn()}
      />,
    );

    const toast = screen.getByRole("status");
    expect(toast.style.getPropertyValue("--toast-bg")).toBe("var(--brand-primary)");
    expect(toast.style.getPropertyValue("--toast-color")).toBe(
      "var(--text-inverse-light)",
    );
  });
});
