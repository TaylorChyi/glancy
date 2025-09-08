/* eslint-env jest */
import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import Button from "../index.jsx";

/**
 * 验证点击事件在启用状态下能够触发。
 */
test("calls onClick when enabled", () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);
  fireEvent.click(screen.getByRole("button"));
  expect(handleClick).toHaveBeenCalledTimes(1);
});

/**
 * 验证按钮在禁用状态下不会触发点击事件。
 */
test("does not call onClick when disabled", () => {
  const handleClick = jest.fn();
  render(
    <Button onClick={handleClick} disabled>
      Disabled
    </Button>,
  );
  fireEvent.click(screen.getByRole("button"));
  expect(handleClick).not.toHaveBeenCalled();
});
