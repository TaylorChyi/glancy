import { act } from "@testing-library/react";
import { createPersistentStore } from "../createPersistentStore.js";
import { STORE_KEYS } from "../storeKeys.js";

describe("createPersistentStore", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "localStorage",
  );

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(window, "localStorage", originalDescriptor);
    } else {
      delete window.localStorage;
    }
  });

  test("gracefully falls back when localStorage access is blocked", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Denied");
      },
    });

    const useTestStore = createPersistentStore({
      key: STORE_KEYS.USER,
      initializer: (set) => ({
        value: 0,
        increment: () => set((state) => ({ value: state.value + 1 })),
      }),
    });

    act(() => {
      useTestStore.getState().increment();
    });

    expect(useTestStore.getState().value).toBe(1);
  });
});
