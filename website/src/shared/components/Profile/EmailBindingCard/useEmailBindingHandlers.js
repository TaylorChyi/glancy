import { useCallback } from "react";

const useEmailBindingHandlers = ({
  draftEmail,
  setDraftEmail,
  verificationCode,
  setVerificationCode,
  onRequestCode,
  onConfirm,
  startCountdown,
}) => {
  const handleDraftEmailChange = useCallback(
    (event) => {
      setDraftEmail(event.target.value);
    },
    [setDraftEmail],
  );

  const handleVerificationCodeChange = useCallback(
    (event) => {
      setVerificationCode(event.target.value);
    },
    [setVerificationCode],
  );

  const handleRequestCode = useCallback(async () => {
    if (typeof onRequestCode !== "function") {
      return;
    }

    const result = await onRequestCode(draftEmail);
    if (result === false) {
      return;
    }

    setVerificationCode("");
    startCountdown();
  }, [draftEmail, onRequestCode, setVerificationCode, startCountdown]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (typeof onConfirm !== "function") {
        return;
      }

      await onConfirm({ email: draftEmail, code: verificationCode });
    },
    [draftEmail, onConfirm, verificationCode],
  );

  return {
    handleDraftEmailChange,
    handleVerificationCodeChange,
    handleRequestCode,
    handleSubmit,
  };
};

export default useEmailBindingHandlers;
export { useEmailBindingHandlers };
