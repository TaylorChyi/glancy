import { jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";
import useFrameReveal from "../useFrameReveal";

const originalEnvironment = {
  requestAnimationFrame: global.requestAnimationFrame,
  cancelAnimationFrame: global.cancelAnimationFrame,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
  matchMedia: global.matchMedia,
  windowMatchMedia:
    typeof window !== "undefined" ? window.matchMedia : undefined,
};

export const restoreAnimationEnvironment = () => {
  global.requestAnimationFrame = originalEnvironment.requestAnimationFrame;
  global.cancelAnimationFrame = originalEnvironment.cancelAnimationFrame;
  global.setInterval = originalEnvironment.setInterval;
  global.clearInterval = originalEnvironment.clearInterval;
  global.matchMedia = originalEnvironment.matchMedia;
  if (typeof window !== "undefined") {
    window.matchMedia = originalEnvironment.windowMatchMedia;
  }
};

export const givenIntervalAnimationEnvironment = () => {
  jest.useFakeTimers();
  let animationFrameCallback;
  let intervalCallback;
  const frameRequestId = 11;
  const intervalRequestId = 13;

  const raf = jest.fn((callback) => {
    animationFrameCallback = callback;
    return frameRequestId;
  });
  const cancel = jest.fn();
  const scheduleInterval = jest.fn((callback) => {
    intervalCallback = callback;
    return intervalRequestId;
  });
  const clearScheduledInterval = jest.fn();

  global.requestAnimationFrame = raf;
  global.cancelAnimationFrame = cancel;
  global.setInterval = scheduleInterval;
  global.clearInterval = clearScheduledInterval;

  return {
    frameRequestId,
    intervalRequestId,
    cancel,
    clearScheduledInterval,
    getAnimationFrameCallback: () => animationFrameCallback,
    getIntervalCallback: () => intervalCallback,
  };
};

export const whenFrameRevealRuns = (
  props = { token: "frame-a", interval: 700 },
) =>
  renderHook(
    ({ token, interval }) => useFrameReveal(token, { intervalMs: interval }),
    {
      initialProps: props,
    },
  );

export const runIntervalScenario = () => {
  const env = givenIntervalAnimationEnvironment();
  const hook = whenFrameRevealRuns();
  return { ...env, ...hook };
};

export const intervalExpectationCases = [
  {
    expectation: "initializes hidden and schedules callbacks",
    assertThen: ({ result, getAnimationFrameCallback, getIntervalCallback }) => {
      expect(result.current).toBe(false);
      expect(typeof getAnimationFrameCallback()).toBe("function");
      expect(typeof getIntervalCallback()).toBe("function");
    },
  },
  {
    expectation: "animation frame reveals overlay",
    assertThen: ({ result, getAnimationFrameCallback }) => {
      expect(result.current).toBe(false);
      const animationFrameCallback = getAnimationFrameCallback();
      expect(typeof animationFrameCallback).toBe("function");

      act(() => {
        animationFrameCallback();
      });

      expect(result.current).toBe(true);
    },
  },
  {
    expectation: "interval callback toggles visibility",
    assertThen: ({ result, getAnimationFrameCallback, getIntervalCallback }) => {
      const animationFrameCallback = getAnimationFrameCallback();
      expect(typeof animationFrameCallback).toBe("function");
      act(() => {
        animationFrameCallback();
      });

      const intervalCallback = getIntervalCallback();
      expect(typeof intervalCallback).toBe("function");

      act(() => {
        intervalCallback();
      });
      expect(result.current).toBe(false);

      act(() => {
        intervalCallback();
      });
      expect(result.current).toBe(true);
    },
  },
  {
    expectation: "rerender cancels scheduled work",
    assertThen: ({
      rerender,
      cancel,
      clearScheduledInterval,
      frameRequestId,
      intervalRequestId,
    }) => {
      rerender({ token: "frame-b", interval: 700 });
      expect(cancel).toHaveBeenCalledWith(frameRequestId);
      expect(clearScheduledInterval).toHaveBeenCalledWith(intervalRequestId);
    },
  },
];
