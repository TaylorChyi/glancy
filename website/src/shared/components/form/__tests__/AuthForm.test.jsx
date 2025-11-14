/* eslint-env jest */
import { jest } from "@jest/globals";
import {
  resolveInitialMethod,
  sanitizeAccount,
} from "../authFormController.js";
import {
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
} from "./helpers/controllerTestUtils.js";

describe("AuthForm structural helpers", () => {
  test("resolveInitialMethod prioritizes username when available", () => {
    const methods = ["email", "username", "phone"];
    const resolved = resolveInitialMethod(methods, "email");
    expect(resolved).toBe("username");
  });

  test("resolveInitialMethod uses preferred method when username missing", () => {
    const methods = ["phone", "email"];
    const resolved = resolveInitialMethod(methods, "phone");
    expect(resolved).toBe("phone");
  });

  test("sanitizeAccount trims string values and preserves objects", () => {
    expect(sanitizeAccount("  foo  ")).toBe("foo");
    const value = { data: 1 };
    expect(sanitizeAccount(value)).toBe(value);
  });
});

describe("useFeedbackChannels", () => {
  test("toggles popup and toast states", () => {
    const { result } = renderFeedbackChannels();

    openPopup(result, "error");
    openToast(result, "success");

    expect(result.current.popup).toEqual({ open: true, message: "error" });
    expect(result.current.toast).toEqual({ open: true, message: "success" });

    resetPopup(result);
    resetToast(result);

    expect(result.current.popup).toEqual({ open: false, message: "" });
    expect(result.current.toast).toEqual({ open: false, message: "" });
  });
});

describe("useAuthFormController handleSendCode", () => {
  test("requests code when account validation succeeds", async () => {
    const { props, result } = renderController();

    setControllerAccount(result, " 1234567890 ");
    const success = await triggerSendCode(result);

    expect(success).toBe(true);
    expect(props.onRequestCode).toHaveBeenCalledWith({
      account: "1234567890",
      method: "phone",
    });
    expect(result.current.toast).toEqual({
      open: true,
      message: props.t.codeRequestSuccess,
    });
    expect(props.validateAccount).toHaveBeenCalledWith("1234567890", "phone");
  });

  test("blocks code request when account validation fails", async () => {
    const validateAccount = jest.fn(() => false);
    const { props, result } = renderController({ validateAccount });

    setControllerAccount(result, "invalid");
    const success = await triggerSendCode(result);

    expect(success).toBe(false);
    expect(result.current.popup).toEqual({
      open: true,
      message: props.t.invalidAccount,
    });
    expect(props.onRequestCode).not.toHaveBeenCalled();
  });
});

describe("useAuthFormController handleSubmit", () => {
  test("surfaces submit errors via popup", async () => {
    const error = new Error("server down");
    const onSubmit = jest.fn(() => Promise.reject(error));
    const { props, result } = renderController({ onSubmit });

    setControllerAccount(result, "user@example.com");
    setControllerPassword(result, "secret");

    await triggerSubmit(result);

    expect(props.onSubmit).toHaveBeenCalledWith({
      account: "user@example.com",
      method: "phone",
      password: "secret",
    });
    expect(result.current.popup).toEqual({
      open: true,
      message: error.message,
    });
  });
});
