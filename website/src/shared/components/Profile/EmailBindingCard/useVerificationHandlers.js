import { useCallback } from "react";

export default function useVerificationHandlers({
  draftEmail,
  setVerificationCode,
  onRequestCode,
  startCountdown,
}) {
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

  return { handleVerificationCodeChange, handleRequestCode };
}

export { useVerificationHandlers };
