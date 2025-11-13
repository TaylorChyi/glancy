/* eslint-env jest */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import EmailBindingCard from "@shared/components/Profile/EmailBindingCard";

export const translations = {
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

const noop = () => {};

export const buildProps = (overrides = {}) => ({
  email: "",
  mode: "idle",
  isAwaitingVerification: false,
  requestedEmail: "",
  onStart: noop,
  onCancel: noop,
  onRequestCode: noop,
  onConfirm: noop,
  onUnbind: noop,
  t: translations,
  ...overrides,
});

export const renderEmailBindingCard = (overrides = {}) =>
  render(<EmailBindingCard {...buildProps(overrides)} />);

export const renderEditingState = (overrides = {}) =>
  renderEmailBindingCard({
    email: "user@example.com",
    mode: "editing",
    isAwaitingVerification: true,
    requestedEmail: "user@example.com",
    ...overrides,
  });

export const rerenderEmailBindingCard = (rerenderFn, overrides = {}) =>
  rerenderFn(<EmailBindingCard {...buildProps(overrides)} />);

export const requestVerificationCode = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Send code" }));
    await Promise.resolve();
  });
};
