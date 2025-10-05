/**
 * 背景：
 *  - ActionButton 新增的主题感知逻辑需确保在测试层面有稳定保障，避免未来回归导致浅色主题下对比度倒退。
 * 目的：
 *  - 针对浅色与暗色两种主题分别断言图标语义类是否正确注入，同时覆盖语音态分支。
 * 关键决策与取舍：
 *  - 通过独立测试文件隔离 ActionButton，避免在 ActionInputView 快照中混入过多行为断言；
 *  - 使用 jest 模块模拟以减轻对真实 Icon 资源的依赖，保持测试专注于类名。
 * 影响范围：
 *  - ChatInput 动作按钮的主题覆盖逻辑及其回归测试基线。
 * 演进与TODO：
 *  - 如未来引入更多主题态或动画，需要扩展测试覆盖新的 className 与行为。
 */
import { render, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockUseTheme = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

jest.unstable_mockModule("../../icons", () => ({
  SendIcon: ({ className }) => (
    <span data-testid="send" className={className} aria-hidden="true" />
  ),
  VoiceIcon: ({ className }) => (
    <span data-testid="voice" className={className} aria-hidden="true" />
  ),
}));

const { default: ActionButton } = await import("../ActionButton.jsx");

beforeEach(() => {
  mockUseTheme.mockReturnValue({ resolvedTheme: "light" });
});

afterEach(() => {
  mockUseTheme.mockReset();
});

/**
 * 测试目标：亮色主题下发送态按钮应加入反相类以保障图标对比度。
 * 前置条件：resolvedTheme="light"，输入值非空触发发送态。
 * 步骤：
 *  1) 渲染 ActionButton，传入非空 value。
 *  2) 查询按钮并读取 className。
 * 断言：
 *  - className 包含 action-button-inverse-icon。
 * 边界/异常：
 *  - 若未来调整类名，需要同步更新断言避免误报。
 */
test("GivenLightThemeAndSendState_WhenRendering_ThenApplyInverseToneClass", () => {
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

  expect(getByRole("button").className).toContain("action-button-inverse-icon");
});

/**
 * 测试目标：暗色主题下保持默认色彩，不应附加反相类。
 * 前置条件：resolvedTheme="dark"，输入值非空保证发送态。
 * 步骤：
 *  1) mockUseTheme 返回暗色主题。
 *  2) 渲染组件并读取 className。
 * 断言：
 *  - className 不包含 action-button-inverse-icon。
 * 边界/异常：
 *  - 如未来引入高对比主题，需扩展此用例覆盖新逻辑。
 */
test("GivenDarkThemeAndSendState_WhenRendering_ThenKeepDefaultTone", () => {
  mockUseTheme.mockReturnValueOnce({ resolvedTheme: "dark" });

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

  expect(getByRole("button").className).not.toContain(
    "action-button-inverse-icon",
  );
});

/**
 * 测试目标：亮色主题下语音态同样继承反相类，保证空输入时按钮对比度。
 * 前置条件：resolvedTheme="light"，value 为空触发语音态。
 * 步骤：
 *  1) 渲染组件并点击按钮触发语音逻辑。
 *  2) 查询按钮的 className。
 * 断言：
 *  - className 包含 action-button-inverse-icon。
 * 边界/异常：
 *  - 若未来为语音态提供独立色彩，应更新此断言。
 */
test("GivenLightThemeAndVoiceState_WhenRendering_ThenApplyInverseToneClass", () => {
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
  expect(button.className).toContain("action-button-inverse-icon");

  fireEvent.click(button);
  expect(onVoice).toHaveBeenCalledTimes(1);
});
