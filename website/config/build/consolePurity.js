/**
 * Functions marked as pure allow esbuild to drop debug-only console statements
 * without affecting error logging.
 */
export const PURE_CONSOLE_FNS = Object.freeze([
  "console.debug",
  "console.info",
  "console.trace",
]);
