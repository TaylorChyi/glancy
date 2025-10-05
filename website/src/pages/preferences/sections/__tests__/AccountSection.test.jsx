/* eslint-env jest */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { jest } from "@jest/globals";

jest.unstable_mockModule("@/components/ui/Avatar", () => ({
  __esModule: true,
  default: ({ className, ...props }) => (
    <div data-testid="mock-avatar" className={className} {...props}>
      avatar
    </div>
  ),
}));

const { default: AccountSection } = await import("../AccountSection.jsx");

const baseBindings = Object.freeze({
  title: "Connected accounts",
  items: [],
});

/**
 * 测试目标：头像行展示为“标签-头像-操作”三列结构且按钮可用。
 * 前置条件：提供包含标签、头像替代文本与操作文案的 identity；绑定区无项。
 * 步骤：
 *  1) 渲染 AccountSection 组件；
 *  2) 获取头像行的列节点；
 *  3) 查询头像与操作按钮。
 * 断言：
 *  - 第一列标签节点文本为“头像”；
 *  - 第二列包含头像占位元素与隐藏用户名；
 *  - 第三列按钮文案为“更换头像”且处于可点击状态。
 * 边界/异常：
 *  - 若 identity.displayName 缺失，应保证头像 aria-hidden 为 true（另行覆盖）。
 */
test("GivenIdentityRow_WhenRendered_ThenLabelAvatarAndActionArranged", () => {
  const { container } = render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
      }}
      bindings={baseBindings}
    />,
  );

  const identityLabel = screen.getByText("头像");
  expect(identityLabel.tagName).toBe("DT");

  const identityRow = identityLabel.closest("div");
  expect(identityRow).not.toBeNull();

  const columnElements = identityRow ? [...identityRow.children] : [];
  expect(columnElements).toHaveLength(3);

  const [labelColumn, valueColumn, actionColumn] = columnElements;
  expect(labelColumn).toBe(identityLabel);
  expect(valueColumn.tagName).toBe("DD");

  const avatar = screen.getByTestId("mock-avatar");
  expect(valueColumn).toContainElement(avatar);
  expect(avatar.getAttribute("aria-hidden")).toBe("false");
  const hiddenName = valueColumn.querySelector("span");
  expect(hiddenName?.textContent).toBe("Taylor");

  const actionButton = screen.getByRole("button", { name: "更换头像" });
  expect(actionColumn).toContainElement(actionButton);
  expect(actionButton).toBeEnabled();

  expect(container.querySelectorAll("input[type=\"file\"]")).toHaveLength(1);
});

/**
 * 测试目标：用户名字段在查看态仅展示文本，点击按钮触发提交回调。
 * 前置条件：传入 editable.mode=view 的字段。
 * 步骤：
 *  1) 渲染组件并定位按钮；
 *  2) 点击按钮触发 onSubmit。
 * 断言：
 *  - 查看态不渲染输入框；
 *  - 按钮文案为“更换用户名”；
 *  - 点击后 onSubmit 被调用一次。
 * 边界/异常：
 *  - editable.onSubmit 负责切换状态，组件不自行管理。
 */
test("GivenEditableFieldInViewMode_WhenClickingAction_ThenInvokeSubmit", () => {
  const handleSubmit = jest.fn();
  render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[
        {
          id: "username",
          label: "用户名",
          value: "taylor",
          editable: {
            mode: "view",
            draftValue: "taylor",
            placeholder: "请输入用户名",
            buttonLabel: "更换用户名",
            isBusy: false,
            errorMessage: "",
            onChange: jest.fn(),
            onSubmit: handleSubmit,
            name: "username",
          },
        },
      ]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
      }}
      bindings={baseBindings}
    />,
  );

  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  const actionButton = screen.getByRole("button", { name: "更换用户名" });
  fireEvent.click(actionButton);
  expect(handleSubmit).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：用户名字段在编辑态应渲染文本框与错误提示，并使用保存文案。
 * 前置条件：editable.mode=edit，带有 errorMessage。
 * 步骤：
 *  1) 渲染组件；
 *  2) 查询输入框与错误文案；
 *  3) 校验按钮文案。
 * 断言：
 *  - 输入框存在且 aria-invalid=true；
 *  - 错误提示文本存在；
 *  - 按钮文案为“保存用户名”。
 * 边界/异常：
 *  - 保存态按钮仍复用 editable.onSubmit（在 Hook 内处理）。
 */
test("GivenEditableFieldInEditMode_WhenRendering_ThenShowInputAndError", () => {
  render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[
        {
          id: "username",
          label: "用户名",
          value: "taylor",
          editable: {
            mode: "edit",
            draftValue: "taylor_new",
            placeholder: "请输入用户名",
            buttonLabel: "保存用户名",
            isBusy: false,
            errorMessage: "用户名格式错误",
            onChange: jest.fn(),
            onSubmit: jest.fn(),
            name: "username",
          },
        },
      ]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
      }}
      bindings={baseBindings}
    />,
  );

  const input = screen.getByPlaceholderText("请输入用户名");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText("用户名格式错误")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "保存用户名" })).toBeInTheDocument();
});
