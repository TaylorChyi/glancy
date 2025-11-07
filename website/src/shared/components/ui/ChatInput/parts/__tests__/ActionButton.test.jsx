import { render, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../icons", () => ({
  SendIcon: ({ className }) => (
    <span data-testid="send" className={className} aria-hidden="true" />
  ),
}));

const { default: ActionButton } = await import("../ActionButton.jsx");

/**
 * 测试目标：允许发送时按钮应呈现发送语义类并保持可点击。
 * 前置条件：canSubmit=true、onSubmit/restoreFocus 均为桩函数。
 * 步骤：
 *  1) 渲染按钮并获取节点。
 *  2) 触发点击。
 * 断言：
 *  - className 仅包含 action-button 与 action-button-send。
 *  - onSubmit 与 restoreFocus 各被调用一次。
 * 边界/异常：
 *  - 若添加额外语义类，需同步调整断言集合。
 */
test("GivenCanSubmit_WhenClicking_ThenInvokeSubmitAndRestoreFocus", () => {
  const onSubmit = jest.fn();
  const restoreFocus = jest.fn();
  const { getByRole } = render(
    <ActionButton
      canSubmit
      onSubmit={onSubmit}
      sendLabel="发送"
      restoreFocus={restoreFocus}
    />,
  );

  const button = getByRole("button");
  expect(button.className.split(" ").sort()).toEqual([
    "action-button",
    "action-button-send",
  ]);
  fireEvent.click(button);

  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(restoreFocus).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：禁用态下按钮保持发送语义类但不触发提交。
 * 前置条件：canSubmit=false。
 * 步骤：
 *  1) 渲染按钮并点击。
 * 断言：
 *  - 按钮 disabled===true。
 *  - onSubmit 与 restoreFocus 均未被调用。
 * 边界/异常：
 *  - 若禁用策略发生变化，应同步更新断言。
 */
test("GivenCannotSubmit_WhenClicking_ThenSkipHandlers", () => {
  const onSubmit = jest.fn();
  const restoreFocus = jest.fn();
  const { getByRole } = render(
    <ActionButton
      canSubmit={false}
      onSubmit={onSubmit}
      sendLabel="发送"
      restoreFocus={restoreFocus}
    />,
  );

  const button = getByRole("button");
  expect(button.disabled).toBe(true);
  fireEvent.click(button);

  expect(onSubmit).not.toHaveBeenCalled();
  expect(restoreFocus).not.toHaveBeenCalled();
});
