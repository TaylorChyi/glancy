import { render, fireEvent, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { useState } from "react";

await jest.unstable_mockModule("@/components/ui/Popover/Popover.jsx", () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null),
}));

const { default: ActionInput } = await import(
  "@/components/ui/ChatInput/ActionInput.jsx"
);

/**
 * 测试目标：当输入为空时，动作按钮保持语音态且具备节流效果。
 * 前置条件：提供语音回调与录音中标记。
 * 步骤：
 *  1) 渲染组件并定位语音按钮。
 *  2) 连续点击两次按钮。
 * 断言：
 *  - aria-label 与 aria-pressed 对应语音态。
 *  - 节流生效，仅第一次点击触发语音回调。
 * 边界/异常：
 *  - 验证快速重复点击被忽略。
 */
test("renders voice action for empty value and throttles clicks", () => {
  const onVoice = jest.fn();
  render(
    <ActionInput
      value=""
      onChange={() => {}}
      onSubmit={() => {}}
      onVoice={onVoice}
      voiceLabel="Start voice capture"
      isRecording
    />,
  );

  const voiceButton = screen.getByRole("button", {
    name: "Start voice capture",
  });
  expect(voiceButton).toHaveAttribute("aria-label", "Start voice capture");
  expect(voiceButton).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(voiceButton);
  fireEvent.click(voiceButton);

  expect(onVoice).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：当输入包含文本时，动作按钮切换到发送态并触发表单提交。
 * 前置条件：通过受控组件维护输入值，提供自定义发送与语音标签。
 * 步骤：
 *  1) 输入文本使按钮进入发送态。
 *  2) 点击按钮触发 requestSubmit。
 * 断言：
 *  - aria-label 变为发送文案且 aria-pressed 被移除。
 *  - onSubmit 被调用且输入被清空，按钮回到语音态。
 * 边界/异常：
 *  - 确认状态切换后语音按钮重新出现。
 */
test("switches to send action when populated and submits form", () => {
  const handleSubmit = jest.fn();

  function Wrapper() {
    const [value, setValue] = useState("");
    return (
      <ActionInput
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onSubmit={(event) => {
          handleSubmit(event);
          setValue("");
        }}
        sendLabel="Send message"
        voiceLabel="Resume voice"
      />
    );
  }

  render(<Wrapper />);

  const textarea = screen.getByRole("textbox");
  fireEvent.change(textarea, { target: { value: "hello" } });

  const sendButton = screen.getByRole("button", { name: "Send message" });
  expect(sendButton).toHaveAttribute("aria-label", "Send message");
  expect(sendButton.getAttribute("aria-pressed")).toBeNull();

  fireEvent.click(sendButton);

  expect(handleSubmit).toHaveBeenCalledTimes(1);
  expect(textarea.value).toBe("");
  expect(
    screen.getByRole("button", { name: "Resume voice" }),
  ).toBeInTheDocument();
});

/**
 * 验证输入框在不同回车场景下的提交行为：
 * - 普通 Enter 应触发表单提交；
 * - Shift+Enter 仅插入换行，不触发表单提交。
 */
test("submits on Enter and ignores Shift+Enter", () => {
  const onSubmit = jest.fn();
  render(<ActionInput value="hello" onChange={() => {}} onSubmit={onSubmit} />);
  const textarea = screen.getByRole("textbox");

  fireEvent.keyDown(textarea, { key: "Enter" });
  expect(onSubmit).toHaveBeenCalledTimes(1);

  fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

/**
 * 回车提交后应清空输入框：
 * - 父组件通过 setState 将值重置为空；
 * - 按 Enter 触发提交后，textarea 的值应变为空。
 */
test("clears value via parent state on Enter submit", () => {
  function Wrapper() {
    const [value, setValue] = useState("hello");
    return (
      <ActionInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={() => setValue("")}
      />
    );
  }
  render(<Wrapper />);
  const textarea = screen.getByRole("textbox");
  fireEvent.keyDown(textarea, { key: "Enter" });
  expect(textarea.value).toBe("");
});

/**
 * 验证语言控制面板在提供选项时能够触发下拉与交换事件。
 */
test("handles language selection and swapping", async () => {
  const handleSourceChange = jest.fn();
  const handleTargetChange = jest.fn();
  const handleSwap = jest.fn();

  render(
    <ActionInput
      value=""
      onChange={() => {}}
      onSubmit={() => {}}
      sourceLanguage="CHINESE"
      sourceLanguageOptions={[
        { value: "CHINESE", label: "中文词条" },
        { value: "ENGLISH", label: "英文词条" },
      ]}
      sourceLanguageLabel="源语言"
      onSourceLanguageChange={handleSourceChange}
      targetLanguage="ENGLISH"
      targetLanguageOptions={[
        { value: "ENGLISH", label: "英文释义" },
        { value: "CHINESE", label: "中文释义" },
      ]}
      targetLanguageLabel="目标语言"
      onTargetLanguageChange={handleTargetChange}
      onSwapLanguages={handleSwap}
      swapLabel="交换语向"
    />,
  );

  const sourceButton = screen.getByRole("button", { name: "源语言" });
  fireEvent.click(sourceButton);
  fireEvent.click(
    await screen.findByRole("menuitemradio", { name: /英文词条/ }),
  );
  expect(handleSourceChange).toHaveBeenCalledWith("ENGLISH");

  const targetButton = screen.getByRole("button", { name: "目标语言" });
  fireEvent.click(targetButton);
  fireEvent.click(
    await screen.findByRole("menuitemradio", { name: /中文释义/ }),
  );
  expect(handleTargetChange).toHaveBeenCalledWith("CHINESE");

  const swapButton = screen.getByRole("button", { name: "交换语向" });
  fireEvent.click(swapButton);
  expect(handleSwap).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：确保语言触发按钮在全角/中英文混排的代码下仍保持徽标宽度一致。
 * 前置条件：源/目标语言选项提供长度为两字符的全角代码与中文标签。
 * 步骤：
 *  1) 渲染 ActionInput 并传入包含全角代码的语言配置；
 *  2) 读取源/目标语言按钮的文本内容。
 * 断言：
 *  - 源语言按钮文本前两字符应为“ＺＨ”；
 *  - 目标语言按钮文本前两字符应为“ＥＮ”。
 * 边界/异常：
 *  - 验证文本保留两个字符前缀，以保障布局宽度稳定。
 */
test("renders fullwidth language badges consistently", () => {
  render(
    <ActionInput
      value=""
      onChange={() => {}}
      onSubmit={() => {}}
      sourceLanguage="ＺＨ"
      sourceLanguageOptions={[
        { value: "ＺＨ", label: "中文词条（全角）" },
        { value: "ＥＮ", label: "英文词条（全角）" },
      ]}
      sourceLanguageLabel="源语言"
      targetLanguage="ＥＮ"
      targetLanguageOptions={[
        { value: "ＥＮ", label: "英文释义（全角）" },
        { value: "ＺＨ", label: "中文释义（全角）" },
      ]}
      targetLanguageLabel="目标语言"
    />,
  );

  const sourceButton = screen.getByRole("button", { name: "源语言" });
  const targetButton = screen.getByRole("button", { name: "目标语言" });

  const sourceText = (sourceButton.textContent || "").trim();
  const targetText = (targetButton.textContent || "").trim();

  expect(sourceText.slice(0, 2)).toBe("ＺＨ");
  expect(targetText.slice(0, 2)).toBe("ＥＮ");
});
