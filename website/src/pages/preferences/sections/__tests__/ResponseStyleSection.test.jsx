import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import ResponseStyleSection from "@/pages/preferences/sections/ResponseStyleSection.jsx";

const baseCopy = {
  loadingLabel: "Loading...",
  savingLabel: "Saving...",
  savedLabel: "Saved",
  errorLabel: "Failed to load",
  retryLabel: "Retry",
  dropdownLabel: "Response tone",
  options: [
    { value: "default", label: "Default", description: "Balanced" },
    { value: "nerd", label: "Nerd", description: "Curious" },
  ],
  fields: [
    { id: "goal", label: "Tagline", placeholder: "Goal" },
    { id: "job", label: "Occupation", placeholder: "Job" },
  ],
};

const createState = (overrides = {}) => ({
  status: "ready",
  values: { responseStyle: "nerd", goal: "110", job: "PM" },
  persisted: { responseStyle: "nerd", goal: "110", job: "PM" },
  savingField: null,
  error: null,
  ...overrides,
});

/**
 * 测试目标：字段值变化后触发 onFieldChange 与 onFieldCommit。
 * 前置条件：提供 ready 状态的响应风格数据。
 * 步骤：
 *  1) 修改 tagline 文本框；
 *  2) 触发 blur。
 * 断言：
 *  - onFieldChange 收到更新值；
 *  - onFieldCommit 被调用一次。
 * 边界/异常：无。
 */
test("Given ready state When editing text field Then change and commit handlers fire", () => {
  const handleChange = jest.fn();
  const handleCommit = jest.fn();
  render(
    <ResponseStyleSection
      title="Response style"
      headingId="response-style"
      state={createState()}
      copy={baseCopy}
      onFieldChange={handleChange}
      onFieldCommit={handleCommit}
    />,
  );

  const tagline = screen.getByLabelText("Tagline");
  fireEvent.change(tagline, { target: { value: "IELTS" } });
  fireEvent.blur(tagline);

  expect(handleChange).toHaveBeenCalledWith("goal", "IELTS");
  expect(handleCommit).toHaveBeenCalledWith("goal");
});

/**
 * 测试目标：在加载态下展示占位文案。
 * 前置条件：status 为 loading 且尚未加载任何值。
 * 步骤：渲染组件并读取提示。
 * 断言：
 *  - 显示 loadingLabel。
 * 边界/异常：无。
 */
test("Given loading state When rendering Then placeholder text appears", () => {
  render(
    <ResponseStyleSection
      title="Response style"
      headingId="response-style"
      state={createState({ status: "loading", values: {}, persisted: {} })}
      copy={baseCopy}
    />,
  );

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

/**
 * 测试目标：保存失败时渲染错误提示并可触发重试。
 * 前置条件：state.error 非空。
 * 步骤：点击重试按钮。
 * 断言：
 *  - 显示错误文案；
 *  - onRetry 被调用。
 * 边界/异常：无。
 */
test("Given error state When retry clicked Then handler invoked", () => {
  const handleRetry = jest.fn();
  render(
    <ResponseStyleSection
      title="Response style"
      headingId="response-style"
      state={createState({ status: "error", error: new Error("boom") })}
      copy={baseCopy}
      onRetry={handleRetry}
    />,
  );

  fireEvent.click(screen.getByText("Retry"));
  expect(handleRetry).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Failed to load")).toBeInTheDocument();
});
