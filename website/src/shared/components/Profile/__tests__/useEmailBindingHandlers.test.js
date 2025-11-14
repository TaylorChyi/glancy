/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import useEmailBindingHandlers from "@shared/components/Profile/EmailBindingCard/useEmailBindingHandlers.js";

const buildHandlers = (overrides = {}) =>
  renderHook(() =>
    useEmailBindingHandlers({
      draftEmail: "user@example.com",
      setDraftEmail: jest.fn(),
      verificationCode: "135790",
      setVerificationCode: jest.fn(),
      onRequestCode: jest.fn(),
      onConfirm: jest.fn(),
      startCountdown: jest.fn(),
      ...overrides,
    }),
  );

const describeDraftEmailBehavior = () => {
  it("updates draft email when input changes", () => {
    const setDraftEmail = jest.fn();
    const { result } = buildHandlers({ setDraftEmail });

    act(() => {
      result.current.handleDraftEmailChange({ target: { value: "new@example.com" } });
    });

    expect(setDraftEmail).toHaveBeenCalledWith("new@example.com");
  });
};

const describeRequestCodeBehavior = () => {
  it("resets verification code and starts countdown on successful request", async () => {
    const setVerificationCode = jest.fn();
    const startCountdown = jest.fn();
    const onRequestCode = jest.fn().mockResolvedValue(true);
    const { result } = buildHandlers({
      setVerificationCode,
      startCountdown,
      onRequestCode,
    });

    await act(async () => {
      await result.current.handleRequestCode();
    });

    expect(onRequestCode).toHaveBeenCalledWith("user@example.com");
    expect(setVerificationCode).toHaveBeenCalledWith("");
    expect(startCountdown).toHaveBeenCalledTimes(1);
  });

  it("avoids resetting state when verification request is rejected", async () => {
    const setVerificationCode = jest.fn();
    const startCountdown = jest.fn();
    const onRequestCode = jest.fn().mockResolvedValue(false);
    const { result } = buildHandlers({
      setVerificationCode,
      startCountdown,
      onRequestCode,
    });

    await act(async () => {
      await result.current.handleRequestCode();
    });

    expect(setVerificationCode).not.toHaveBeenCalled();
    expect(startCountdown).not.toHaveBeenCalled();
  });
};

const describeSubmitBehavior = () => {
  it("prevents default submission when confirmation handler is missing", async () => {
    const preventDefault = jest.fn();
    const { result } = buildHandlers({ onConfirm: undefined });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("submits when event is absent and confirmation handler is provided", async () => {
    const onConfirm = jest.fn().mockResolvedValue();
    const { result } = buildHandlers({ onConfirm });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onConfirm).toHaveBeenCalledWith({
      email: "user@example.com",
      code: "135790",
    });
  });
};

describe("useEmailBindingHandlers", () => {
  describeDraftEmailBehavior();
  describeRequestCodeBehavior();
  describeSubmitBehavior();
});
