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
