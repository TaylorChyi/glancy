import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useFrameReveal from "../useFrameReveal";
import { restoreAnimationEnvironment } from "./frameRevealTestHarness.js";

const createAnimationEnvironment = () => {
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

  return {
    cancel,
    clearScheduledInterval,
    scheduleInterval,
    getAnimationFrameCallback: () => storedAnimationFrameCallback,
    getIntervalCallback: () => storedIntervalCallback,
  };
};

const mockReducedMotionQuery = () => {
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

  return { changeListeners, mediaQuery };
};

const notifyReducedMotionChange = (mediaQuery, changeListeners) => {
  mediaQuery.matches = false;
  changeListeners.forEach((listener) => listener({ matches: false }));
};

describe("frameReveal reduced motion", () => {
  afterEach(() => {
    restoreAnimationEnvironment();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("GivenReducedMotion_WhenPreferenceChanges_ThenLocksRevealAndRecoversOscillation", () => {
    jest.useFakeTimers();
    const animationEnv = createAnimationEnvironment();
    const { changeListeners, mediaQuery } = mockReducedMotionQuery();

    const { result, rerender, unmount } = renderHook(
      ({ token, interval }) => useFrameReveal(token, { intervalMs: interval }),
      {
        initialProps: { token: "frame-reduced", interval: 500 },
      },
    );

    expect(result.current).toBe(true);
    expect(typeof animationEnv.getAnimationFrameCallback()).toBe("function");
    expect(animationEnv.scheduleInterval).not.toHaveBeenCalled();

    act(() => {
      animationEnv.getAnimationFrameCallback()();
    });
    expect(result.current).toBe(true);

    act(() => {
      notifyReducedMotionChange(mediaQuery, changeListeners);
    });

    expect(animationEnv.scheduleInterval).toHaveBeenCalledTimes(1);
    expect(typeof animationEnv.getIntervalCallback()).toBe("function");

    act(() => {
      animationEnv.getIntervalCallback()();
    });
    expect(result.current).toBe(false);

    rerender({ token: "frame-restored", interval: 500 });

    expect(animationEnv.cancel).toHaveBeenCalledWith(21);
    expect(animationEnv.clearScheduledInterval).toHaveBeenCalledWith(31);

    unmount();
  });
});
