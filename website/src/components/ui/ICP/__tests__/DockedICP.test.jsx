import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { jest } from "@jest/globals";
import { DockedICP } from "@/components/ui/ICP";

describe("DockedICP", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  /**
   * 测试目标：初始渲染后 3 秒自动隐藏 ICP 容器。
   * 前置条件：使用假定计时器渲染 DockedICP。
   * 步骤：
   *  1) 渲染组件并获取容器状态。
   *  2) 推进计时器经过初始展示窗口。
   * 断言：
   *  - data-state 由 "visible" 过渡到 "hidden"，否则提示“初始隐藏计时器未生效”。
   * 边界/异常：
   *  - 确认在 3 秒前保持展示。
   */
  test("Given_initialRender_When_timePassesBeyondInitialWindow_Then_hidesDockedICP", () => {
    render(<DockedICP />);
    const container = screen.getByTestId("icp-docked-container");

    expect(container).toHaveAttribute("data-state", "visible");

    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(container).toHaveAttribute("data-state", "visible");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(container).toHaveAttribute("data-state", "hidden");
  });

  /**
   * 测试目标：触发带悬停后展示 5 秒并自动再次隐藏。
   * 前置条件：组件已隐藏；使用假定计时器。
   * 步骤：
   *  1) 渲染组件并推进初始隐藏计时器。
   *  2) 在触发带上触发 pointerEnter。
   *  3) 推进计时器 5 秒观察状态变化。
   * 断言：
   *  - 悬停后立即变为 "visible"；5 秒后回到 "hidden"，否则提示“悬停展示时长异常”。
   * 边界/异常：
   *  - 期间再次推进计时器确保中途不提前隐藏。
   */
  test("Given_hiddenState_When_pointerEntersTrigger_Then_revealsTemporarily", () => {
    render(<DockedICP />);
    const container = screen.getByTestId("icp-docked-container");
    const trigger = screen.getByTestId("icp-reveal-handle");

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(container).toHaveAttribute("data-state", "hidden");

    act(() => {
      fireEvent.pointerEnter(trigger);
    });
    expect(container).toHaveAttribute("data-state", "visible");

    act(() => {
      jest.advanceTimersByTime(4999);
    });
    expect(container).toHaveAttribute("data-state", "visible");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(container).toHaveAttribute("data-state", "hidden");
  });
});
