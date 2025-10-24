import React, { forwardRef, useImperativeHandle } from "react";
import { render, act } from "@testing-library/react";
import { jest } from "@jest/globals";

import { useShareMenuState } from "../useShareMenuState.js";

const mockShareModel = {
  canShare: true,
  onCopyLink: jest.fn(),
  onExportImage: jest.fn(),
  canExportImage: true,
};

const ShareMenuHarness = forwardRef(function ShareMenuHarness(props, ref) {
  const state = useShareMenuState(props);
  useImperativeHandle(ref, () => state, [state]);
  return null;
});

describe("useShareMenuState", () => {
  /**
   * 测试目标：验证在触发器 ref 被 React 置空后仍保留上一节点，防止误判外部点击。
   * 前置条件：提供包含复制与导出能力的 shareModel，菜单默认关闭。
   * 步骤：
   *  1) 渲染 Hook 并模拟注册触发器节点；
   *  2) 再次注册 null 以模拟 React 提交阶段清空 ref；
   * 断言：
   *  - anchorBoundaryRef.current 仍指向先前的按钮节点；
   *  - shareTriggerRef.current 被清空以保持真实焦点管理。
   * 边界/异常：
   *  - 若未来需要主动清除持久引用，应在此测试同步更新断言。
   */
  it("GivenTriggerRefCleared_WhenReadingAnchorBoundary_ThenRetainsLastNode", () => {
    const ref = React.createRef();
    render(
      <ShareMenuHarness
        ref={ref}
        shareModel={mockShareModel}
        canShare
        disabled={false}
      />,
    );

    const trigger = document.createElement("button");

    act(() => {
      ref.current.registerShareTrigger(trigger);
    });

    expect(ref.current.shareTriggerRef.current).toBe(trigger);
    expect(ref.current.anchorBoundaryRef.current).toBe(trigger);

    act(() => {
      ref.current.registerShareTrigger(null);
    });

    expect(ref.current.shareTriggerRef.current).toBeNull();
    expect(ref.current.anchorBoundaryRef.current).toBe(trigger);
  });
});
