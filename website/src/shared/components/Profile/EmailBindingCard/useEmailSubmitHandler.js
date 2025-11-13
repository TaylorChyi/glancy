import { useCallback } from "react";

export default function useEmailSubmitHandler({
  draftEmail,
  verificationCode,
  onConfirm,
}) {
  return useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (typeof onConfirm !== "function") {
        return;
      }

      await onConfirm({ email: draftEmail, code: verificationCode });
    },
    [draftEmail, onConfirm, verificationCode],
  );
}

export { useEmailSubmitHandler };
