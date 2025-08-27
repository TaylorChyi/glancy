/* eslint-env node */

import test from "node:test";
import assert from "node:assert";
import { rafThrottle } from "../src/utils/rafThrottle.js";

// Polyfill requestAnimationFrame for Node environment
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

test("rafThrottle collapses rapid calls", async () => {
  let count = 0;
  const increment = () => {
    count += 1;
  };
  const throttled = rafThrottle(increment);

  for (let i = 0; i < 100; i += 1) {
    throttled();
  }

  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(count, 1);

  throttled();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(count, 2);

  throttled.cancel();
});
