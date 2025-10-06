/* eslint-env jest */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

jest.unstable_mockModule("@/components/ui/Avatar", () => ({
  __esModule: true,
  default: ({ className, ...props }) => (
    <div data-testid="mock-avatar" className={className} {...props}>
      avatar
    </div>
  ),
}));

const { default: AccountSection } = await import("../AccountSection.jsx");
const { ACCOUNT_USERNAME_FIELD_TYPE } = await import(
  "../accountSection.constants.js"
);

const baseBindings = Object.freeze({
  title: "Connected accounts",
  items: [],
});

const usernameEditorTranslations = Object.freeze({
  usernamePlaceholder: "请输入用户名",
  changeUsernameButton: "更换用户名",
  saveUsernameButton: "保存用户名",
  saving: "保存中…",
  usernameValidationEmpty: "用户名不能为空",
  usernameValidationTooShort: "至少 {{min}} 个字符",
  usernameValidationTooLong: "最多 {{max}} 个字符",
  usernameUpdateFailed: "更新失败",
});

function createFieldRendererMock() {
  const Component = ({ value }) => (
    <div data-testid="custom-renderer">{value ?? "rendered"}</div>
  );
  Component.propTypes = {
    value: PropTypes.string,
  };
  return (field) => <Component value={field.value} />;
}

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
      fields={[
        {
          id: "username",
          label: "用户名",
          value: "Taylor",
          renderValue: createFieldRendererMock(),
        },
      ]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
        isUploading: false,
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

  expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
});

/**
 * 测试目标：用户名字段的“更换用户名”按钮应呈现在第三列动作区域并右对齐。
 * 前置条件：字段声明 type=ACCOUNT_USERNAME_FIELD_TYPE，提供 UsernameEditor 所需翻译与回调。
 * 步骤：
 *  1) 渲染 AccountSection；
 *  2) 获取用户名行的三个列节点；
 *  3) 查询更换用户名按钮所在列。
 * 断言：
 *  - detail-action 列包含按钮；
 *  - 按钮具备统一的动作样式类。
 * 边界/异常：
 *  - 若 onResolveAction 未返回按钮描述，应降级为空列（此处默认路径覆盖）。
 */
test("GivenUsernameField_WhenRendered_ThenActionButtonOccupiesThirdColumn", () => {
  render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[
        {
          id: "username",
          label: "用户名",
          value: "Taylor",
          type: ACCOUNT_USERNAME_FIELD_TYPE,
          usernameEditorProps: {
            username: "Taylor",
            emptyDisplayValue: "未设置",
            t: usernameEditorTranslations,
            onSubmit: jest.fn(),
            onFailure: jest.fn(),
          },
        },
      ]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
        isUploading: false,
      }}
      bindings={baseBindings}
    />,
  );

  const usernameLabel = screen.getByText("用户名");
  const usernameRow = usernameLabel.closest("div");
  const columns = usernameRow ? [...usernameRow.children] : [];
  expect(columns).toHaveLength(3);
  const actionButton = screen.getByRole("button", { name: "更换用户名" });
  expect(columns[2]).toHaveClass(styles["detail-action"]);
  expect(columns[2]).toContainElement(actionButton);
  expect(actionButton).toHaveClass(styles["detail-action-button"]);
  expect(actionButton).toHaveClass(styles["avatar-trigger"]);
});

/**
 * 测试目标：当上传进行中时，按钮应禁用且 aria-disabled 为 true。
 * 前置条件：传入 identity.isUploading 为 true。
 * 步骤：
 *  1) 渲染组件；
 *  2) 查询“更换头像”按钮。
 * 断言：
 *  - 按钮被禁用；
 *  - aria-disabled 属性为 "true"。
 * 边界/异常：
 *  - 上传完成后应重新启用（由主流程测试覆盖）。
 */
