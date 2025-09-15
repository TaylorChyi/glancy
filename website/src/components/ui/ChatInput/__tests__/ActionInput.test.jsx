import { render, fireEvent, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
import { useState } from "react";
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
