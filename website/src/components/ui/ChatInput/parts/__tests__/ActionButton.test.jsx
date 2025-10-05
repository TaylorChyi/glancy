/**
 * 背景：
 *  - 发送/语音按钮移除壳体背景后，组件仅依赖语义类驱动配色。
 * 目的：
 *  - 验证输入态切换时的类名是否仍然准确，并确保语音触发的节流行为未受样式调整影响。
 * 关键决策与取舍：
 *  - 使用独立测试聚焦按钮逻辑，避免在上层视图快照中引入多余断言；
 *  - 通过伪造图标组件保持测试纯粹关注 className 与交互回调。
 * 影响范围：
 *  - ChatInput 动作按钮的状态切换与语音触发。
 * 演进与TODO：
 *  - 若未来重新引入多主题色或额外态，需要补充对应断言。
 */
import { render, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

jest.unstable_mockModule("../../icons", () => ({
  SendIcon: ({ className }) => (
    <span data-testid="send" className={className} aria-hidden="true" />
  ),
  VoiceIcon: ({ className }) => (
    <span data-testid="voice" className={className} aria-hidden="true" />
  ),
}));

const { default: ActionButton } = await import("../ActionButton.jsx");

/**
 * 测试目标：输入非空时按钮呈发送态并仅包含发送语义类。
 * 前置条件：value 为非空字符串。
 * 步骤：
 *  1) 渲染组件并获取按钮节点。
 *  2) 读取 className。
 * 断言：
 *  - className 仅包含 action-button 与 action-button-send。
 * 边界/异常：
 *  - 若未来新增语义类，需要同步更新断言集合。
 */
test("GivenNonEmptyInput_WhenRendering_ThenExposeSendClass", () => {
  const { getByRole } = render(
    <ActionButton
      value="hello"
      isRecording={false}
      voiceCooldownRef={{ current: 0 }}
      onVoice={jest.fn()}
      onSubmit={jest.fn()}
      isVoiceDisabled={false}
      sendLabel="发送"
      voiceLabel="语音"
      restoreFocus={jest.fn()}
    />,
  );

  expect(getByRole("button").className.split(" ").sort()).toEqual([
    "action-button",
    "action-button-send",
  ]);
});

/**
 * 测试目标：输入为空时按钮回落到语音态，仅包含语音语义类。
 * 前置条件：value 为空字符串。
 * 步骤：
 *  1) 渲染组件并获取按钮节点。
 *  2) 读取 className。
 * 断言：
 *  - className 仅包含 action-button 与 action-button-voice。
 * 边界/异常：
 *  - 若未来扩展录音态类，需要补充断言。
 */
test("GivenEmptyInput_WhenRendering_ThenExposeVoiceClass", () => {
  const { getByRole } = render(
    <ActionButton
      value=""
      isRecording={false}
      voiceCooldownRef={{ current: 0 }}
      onVoice={jest.fn()}
      onSubmit={jest.fn()}
      isVoiceDisabled={false}
      sendLabel="发送"
      voiceLabel="语音"
      restoreFocus={jest.fn()}
    />,
  );

  expect(getByRole("button").className.split(" ").sort()).toEqual([
    "action-button",
    "action-button-voice",
  ]);
});

/**
 * 测试目标：语音态点击应遵循节流策略，避免重复触发。
 * 前置条件：value 为空、voiceCooldownRef 初始值为 0。
 * 步骤：
 *  1) 渲染组件并连续点击两次按钮。
 *  2) 统计 onVoice 调用次数。
 * 断言：
 *  - onVoice 仅被调用一次。
 * 边界/异常：
 *  - 若未来调整冷却窗口，需要同步修改测试触发节奏。
 */
test("GivenVoiceState_WhenClickingTwice_ThenThrottleVoiceHandler", () => {
  const onVoice = jest.fn();
  const { getByRole } = render(
    <ActionButton
      value=""
      isRecording={false}
      voiceCooldownRef={{ current: 0 }}
      onVoice={onVoice}
      onSubmit={jest.fn()}
      isVoiceDisabled={false}
      sendLabel="发送"
      voiceLabel="语音"
      restoreFocus={jest.fn()}
    />,
  );

  const button = getByRole("button");
  fireEvent.click(button);
  fireEvent.click(button);

  expect(onVoice).toHaveBeenCalledTimes(1);
});
