import React from "react";
import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SegmentedControl from "../SegmentedControl.jsx";

const createOptions = () => [
  { id: "light", value: "light", label: "Light" },
  { id: "dark", value: "dark", label: "Dark" },
  { id: "system", value: "system", label: "System" },
];

/**
 * 测试目标：组件应根据 value 标记当前选项的选中态。
 * 前置条件：value 为 "dark"。
 * 步骤：
 *  1) 渲染 SegmentedControl。
 * 断言：
 *  - Dark 按钮 aria-checked=true，其余为 false。
 * 边界/异常：
 *  - 如 aria-checked 未按 value 更新则视为失败。
 */
test("Given current value When rendered Then option reflects selection", () => {
  render(
    <SegmentedControl
      labelledBy="theme-legend"
      value="dark"
      options={createOptions()}
    />,
  );

  expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

/**
 * 测试目标：点击非当前选项应调用 onChange 返回其值。
 * 前置条件：当前值为 "light"，提供 onChange mock。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击 "System" 选项。
 * 断言：
 *  - onChange 收到 "system"。
 * 边界/异常：
 *  - 重复点击当前选项不会重复触发。
 */
test("Given selectable options When choosing another value Then handler invoked", async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();

  render(
    <SegmentedControl
      labelledBy="theme-legend"
      value="light"
      options={createOptions()}
      onChange={handleChange}
    />,
  );

  await user.click(screen.getByRole("radio", { name: "System" }));

  expect(handleChange).toHaveBeenCalledTimes(1);
  expect(handleChange).toHaveBeenCalledWith(
    "system",
    expect.objectContaining({ id: "system" }),
  );

  await user.click(screen.getByRole("radio", { name: "Light" }));

  expect(handleChange).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：当 disabled=true 时点击任一选项不会触发 onChange。
 * 前置条件：组件处于禁用态。
 * 步骤：
 *  1) 渲染组件并点击不同选项。
 * 断言：
 *  - onChange 未被调用。
 * 边界/异常：
 *  - 若禁用态仍触发 onChange 应提示状态未生效。
 */
test("Given disabled control When clicking options Then ignore interactions", async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();

  render(
    <SegmentedControl
      ariaLabel="Theme"
      value="system"
      options={createOptions()}
      onChange={handleChange}
      disabled
    />,
  );

  await user.click(screen.getByRole("radio", { name: "Light" }));
  await user.click(screen.getByRole("radio", { name: "Dark" }));

  expect(handleChange).not.toHaveBeenCalled();
});

/**
 * 测试目标：禁用的个别选项不会触发 onChange。
 * 前置条件：第二个选项 disabled=true。
 * 步骤：
 *  1) 点击被禁用的 Dark。
 * 断言：
 *  - onChange 未被调用。
 */
test("Given disabled option When clicking it Then selection ignored", async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();

  render(
    <SegmentedControl
      ariaLabel="Theme"
      value="light"
      options={[
        { id: "light", value: "light", label: "Light" },
        { id: "dark", value: "dark", label: "Dark", disabled: true },
      ]}
      onChange={handleChange}
    />,
  );

  await user.click(screen.getByRole("radio", { name: "Dark" }));

  expect(handleChange).not.toHaveBeenCalled();
});
