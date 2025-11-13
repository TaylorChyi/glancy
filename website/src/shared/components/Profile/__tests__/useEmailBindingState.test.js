/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";
import useEmailBindingState from "@shared/components/Profile/EmailBindingCard/useEmailBindingState.js";

describe("useEmailBindingState", () => {
  it("resets verification code and countdown when returning to idle", () => {
    const resetCountdown = jest.fn();
    const { result, rerender } = renderHook(
      (props) => useEmailBindingState(props),
      {
        initialProps: {
          email: "user@example.com",
          mode: "verifying",
          resetCountdown,
        },
      },
    );

    act(() => {
      result.current.setVerificationCode("123456");
    });

    rerender({
      email: "user@example.com",
      mode: "idle",
      resetCountdown,
    });

    expect(result.current.verificationCode).toBe("");
    expect(resetCountdown).toHaveBeenCalledTimes(1);
  });
});
