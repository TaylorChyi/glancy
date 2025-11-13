/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import useEmailBindingHandlers from "@shared/components/Profile/EmailBindingCard/useEmailBindingHandlers.js";

describe("useEmailBindingHandlers", () => {
  it("prevents default submission when confirmation handler is missing", async () => {
    const preventDefault = jest.fn();
    const { result } = renderHook(() =>
      useEmailBindingHandlers({
        draftEmail: "user@example.com",
        setDraftEmail: jest.fn(),
        verificationCode: "135790",
        setVerificationCode: jest.fn(),
        onRequestCode: jest.fn(),
        onConfirm: undefined,
        startCountdown: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("submits when event is absent and confirmation handler is provided", async () => {
    const onConfirm = jest.fn().mockResolvedValue();
    const { result } = renderHook(() =>
      useEmailBindingHandlers({
        draftEmail: "user@example.com",
        setDraftEmail: jest.fn(),
        verificationCode: "24680",
        setVerificationCode: jest.fn(),
        onRequestCode: jest.fn(),
        onConfirm,
        startCountdown: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onConfirm).toHaveBeenCalledWith({
      email: "user@example.com",
      code: "24680",
    });
  });
});
