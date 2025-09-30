import { act, renderHook } from "@testing-library/react";

import useBottomPanelState, {
  PANEL_MODE_ACTIONS,
  PANEL_MODE_SEARCH,
} from "../useBottomPanelState";

/**
 * 测试目标：在存在释义且输入为空时自动回落至动作面板。
 * 前置条件：hasDefinition=true，text=""。
 * 步骤：
 *  1) 渲染 Hook 并保持默认焦点状态（未聚焦）。
 *  2) 触发 effect 观察 mode 变化。
 * 断言：
 *  - mode 切换为 PANEL_MODE_ACTIONS。
 * 边界/异常：
 *  - 当 hasDefinition 置为 false 时自动回到搜索模式。
 */
test("GivenDefinitionWithoutFocus_WhenEvaluating_ThenFallbackToActionsPanel", () => {
  const { result, rerender } = renderHook(
    ({ hasDefinition, text }) => useBottomPanelState({ hasDefinition, text }),
    {
      initialProps: { hasDefinition: true, text: "" },
    },
  );

  expect(result.current.mode).toBe(PANEL_MODE_ACTIONS);

  rerender({ hasDefinition: false, text: "" });

  expect(result.current.mode).toBe(PANEL_MODE_SEARCH);
});

/**
 * 测试目标：点击搜索按钮激活搜索模式并在聚焦后保持该状态。
 * 前置条件：hasDefinition=true，text=空字符串。
 * 步骤：
 *  1) 主动调用 activateSearchMode。
 *  2) 触发 handleFocusChange(true)。
 * 断言：
 *  - mode 维持在 PANEL_MODE_SEARCH。
 * 边界/异常：
 *  - 失焦后回落至动作模式。
 */
test("GivenManualSearchRequest_WhenFocusGained_ThenStayInSearchMode", () => {
  const { result } = renderHook(() =>
    useBottomPanelState({ hasDefinition: true, text: "" }),
  );

  act(() => {
    result.current.activateSearchMode();
    result.current.handleFocusChange(true);
  });

  expect(result.current.mode).toBe(PANEL_MODE_SEARCH);

  act(() => {
    result.current.handleFocusChange(false);
  });

  expect(result.current.mode).toBe(PANEL_MODE_ACTIONS);
});

/**
 * 测试目标：滚动事件在存在释义时强制回退至动作面板。
 * 前置条件：hasDefinition=true，先进入搜索模式。
 * 步骤：
 *  1) 通过 handleFocusChange(true) 进入搜索模式。
 *  2) 调用 handleScrollEscape。
 * 断言：
 *  - mode 最终为 PANEL_MODE_ACTIONS。
 * 边界/异常：
 *  - 若 hasDefinition=false 不应切换（通过先验用例覆盖）。
 */
test("GivenScrollEscape_WhenDefinitionExists_ThenReturnToActionsMode", () => {
  const { result } = renderHook(() =>
    useBottomPanelState({ hasDefinition: true, text: "query" }),
  );

  act(() => {
    result.current.handleFocusChange(true);
  });

  expect(result.current.mode).toBe(PANEL_MODE_SEARCH);

  act(() => {
    result.current.handleScrollEscape();
  });

  expect(result.current.mode).toBe(PANEL_MODE_ACTIONS);
});
