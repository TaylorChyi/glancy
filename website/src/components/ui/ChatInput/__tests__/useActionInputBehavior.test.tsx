import { render, fireEvent, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import type { ReactElement } from "react";
import useActionInputBehavior from "@/components/ui/ChatInput/hooks/useActionInputBehavior";

const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;

afterEach(() => {
  HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
});

function HookHarness(props: Parameters<typeof useActionInputBehavior>[0]) {
  const { value = "", sendLabel, voiceLabel, ...rest } = props;
  const behavior = useActionInputBehavior({
    value,
    sendLabel: sendLabel ?? "Send",
    voiceLabel: voiceLabel ?? "Voice",
    ...rest,
  });
  const { formProps, textareaProps, actionState, languageState } = behavior;

  return (
    <form data-testid="form" ref={formProps.ref} onSubmit={formProps.onSubmit}>
      <textarea
        data-testid="textarea"
        ref={textareaProps.ref}
        rows={textareaProps.rows}
        placeholder={textareaProps.placeholder}
        value={textareaProps.value}
        onChange={textareaProps.onChange}
        onKeyDown={textareaProps.onKeyDown}
      />
      <button
        type="button"
        data-testid="action"
        onClick={actionState.onAction}
        aria-label={actionState.ariaLabel}
        aria-pressed={actionState.isPressed}
        disabled={actionState.isDisabled}
      >
        {actionState.variant}
      </button>
      {languageState.isVisible ? <div data-testid="language" /> : null}
    </form>
  );
}

function renderHarness(element: ReactElement) {
  return render(element);
}

/**
 * 测试目标：当未提供语音能力时动作按钮应保持禁用态。
 * 前置条件：value 为空，onVoice 未注入。
 * 步骤：
 *  1) 渲染 HookHarness。
 *  2) 读取按钮属性。
 * 断言：
 *  - aria-label 为语音文案；
 *  - aria-pressed 为 false 且按钮禁用。
 * 边界/异常：
 *  - 禁用态下点击不会触发任何副作用。
 */
test("voice variant disables action when no handler is provided", () => {
  renderHarness(<HookHarness value="" voiceLabel="Start voice" />);

  const actionButton = screen.getByTestId("action");
  expect(actionButton).toHaveAttribute("aria-label", "Start voice");
  expect(actionButton).toHaveAttribute("aria-pressed", "false");
  expect(actionButton).toBeDisabled();
});

/**
 * 测试目标：提供语音回调时按钮解禁并在冷却后再次触发。
 * 前置条件：value 为空，onVoice 有效。
 * 步骤：
 *  1) 点击一次按钮触发语音回调。
 *  2) 手动推进时间以越过冷却窗口后再次点击。
 * 断言：
 *  - onVoice 总计被调用两次。
 * 边界/异常：
 *  - 若未越过冷却窗口，调用次数应保持不变。
 */
test("voice action honors cooldown window", () => {
  jest.useFakeTimers();
  try {
    const onVoice = jest.fn();
    renderHarness(<HookHarness value="" onVoice={onVoice} />);

    const actionButton = screen.getByTestId("action");
    expect(actionButton).toHaveAttribute("aria-label", "Voice");
    expect(actionButton).toHaveAttribute("aria-pressed", "false");
    expect(actionButton).not.toBeDisabled();

    fireEvent.click(actionButton);
    expect(onVoice).toHaveBeenCalledTimes(1);

    fireEvent.click(actionButton);
    expect(onVoice).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(600);
    fireEvent.click(actionButton);
    expect(onVoice).toHaveBeenCalledTimes(2);
  } finally {
    jest.useRealTimers();
  }
});

/**
 * 测试目标：有内容时动作按钮切换为发送态并触发提交。
 * 前置条件：value 为非空，模拟 requestSubmit 行为。
 * 步骤：
 *  1) 点击动作按钮。
 *  2) 监听 submit 回调触发。
 * 断言：
 *  - onSubmit 被调用一次。
 * 边界/异常：
 *  - 若 value 为空则不会触发提交（由上一测试覆盖）。
 */
test("send variant triggers submit", () => {
  HTMLFormElement.prototype.requestSubmit = function mockSubmit() {
    const event = new Event("submit", { bubbles: true, cancelable: true });
    this.dispatchEvent(event);
  };
  const handleSubmit = jest.fn();
  renderHarness(
    <HookHarness
      value="hello"
      sendLabel="Send message"
      onSubmit={handleSubmit}
    />,
  );

  const actionButton = screen.getByTestId("action");
  expect(actionButton).toHaveTextContent("send");
  expect(actionButton).toHaveAttribute("aria-label", "Send message");
  expect(actionButton).not.toBeDisabled();

  fireEvent.click(actionButton);
  expect(handleSubmit).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：普通 Enter 触发表单提交，Shift+Enter 仅插入换行。
 * 前置条件：模拟 requestSubmit，value 为非空。
 * 步骤：
 *  1) 在 textarea 上触发 Enter。
 *  2) 在 textarea 上触发 Shift+Enter。
 * 断言：
 *  - onSubmit 仅被调用一次。
 * 边界/异常：
 *  - Shift+Enter 不触发 requestSubmit。
 */
test("enter submits while shift+enter inserts newline", () => {
  HTMLFormElement.prototype.requestSubmit = function mockSubmit() {
    const event = new Event("submit", { bubbles: true, cancelable: true });
    this.dispatchEvent(event);
  };
  const handleSubmit = jest.fn();
  renderHarness(<HookHarness value="hello" onSubmit={handleSubmit} />);

  const textarea = screen.getByTestId("textarea");
  fireEvent.keyDown(textarea, { key: "Enter" });
  expect(handleSubmit).toHaveBeenCalledTimes(1);

  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
  expect(handleSubmit).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：根据语言选项决定语言区显隐。
 * 前置条件：分别提供/不提供语言选项。
 * 步骤：
 *  1) 渲染带选项的实例并确认语言区存在。
 *  2) 重新渲染为空选项并确认语言区隐藏。
 * 断言：
 *  - options 存在时渲染语言区；为空时不渲染。
 * 边界/异常：
 *  - 只要任一侧有选项即展示。
 */
test("language state visibility follows options", () => {
  const { rerender } = renderHarness(
    <HookHarness
      value=""
      sourceLanguageOptions={[{ value: "ZH", label: "中文" }]}
    />,
  );
  expect(screen.getByTestId("language")).toBeInTheDocument();

  rerender(
    <HookHarness
      value=""
      sourceLanguageOptions={[]}
      targetLanguageOptions={[]}
    />,
  );
  expect(screen.queryByTestId("language")).toBeNull();
});

/**
 * 测试目标：自适应高度根据滚动高度与行数上限裁剪。
 * 前置条件：maxRows=2，mock line-height 与 scrollHeight。
 * 步骤：
 *  1) 设置 scrollHeight 与 getComputedStyle 返回值。
 *  2) 触发 change 事件以调用 autoResize。
 * 断言：
 *  - textarea 高度被设置为 48px（lineHeight 24 * maxRows 2）。
 * 边界/异常：
 *  - 若 scrollHeight 更小则取 scrollHeight。
 */
test("auto resize caps height by max rows", () => {
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = () =>
    ({
      lineHeight: "24px",
    }) as unknown as CSSStyleDeclaration;
  try {
    const handleChange = jest.fn();
    renderHarness(<HookHarness value="" maxRows={2} onChange={handleChange} />);

    const textarea = screen.getByTestId("textarea");
    Object.defineProperty(textarea, "scrollHeight", {
      value: 200,
      configurable: true,
    });

    fireEvent.change(textarea, { target: { value: "line1\nline2\nline3" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(textarea.style.height).toBe("48px");
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
});
