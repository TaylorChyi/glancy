/* eslint-env jest */

import { screen, fireEvent, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  renderEmailBindingCard,
  renderEditingState,
  rerenderEmailBindingCard,
  requestVerificationCode,
} from "./helpers/emailBindingCardTestUtils.js";

afterEach(() => {
  jest.useRealTimers();
});

describe("EmailBindingCard summary actions", () => {
  test("GivenBoundEmail_WhenViewingSummary_ThenRenderChangeAndUnbindActions", () => {
    renderEmailBindingCard({
      email: "user@example.com",
      mode: "idle",
    });

    expect(
      screen.getByRole("button", { name: "Change email" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unbind email" })).toBeEnabled();
  });

  test("GivenUnboundEmail_WhenInvokingPrimaryAction_ThenTriggerStartEditing", () => {
    const handleStart = jest.fn();
    renderEmailBindingCard({ onStart: handleStart });

    fireEvent.click(screen.getByRole("button", { name: "Bind email" }));
    expect(handleStart).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Unbind email" })).toBeDisabled();
  });
});

describe("EmailBindingCard editing confirmations", () => {
  test("GivenDifferentBindingStates_WhenEditing_ThenSwitchConfirmLabels", () => {
    const { rerender } = renderEmailBindingCard({
      mode: "editing",
      requestedEmail: "",
    });

    expect(
      screen.getByRole("button", { name: "Confirm binding" }),
    ).toBeInTheDocument();

    rerenderEmailBindingCard(rerender, {
      email: "a@b.com",
      mode: "editing",
      requestedEmail: "a@b.com",
    });

    expect(
      screen.getByRole("button", { name: "Confirm update" }),
    ).toBeInTheDocument();
  });

  test("GivenVerificationReady_WhenSubmitting_ThenForwardToConfirmHandler", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    renderEditingState({
      email: "user@example.com",
      requestedEmail: "user@example.com",
      onConfirm,
    });

    fireEvent.change(screen.getByPlaceholderText("Enter code"), {
      target: { value: "246810" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm update" }));
      await Promise.resolve();
    });

    expect(onConfirm).toHaveBeenCalledWith({
      email: "user@example.com",
      code: "246810",
    });
  });
});

describe("EmailBindingCard code request cooldown", () => {
  test("GivenSuccessfulCodeRequest_WhenCooldownActive_ThenDisableResendAndShowCountdown", async () => {
    jest.useFakeTimers();
    const handleRequestCode = jest.fn().mockResolvedValue(true);

    renderEditingState({ onRequestCode: handleRequestCode });
    await requestVerificationCode();

    expect(handleRequestCode).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: "60s" })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(await screen.findByRole("button", { name: "59s" })).toBeDisabled();
  });

  test("GivenCooldown_WhenReturningToIdle_ThenResetRequestButton", async () => {
    jest.useFakeTimers();
    const handleRequestCode = jest.fn().mockResolvedValue(true);

    const { rerender } = renderEditingState({ onRequestCode: handleRequestCode });
    await requestVerificationCode();

    rerenderEmailBindingCard(rerender, {
      email: "user@example.com",
      mode: "idle",
      requestedEmail: "user@example.com",
      onRequestCode: handleRequestCode,
    });

    rerenderEmailBindingCard(rerender, {
      email: "user@example.com",
      mode: "editing",
      isAwaitingVerification: true,
      requestedEmail: "user@example.com",
      onRequestCode: handleRequestCode,
    });

    expect(screen.getByRole("button", { name: "Send code" })).toBeEnabled();
  });

  /**
   * 测试目标：解绑按钮被点击时应调用 onUnbind。
   * 前置条件：组件处于已绑定查看态，提供 onUnbind mock。
   * 步骤：
   *  1) 渲染组件；
   *  2) 点击 Unbind 按钮。
   * 断言：
   *  - onUnbind 被调用一次。
   * 边界/异常：
   *  - 覆盖解绑操作仍可响应的路径。
   */
  test("GivenBoundEmail_WhenClickingUnbind_ThenInvokeUnbindHandler", () => {
    const handleUnbind = jest.fn();
    renderEmailBindingCard({
      email: "user@example.com",
      mode: "idle",
      onUnbind: handleUnbind,
    });

    fireEvent.click(screen.getByRole("button", { name: "Unbind email" }));

    expect(handleUnbind).toHaveBeenCalledTimes(1);
  });
});
