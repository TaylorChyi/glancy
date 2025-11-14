/* eslint-env jest */
import { jest } from "@jest/globals";
import {
  getCodeRequestErrorMessage,
  getCodeRequestSuccessMessage,
  getInvalidAccountMessage,
  getSubmitErrorMessage,
  getUnavailableCodeMessage,
  isAccountValid,
  resetFeedbackChannels,
  sanitizeAccountValue,
  shouldSyncSanitizedAccount,
} from "../authFormHandlers.js";

const testSanitizeAccountValue = () => {
  test("sanitizeAccountValue trims whitespace strings", () => {
    expect(sanitizeAccountValue("  user@example.com  ")).toBe(
      "user@example.com",
    );
    const obj = { account: "keep" };
    expect(sanitizeAccountValue(obj)).toBe(obj);
  });
};

const testShouldSyncSanitizedAccount = () => {
  test("shouldSyncSanitizedAccount flags updated values", () => {
    expect(shouldSyncSanitizedAccount("foo", "foo")).toBe(false);
    expect(shouldSyncSanitizedAccount("foo", "bar")).toBe(true);
  });
};

const testIsAccountValid = () => {
  test("isAccountValid delegates to validator when provided", () => {
    const validate = jest.fn(() => true);
    expect(isAccountValid("foo", "email", validate)).toBe(true);
    expect(validate).toHaveBeenCalledWith("foo", "email");
    expect(isAccountValid("foo", "email", null)).toBe(false);
  });
};

const testInvalidAccountMessage = () => {
  test("getInvalidAccountMessage prefers translation override", () => {
    expect(getInvalidAccountMessage({ invalidAccount: "Custom" })).toBe(
      "Custom",
    );
    expect(getInvalidAccountMessage({})).toBe("Invalid account");
  });
};

const testUnavailableCodeMessage = () => {
  test("getUnavailableCodeMessage respects priority order", () => {
    const t = { codeRequestInvalidMethod: "invalid", notImplementedYet: "nyi" };
    expect(getUnavailableCodeMessage(t)).toBe("invalid");
    expect(getUnavailableCodeMessage({ notImplementedYet: "nyi" })).toBe(
      "nyi",
    );
    expect(getUnavailableCodeMessage({})).toBe(
      "Verification code request is unavailable",
    );
  });
};

const testCodeRequestSuccessMessage = () => {
  test("getCodeRequestSuccessMessage uses fallback when missing", () => {
    expect(getCodeRequestSuccessMessage({ codeRequestSuccess: "ok" })).toBe(
      "ok",
    );
    expect(getCodeRequestSuccessMessage({})).toBe(
      "Verification code sent. Please check your inbox.",
    );
  });
};

const testCodeRequestErrorMessage = () => {
  test("getCodeRequestErrorMessage prefers trimmed error message", () => {
    expect(
      getCodeRequestErrorMessage(new Error("Boom"), {
        codeRequestFailed: "failed",
      }),
    ).toBe("Boom");
    expect(getCodeRequestErrorMessage({}, { codeRequestFailed: "failed" })).toBe(
      "failed",
    );
    expect(getCodeRequestErrorMessage({}, {})).toBe(
      "Failed to send verification code",
    );
  });
};

const testSubmitErrorMessage = () => {
  test("getSubmitErrorMessage falls back to translation or default", () => {
    expect(
      getSubmitErrorMessage(new Error("Oops"), { genericRequestFailed: "err" }),
    ).toBe("Oops");
    expect(getSubmitErrorMessage({}, { genericRequestFailed: "err" })).toBe(
      "err",
    );
    expect(getSubmitErrorMessage({}, {})).toBe("Request failed");
  });
};

const testResetFeedbackChannels = () => {
  test("resetFeedbackChannels clears provided callbacks", () => {
    const popup = jest.fn();
    const toast = jest.fn();
    resetFeedbackChannels(popup, toast);
    expect(popup).toHaveBeenCalledWith("");
    expect(toast).toHaveBeenCalledWith("");

    resetFeedbackChannels(popup, undefined);
    expect(popup).toHaveBeenCalledTimes(2);
  });
};

describe("authFormHandlers helpers", () => {
  testSanitizeAccountValue();
  testShouldSyncSanitizedAccount();
  testIsAccountValid();
  testInvalidAccountMessage();
  testUnavailableCodeMessage();
  testCodeRequestSuccessMessage();
  testCodeRequestErrorMessage();
  testSubmitErrorMessage();
  testResetFeedbackChannels();
});
