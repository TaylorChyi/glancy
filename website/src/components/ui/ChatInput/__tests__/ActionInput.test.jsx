import { render, fireEvent, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { useState } from "react";

jest.mock("@/components/ui/Popover/Popover.jsx", () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div>{children}</div> : null),
}));

import ActionInput from "@/components/ui/ChatInput/ActionInput.jsx";

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
    await screen.findByRole("menuitemradio", { name: "英文词条" }),
  );
  expect(handleSourceChange).toHaveBeenCalledWith("ENGLISH");

  const targetButton = screen.getByRole("button", { name: "目标语言" });
  fireEvent.click(targetButton);
  fireEvent.click(
    await screen.findByRole("menuitemradio", { name: "中文释义" }),
  );
  expect(handleTargetChange).toHaveBeenCalledWith("CHINESE");

  const swapButton = screen.getByRole("button", { name: "交换语向" });
  fireEvent.click(swapButton);
  expect(handleSwap).toHaveBeenCalledTimes(1);
});
