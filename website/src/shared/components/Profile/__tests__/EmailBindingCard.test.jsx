/* eslint-env jest */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import EmailBindingCard from "@shared/components/Profile/EmailBindingCard";

const t = {
  emailBindingTitle: "Email binding",
  emailBoundDescription: "Bound description",
  emailUnboundDescription: "Unbound description",
  emailStatusBound: "Bound",
  emailStatusUnbound: "Unbound",
  emailInputLabel: "New email",
  emailInputPlaceholder: "example@domain.com",
  emailCodeLabel: "Verification code",
  emailCodePlaceholder: "Enter code",
  emailSendCode: "Send code",
  emailSendingCode: "Sending",
  emailVerifying: "Verifying",
  emailConfirmBind: "Confirm binding",
  emailConfirmChange: "Confirm update",
  emailCancel: "Cancel",
  emailCurrentLabel: "Current email",
  emailEmptyValue: "Not linked",
  emailChangeAction: "Change email",
  emailBindAction: "Bind email",
  emailUnbindAction: "Unbind email",
  emailUnbinding: "Removing",
  emailVerificationIntro: "Request a code first",
  emailAwaitingCode: "Awaiting code",
  emailVerificationPending: "Code sent",
  emailVerificationMismatch: "Email mismatch",
  emailStepInput: "Step 1",
  emailStepVerify: "Step 2",
};

describe("EmailBindingCard", () => {
  /**
   * 测试目标：已绑定邮箱的查看态应展示“更换邮箱”与可点击的“解绑邮箱”。
   * 前置条件：传入 email 值、mode=idle，并提供基础交互回调。
   * 步骤：
   *  1) 渲染组件后查询按钮；
   *  2) 校验解绑按钮启用状态。
   * 断言：
   *  - 主操作按钮文案为 Change email；
   *  - 解绑按钮可点击。
   * 边界/异常：
   *  - 覆盖 hasBoundEmail 分支。
   */
  test("GivenBoundEmail_WhenViewingSummary_ThenRenderChangeAndUnbindActions", () => {
    render(
      <EmailBindingCard
        email="user@example.com"
        mode="idle"
        isAwaitingVerification={false}
        requestedEmail=""
        onStart={jest.fn()}
        onCancel={jest.fn()}
        onRequestCode={jest.fn()}
        onConfirm={jest.fn()}
        onUnbind={jest.fn()}
        t={t}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Change email" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unbind email" })).toBeEnabled();
  });

  /**
   * 测试目标：未绑定邮箱的查看态主操作应为“绑定邮箱”并触发 onStart。
   * 前置条件：email 为空串，mode=idle，提供 onStart mock。
   * 步骤：
   *  1) 渲染组件并点击“Bind email”；
   *  2) 校验解绑按钮禁用。
   * 断言：
   *  - onStart 被调用一次；
   *  - 解绑按钮处于禁用状态。
   * 边界/异常：
   *  - 覆盖未绑定分支。
   */
  test("GivenUnboundEmail_WhenInvokingPrimaryAction_ThenTriggerStartEditing", () => {
    const handleStart = jest.fn();
    render(
      <EmailBindingCard
        email=""
        mode="idle"
        isAwaitingVerification={false}
        requestedEmail=""
        onStart={handleStart}
        onCancel={jest.fn()}
        onRequestCode={jest.fn()}
        onConfirm={jest.fn()}
        onUnbind={jest.fn()}
        t={t}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bind email" }));
    expect(handleStart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Unbind email" })).toBeDisabled();
  });

  /**
   * 测试目标：编辑态的确认按钮文案应依据是否已绑定邮箱呈现绑定或换绑。
   * 前置条件：分别渲染已绑定与未绑定两种编辑态。
   * 步骤：
   *  1) 渲染 email="" 且 mode=editing 的组件；
   *  2) 渲染 email="a@b.com" 且 mode=editing 的组件。
   * 断言：
   *  - 未绑定时按钮文案为 Confirm binding；
   *  - 已绑定时按钮文案为 Confirm update。
   * 边界/异常：
   *  - 确保文案切换不依赖验证码状态。
   */
  test("GivenDifferentBindingStates_WhenEditing_ThenSwitchConfirmLabels", () => {
    const { rerender } = render(
      <EmailBindingCard
        email=""
        mode="editing"
        isAwaitingVerification={false}
        requestedEmail=""
        onStart={jest.fn()}
        onCancel={jest.fn()}
        onRequestCode={jest.fn()}
        onConfirm={jest.fn()}
        onUnbind={jest.fn()}
        t={t}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirm binding" }),
    ).toBeInTheDocument();

    rerender(
      <EmailBindingCard
        email="a@b.com"
        mode="editing"
        isAwaitingVerification={false}
        requestedEmail="a@b.com"
        onStart={jest.fn()}
        onCancel={jest.fn()}
        onRequestCode={jest.fn()}
        onConfirm={jest.fn()}
        onUnbind={jest.fn()}
        t={t}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirm update" }),
    ).toBeInTheDocument();
  });

  /**
   * 测试目标：验证码发送后应进入倒计时，禁用按钮并动态更新剩余秒数。
   * 前置条件：启用假定时器，onRequestCode 返回 Promise<true>，组件处于编辑态。
   * 步骤：
   *  1) 点击发送验证码按钮触发请求；
   *  2) 推进定时器 1 秒，检查按钮文案；
   *  3) 切换至 idle 态，确认倒计时重置。
   * 断言：
   *  - 初始倒计时显示 60s 并禁用按钮；
   *  - 推进后变为 59s；
   *  - 返回 idle 态后文案恢复为 Send code 且按钮启用。
   * 边界/异常：
   *  - 覆盖 onRequestCode 返回 true 的路径及倒计时重置逻辑。
   */
  test("GivenSuccessfulCodeRequest_WhenCooldownActive_ThenDisableResendAndShowCountdown", async () => {
    jest.useFakeTimers();
    const handleRequestCode = jest.fn().mockResolvedValue(true);

    try {
      const { rerender } = render(
        <EmailBindingCard
          email="user@example.com"
          mode="editing"
          isAwaitingVerification
          requestedEmail="user@example.com"
          onStart={jest.fn()}
          onCancel={jest.fn()}
          onRequestCode={handleRequestCode}
          onConfirm={jest.fn()}
          onUnbind={jest.fn()}
          t={t}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Send code" }));
        await Promise.resolve();
      });

      expect(handleRequestCode).toHaveBeenCalledTimes(1);
      expect(await screen.findByRole("button", { name: "60s" })).toBeDisabled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(await screen.findByRole("button", { name: "59s" })).toBeDisabled();

      rerender(
        <EmailBindingCard
          email="user@example.com"
          mode="idle"
          isAwaitingVerification={false}
          requestedEmail="user@example.com"
          onStart={jest.fn()}
          onCancel={jest.fn()}
          onRequestCode={handleRequestCode}
          onConfirm={jest.fn()}
          onUnbind={jest.fn()}
          t={t}
        />,
      );

      rerender(
        <EmailBindingCard
          email="user@example.com"
          mode="editing"
          isAwaitingVerification
          requestedEmail="user@example.com"
          onStart={jest.fn()}
          onCancel={jest.fn()}
          onRequestCode={handleRequestCode}
          onConfirm={jest.fn()}
          onUnbind={jest.fn()}
          t={t}
        />,
      );

      expect(screen.getByRole("button", { name: "Send code" })).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });
});
