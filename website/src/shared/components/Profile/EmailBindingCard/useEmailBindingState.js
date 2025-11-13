import { useEffect, useState } from "react";

const INITIAL_VERIFICATION_CODE = "";

const useEmailBindingState = ({ email, mode, resetCountdown }) => {
  const [draftEmail, setDraftEmail] = useState(email ?? "");
  const [verificationCode, setVerificationCode] = useState(
    INITIAL_VERIFICATION_CODE,
  );

  useEffect(() => {
    setDraftEmail(email ?? "");
    if (mode === "idle") {
      setVerificationCode(INITIAL_VERIFICATION_CODE);
      resetCountdown();
    }
  }, [email, mode, resetCountdown]);

  return { draftEmail, setDraftEmail, verificationCode, setVerificationCode };
};

export default useEmailBindingState;
export { useEmailBindingState };
