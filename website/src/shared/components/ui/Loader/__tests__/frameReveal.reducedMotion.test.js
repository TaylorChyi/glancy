import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useFrameReveal from "../useFrameReveal";
import { restoreAnimationEnvironment } from "./frameRevealTestHarness.js";

describe("frameReveal reduced motion", () => {
  afterEach(() => {
    restoreAnimationEnvironment();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("GivenReducedMotion_WhenPreferenceChanges_ThenLocksRevealAndRecoversOscillation", () => {
    jest.useFakeTimers();
    let storedAnimationFrameCallback;
    let storedIntervalCallback;

    const raf = jest.fn((callback) => {
      storedAnimationFrameCallback = callback;
      return 21;
    });
    const cancel = jest.fn();
    const scheduleInterval = jest.fn((callback) => {
      storedIntervalCallback = callback;
      return 31;
    });
    const clearScheduledInterval = jest.fn();

    global.requestAnimationFrame = raf;
    global.cancelAnimationFrame = cancel;
    global.setInterval = scheduleInterval;
    global.clearInterval = clearScheduledInterval;

    const changeListeners = new Set();
    const mediaQuery = {
      matches: true,
      addEventListener: (event, listener) => {
        if (event === "change") {
          changeListeners.add(listener);
        }
      },
      removeEventListener: (event, listener) => {
        if (event === "change") {
          changeListeners.delete(listener);
        }
      },
    };
    const matchMediaMock = jest.fn(() => mediaQuery);
    global.matchMedia = matchMediaMock;
    if (typeof window !== "undefined") {
      window.matchMedia = matchMediaMock;
    }

    const { result, rerender, unmount } = renderHook(
      ({ token, interval }) => useFrameReveal(token, { intervalMs: interval }),
      {
        initialProps: { token: "frame-reduced", interval: 500 },
      },
    );

    expect(result.current).toBe(true);
    expect(typeof storedAnimationFrameCallback).toBe("function");
    expect(scheduleInterval).not.toHaveBeenCalled();

    act(() => {
      storedAnimationFrameCallback();
    });
    expect(result.current).toBe(true);

    act(() => {
      mediaQuery.matches = false;
      changeListeners.forEach((listener) => listener({ matches: false }));
    });

    expect(scheduleInterval).toHaveBeenCalledTimes(1);
    expect(typeof storedIntervalCallback).toBe("function");

    act(() => {
      storedIntervalCallback();
    });
    expect(result.current).toBe(false);

    rerender({ token: "frame-restored", interval: 500 });

    expect(cancel).toHaveBeenCalledWith(21);
    expect(clearScheduledInterval).toHaveBeenCalledWith(31);

    unmount();
  });
});
