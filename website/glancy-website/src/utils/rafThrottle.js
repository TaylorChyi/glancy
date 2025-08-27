/**
 * Returns a function throttled to the next animation frame.
 * Useful for reducing invocations of high-frequency events like resize or scroll.
 * The returned function also provides a `cancel` method to clear any pending frame.
 * @param {Function} fn - The callback to throttle.
 * @returns {Function} A throttled version of the callback.
 */
/* eslint-env browser */

export function rafThrottle(fn) {
  let rafId = null;

  function invoke(...args) {
    rafId = null;
    fn(...args);
  }

  function throttled(...args) {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => invoke(...args));
  }

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}
