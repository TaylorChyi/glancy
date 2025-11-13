export const MODE_IDLE = "idle";
export const MODE_EDITING = "editing";

export const ERROR_EMAIL_REQUIRED = "email-binding-email-required";
export const ERROR_EMAIL_UNCHANGED = "email-binding-email-unchanged";
export const ERROR_CODE_REQUIRED = "email-binding-code-required";
export const ERROR_MISSING_REQUEST = "email-binding-code-missing-request";
export const ERROR_EMAIL_MISMATCH = "email-binding-email-mismatch";

export const normalizeEmail = (email) => email?.trim().toLowerCase() ?? "";
