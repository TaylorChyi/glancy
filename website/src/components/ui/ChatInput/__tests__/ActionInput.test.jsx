import { render, fireEvent, screen } from "@testing-library/react";
import { jest } from "@jest/globals";
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
