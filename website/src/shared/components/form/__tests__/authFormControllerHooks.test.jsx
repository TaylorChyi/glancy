/* eslint-env jest */
import { act, renderHook } from "@testing-library/react";
import {
  deriveAvailableMethods,
  deriveOrderedMethods,
  useAuthFeedback,
  useAuthMethodResolution,
  useAuthOtherOptionsLabel,
  useAuthToastLabel,
} from "../authFormControllerHooks.js";

const t = {
  close: "Close",
  notImplementedYet: "notImplementedYet",
  otherLoginOptions: "Other options",
  toastDismissLabel: "Dismiss",
};

test("deriveAvailableMethods guards against non-array inputs", () => {
  expect(deriveAvailableMethods(undefined)).toEqual([]);
  expect(deriveAvailableMethods(["email"])).toEqual(["email"]);
});

test("deriveOrderedMethods returns empty array for invalid inputs", () => {
  expect(deriveOrderedMethods(null)).toEqual([]);
  expect(deriveOrderedMethods(["email", "phone"])).toEqual(["email", "phone"]);
});

test("useAuthMethodResolution preserves selected method until removed", () => {
  const { result, rerender } = renderHook(
    ({ methods }) =>
      useAuthMethodResolution({
        formMethods: methods,
        methodOrder: methods,
        defaultMethod: "email",
      }),
    { initialProps: { methods: ["email", "phone"] } },
  );

  act(() => {
    result.current.setMethod("phone");
  });

  expect(result.current.method).toBe("phone");

  rerender({ methods: ["email"] });

  expect(result.current.method).toBe("email");
});

test("useAuthToastLabel returns translation fallbacks", () => {
  const { result } = renderHook(() => useAuthToastLabel({ close: "Close" }));
  expect(result.current).toBe("Close");

  const fallback = renderHook(() => useAuthToastLabel({}));
  expect(fallback.result.current).toBe("Dismiss notification");
});

test("useAuthOtherOptionsLabel trims supplied label", () => {
  const custom = renderHook(() =>
    useAuthOtherOptionsLabel("  Custom label  ", t),
  );
  expect(custom.result.current).toBe("Custom label");

  const fallback = renderHook(() => useAuthOtherOptionsLabel("", t));
  expect(fallback.result.current).toBe(t.otherLoginOptions);
});

test("useAuthFeedback wires unavailable method handler to popup channel", () => {
  const { result } = renderHook(() => useAuthFeedback(t));

  act(() => {
    result.current.onUnavailableMethod();
  });

  expect(result.current.feedback.popup).toEqual({
    open: true,
    message: t.notImplementedYet,
  });
});
