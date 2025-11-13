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
});
