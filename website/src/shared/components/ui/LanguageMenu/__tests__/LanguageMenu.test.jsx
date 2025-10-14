import React from "react";
import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LanguageMenu from "../index.jsx";

const baseOptions = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
];

/**
 * 测试目标：fullWidth 策略应为触发器与包装容器标记 data-fullwidth。
 * 前置条件：提供最小选项集并传入 fullWidth。
 * 步骤：
 *  1) 渲染 LanguageMenu 并定位触发按钮。
 * 断言：
 *  - 按钮与包装容器均暴露 data-fullwidth="true" 供样式层消费。
 * 边界/异常：
 *  - 若属性缺失则表明布局策略未生效。
 */
test("Given full width layout When rendered Then expose data attribute for styling", () => {
  render(
    <LanguageMenu
      id="language-menu"
      options={baseOptions}
      value="en"
      onChange={() => {}}
      ariaLabel="System language"
      fullWidth
    />,
  );

  const trigger = screen.getByRole("button", { name: "System language" });
  expect(trigger).toHaveAttribute("data-fullwidth", "true");
  expect(trigger.parentElement).toHaveAttribute("data-fullwidth", "true");
});

/**
 * 测试目标：选择新语言时仍调用 onChange。
 * 前置条件：初始值为 en。
 * 步骤：
 *  1) 打开菜单并点击 Chinese。
 * 断言：
 *  - onChange 收到 zh。
 * 边界/异常：
 *  - 若回调未触发或值不匹配，表明 fullWidth 变更破坏交互。
 */
test("Given menu interaction When selecting option Then propagate change", async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();
  render(
    <LanguageMenu
      id="language-menu"
      options={baseOptions}
      value="en"
      onChange={handleChange}
      ariaLabel="System language"
      fullWidth
    />,
  );

  await user.click(screen.getByRole("button", { name: "System language" }));
  await user.click(screen.getByRole("menuitemradio", { name: /Chinese/i }));

  expect(handleChange).toHaveBeenCalledTimes(1);
  expect(handleChange).toHaveBeenCalledWith("ZH");
});