test("GivenUploadingIdentity_WhenRendered_ThenChangeButtonDisabled", () => {
  render(
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
        isUploading: true,
      }}
      bindings={baseBindings}
    />,
  );

  const actionButton = screen.getByRole("button", { name: "更换头像" });
  expect(actionButton).toBeDisabled();
  expect(actionButton).toHaveAttribute("aria-disabled", "true");
});

/**
 * 测试目标：字段 renderValue 回调应被调用以渲染自定义值区块。
 * 前置条件：传入包含 renderValue 的字段数组。
 * 步骤：
 *  1) 渲染组件；
 *  2) 查询自定义渲染结果。
 * 断言：
 *  - detail-value 容器包含自定义渲染节点；
 *  - action 区域为空。
 * 边界/异常：
 *  - 若 renderValue 缺失应回退到 value 文本（在其它用例覆盖）。
 */
test("GivenFieldWithRenderer_WhenRendering_ThenCustomNodeAppears", () => {
  const customField = {
    id: "username",
    label: "用户名",
    value: "Taylor",
    renderValue: createFieldRendererMock(),
  };

  render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[customField]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
        isUploading: false,
      }}
      bindings={baseBindings}
    />,
  );

  const valueCell = screen.getByTestId("custom-renderer").closest("dd");
  expect(valueCell).toHaveClass(styles["detail-value"]);
  const actionCell = valueCell?.parentElement?.querySelector(
    `.${styles["detail-action"]}`,
  );
  if (actionCell) {
    expect(actionCell.querySelector("button")).toBeNull();
  }
});

/**
 * 测试目标：字段动作按钮需在点击时触发传入的 onClick 回调。
 * 前置条件：提供带 onClick 的字段 action；按钮初始为可用状态。
 * 步骤：
 *  1) 渲染 AccountSection 并定位动作按钮；
 *  2) 触发一次点击事件。
 * 断言：
 *  - onClick 回调被调用一次；
 * 边界/异常：
 *  - 若按钮被禁用或未渲染则测试失败。
 */
test("GivenActionHandler_WhenClickingButton_ThenInvokeCallback", async () => {
  const handleClick = jest.fn();
  render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[
        {
          id: "email",
          label: "邮箱",
          value: "ada@example.com",
          action: {
            id: "unbind-email",
            label: "解绑邮箱",
            onClick: handleClick,
          },
        },
      ]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
        isUploading: false,
      }}
      bindings={baseBindings}
    />,
  );

  const user = userEvent.setup();
  const actionButton = screen.getByRole("button", { name: "解绑邮箱" });
  await user.click(actionButton);
  expect(handleClick).toHaveBeenCalledTimes(1);
});

/**
 * 测试目标：当动作处于 pending 态时按钮需禁用并展示 pendingLabel。
 * 前置条件：字段 action 提供 isPending 与 pendingLabel。
 * 步骤：
 *  1) 渲染 AccountSection；
 *  2) 获取动作按钮。
 * 断言：
 *  - 按钮禁用且 aria-disabled 为 true；
 *  - 按钮文案替换为 pendingLabel。
 * 边界/异常：
 *  - 若 pendingLabel 缺失则应回退到原 label（另行覆盖）。
 */
test("GivenPendingAction_WhenRendering_ThenButtonDisabledWithPendingLabel", () => {
  render(
    <AccountSection
      title="Account"
      headingId="account-heading"
      fields={[
        {
          id: "email",
          label: "邮箱",
          value: "ada@example.com",
          action: {
            id: "unbind-email",
            label: "解绑邮箱",
            pendingLabel: "解绑中…",
            isPending: true,
          },
        },
      ]}
      identity={{
        label: "头像",
        displayName: "Taylor",
        changeLabel: "更换头像",
        avatarAlt: "Taylor 的头像",
        onSelectAvatar: jest.fn(),
        isUploading: false,
      }}
      bindings={baseBindings}
    />,
  );

  const actionButton = screen.getByRole("button", { name: "解绑中…" });
  expect(actionButton).toBeDisabled();
  expect(actionButton).toHaveAttribute("aria-disabled", "true");
});
