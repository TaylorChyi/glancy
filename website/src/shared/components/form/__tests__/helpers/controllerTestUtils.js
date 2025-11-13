import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import {
  useAuthFormController,
  useFeedbackChannels,
} from "../../authFormController.js";

const createTranslations = (overrides = {}) => ({
  close: "Close",
  codeRequestFailed: "codeRequestFailed",
  codeRequestInvalidMethod: "codeRequestInvalidMethod",
  codeRequestSuccess: "codeRequestSuccess",
  continueButton: "Continue",
  genericRequestFailed: "genericRequestFailed",
  invalidAccount: "invalidAccount",
  loginButton: "Login",
  notImplementedYet: "notImplementedYet",
  otherLoginOptions: "Other options",
  privacyPolicy: "Privacy",
  registerButton: "Register",
  termsOfUse: "Terms",
  toastDismissLabel: "Dismiss",
  ...overrides,
});

const createControllerProps = (overrides = {}) => ({
  formMethods: ["phone", "email"],
  methodOrder: ["phone", "email"],
  defaultMethod: "phone",
  validateAccount: jest.fn(() => true),
  passwordPlaceholder: "Password",
  showCodeButton: () => true,
  icons: { phone: "phone", email: "email" },
  otherOptionsLabel: "",
  placeholders: { phone: "Phone", email: "Email" },
  onRequestCode: jest.fn(() => Promise.resolve()),
  onSubmit: jest.fn(() => Promise.resolve()),
  t: createTranslations(),
  ...overrides,
});

const renderController = (overrides = {}) => {
  const props = createControllerProps(overrides);
  const hook = renderHook(() => useAuthFormController(props));

  return { props, ...hook };
};

const setControllerAccount = (result, value) => {
  act(() => {
    result.current.setAccount(value);
  });
};

const setControllerPassword = (result, value) => {
  act(() => {
    result.current.setPassword(value);
  });
};

const triggerSendCode = async (result) => {
  let success;

  await act(async () => {
    success = await result.current.handleSendCode();
  });

  return success;
};

const triggerSubmit = async (result, eventOverrides = {}) => {
  await act(async () => {
    await result.current.handleSubmit({
      preventDefault: () => {},
      ...eventOverrides,
    });
  });
};

const renderFeedbackChannels = () => renderHook(() => useFeedbackChannels());

const openPopup = (result, message) => {
  act(() => {
    result.current.showPopup(message);
  });
};

const openToast = (result, message) => {
  act(() => {
    result.current.showToast(message);
  });
};

const resetPopup = (result) => {
  act(() => {
    result.current.resetPopup();
  });
};

const resetToast = (result) => {
  act(() => {
    result.current.resetToast();
  });
};

export {
  createTranslations,
  createControllerProps,
  renderController,
  renderFeedbackChannels,
  openPopup,
  openToast,
  resetPopup,
  resetToast,
  setControllerAccount,
  setControllerPassword,
  triggerSendCode,
  triggerSubmit,
};
