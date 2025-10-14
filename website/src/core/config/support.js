const readEnv = (key) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[key];
    if (value != null) {
      return value;
    }
  }

  const runtimeEnv =
    typeof globalThis !== "undefined" && globalThis.process?.env
      ? globalThis.process.env
      : undefined;

  if (runtimeEnv) {
    const value = runtimeEnv[key];
    if (value != null) {
      return value;
    }
  }

  return undefined;
};

export const SHARE_BASE_URL = readEnv("VITE_SHARE_BASE_URL") || "";
export const REPORT_FORM_URL = readEnv("VITE_REPORT_FORM_URL") || "";
export const SUPPORT_EMAIL = readEnv("VITE_SUPPORT_EMAIL") || "";
