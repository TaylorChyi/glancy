import React from "react";
import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PersonalizationSection from "@/pages/preferences/sections/PersonalizationSection.jsx";

const baseCopy = Object.freeze({
  loadingLabel: "Loading...",
  errorLabel: "Failed to load",
  retryLabel: "Retry",
  emptyLabel: "Not set",
  summaryLabel: "Snapshot",
});

const createSnapshot = (overrides = {}) => ({
  summary: overrides.summary ?? "Engineer · B2",
  hasDetails: overrides.hasDetails ?? true,
  fields:
    overrides.fields ??
    [
      { id: "job", label: "Occupation", value: "Engineer" },
      { id: "goal", label: "Goal", value: "B2" },
    ],
  customSections: overrides.customSections ?? [],
});

/**
 * 测试目标：在加载状态下展示 loading 文案。
 * 前置条件：传入 status 为 loading。
 * 步骤：
 *  1) 渲染组件。
 * 断言：
 *  - loadingLabel 出现在文案中。
 * 边界/异常：
 *  - 若状态未处理应导致断言失败。
 */
test("Given loading state When rendered Then show loading copy", () => {
  render(
    <PersonalizationSection
      title="Personalization"
      message="Describe yourself"
      headingId="personalization-heading"
      state={{ status: "loading", snapshot: createSnapshot() }}
      copy={baseCopy}
    />,
  );

  expect(screen.getByText(baseCopy.loadingLabel)).toBeInTheDocument();
});

/**
 * 测试目标：在 ready 状态下渲染字段与摘要。
 * 前置条件：传入包含字段的快照。
 * 步骤：
 *  1) 渲染组件。
 * 断言：
 *  - 字段标签与取值展示；
 *  - 摘要渲染；
 *  - 无 loading 文案。
 * 边界/异常：
 *  - 若 hasDetails 为 false 应显示 empty 文案。
 */
test("Given ready state When rendered Then show summary and fields", () => {
  render(
    <PersonalizationSection
      title="Personalization"
      message="Describe yourself"
      headingId="personalization-heading"
      state={{ status: "ready", snapshot: createSnapshot() }}
      copy={baseCopy}
    />,
  );

  expect(screen.getByText("Snapshot")).toBeInTheDocument();
  expect(screen.getByText("Engineer")).toBeInTheDocument();
  expect(screen.queryByText(baseCopy.loadingLabel)).not.toBeInTheDocument();
});

/**
 * 测试目标：在 error 状态点击按钮会触发 onRetry。
 * 前置条件：传入 error 状态与 mock 回调。
 * 步骤：
 *  1) 渲染组件。
 *  2) 点击 Retry 按钮。
 * 断言：
 *  - onRetry 被调用。
 * 边界/异常：
 *  - 若按钮缺失则断言失败。
 */
test("Given error state When retry clicked Then delegate invoked", async () => {
  const user = userEvent.setup();
  const retry = jest.fn();

  render(
    <PersonalizationSection
      title="Personalization"
      message="Describe yourself"
      headingId="personalization-heading"
      state={{ status: "error", snapshot: createSnapshot(), error: new Error("x") }}
      copy={baseCopy}
      onRetry={retry}
    />,
  );

  await user.click(screen.getByRole("button", { name: baseCopy.retryLabel }));

  expect(retry).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：无详情时展示空状态文案。
 * 前置条件：快照 hasDetails 为 false。
 * 步骤：
 *  1) 渲染组件。
 * 断言：
 *  - 显示 emptyLabel。
 * 边界/异常：
 *  - 若错误显示字段则断言失败。
 */
test("Given empty snapshot When rendered Then show fallback placeholder", () => {
  render(
    <PersonalizationSection
      title="Personalization"
      message="Describe yourself"
      headingId="personalization-heading"
      state={{
        status: "ready",
        snapshot: createSnapshot({ hasDetails: false, fields: [], customSections: [] }),
      }}
      copy={baseCopy}
    />,
  );

  expect(screen.getByText(baseCopy.emptyLabel)).toBeInTheDocument();
});
