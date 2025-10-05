/* eslint-env jest */
import React from "react";
import { render, screen } from "@testing-library/react";
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
