const formatArg = (arg) => {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }
  if (typeof arg === "string") {
    return arg;
  }
  if (arg == null) {
    return String(arg);
  }
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg);
    } catch (error) {
      return `[unserializable:${error?.message ?? "error"}]`;
    }
  }
  return String(arg);
};

const writeToStderr = (level, ...args) => {
  if (typeof process !== "undefined" && process.stderr?.write) {
    const line = args.map(formatArg).join(" ");
    process.stderr.write(`[${level}] ${line}\n`);
  }
};

const fallbackLogger = {
  debug: (...args) => writeToStderr("debug", ...args),
  info: (...args) => writeToStderr("info", ...args),
  warn: (...args) => writeToStderr("warn", ...args),
  error: (...args) => writeToStderr("error", ...args),
};

const safeCall = (target, level, args) => {
  const method = target?.[level];
  if (typeof method === "function") {
    method(...args);
    return;
  }
  fallbackLogger[level](...args);
};

const createLogger = () => {
  if (typeof globalThis !== "undefined") {
    const external = globalThis.__GLANCY_LOGGER__;
    if (external && typeof external === "object") {
      return {
        debug: (...args) => safeCall(external, "debug", args),
        info: (...args) => safeCall(external, "info", args),
        warn: (...args) => safeCall(external, "warn", args),
        error: (...args) => safeCall(external, "error", args),
      };
    }
  }
  return fallbackLogger;
};

export const logger = createLogger();
