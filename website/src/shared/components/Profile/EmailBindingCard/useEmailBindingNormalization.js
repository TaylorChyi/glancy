import { useMemo } from "react";

const normalizeEmail = (value) => value?.trim().toLowerCase() ?? "";

const useEmailBindingNormalization = (draftEmail, requestedEmail) => {
  const normalizedDraftEmail = useMemo(
    () => normalizeEmail(draftEmail),
    [draftEmail],
  );
  const normalizedRequestedEmail = useMemo(
    () => normalizeEmail(requestedEmail),
    [requestedEmail],
  );
  const isVerificationForDraft = useMemo(
    () =>
      normalizedDraftEmail.length > 0 &&
      normalizedRequestedEmail.length > 0 &&
      normalizedDraftEmail === normalizedRequestedEmail,
    [normalizedDraftEmail, normalizedRequestedEmail],
  );

  return {
    normalizedDraftEmail,
    normalizedRequestedEmail,
    isVerificationForDraft,
  };
};

export default useEmailBindingNormalization;
export { useEmailBindingNormalization };
