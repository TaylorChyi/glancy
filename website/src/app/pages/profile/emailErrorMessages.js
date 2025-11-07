export const EMAIL_ERROR_CODE_TO_TRANSLATION_KEY = Object.freeze({
  "email-binding-email-required": "emailInputRequired",
  "email-binding-email-unchanged": "emailSameAsCurrent",
  "email-binding-code-required": "emailCodeRequired",
  "email-binding-code-missing-request": "emailCodeNotRequested",
  "email-binding-email-mismatch": "emailCodeMismatch",
});

export function resolveEmailErrorMessage(error, t) {
  if (!error) {
    return t.fail;
  }
  const translationKey = EMAIL_ERROR_CODE_TO_TRANSLATION_KEY[error.code];
  if (translationKey && t[translationKey]) {
    return t[translationKey];
  }
  if (error.message) {
    return error.message;
  }
  return t.fail;
}
