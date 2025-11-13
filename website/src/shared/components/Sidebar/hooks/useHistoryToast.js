import { useCallback, useEffect, useMemo, useState } from "react";

export default function useHistoryToast(error) {
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!error) return;
    setErrorMessage(error);
  }, [error]);

  const handleToastClose = useCallback(() => {
    setErrorMessage("");
  }, []);

  return useMemo(
    () => ({
      open: Boolean(errorMessage),
      message: errorMessage,
      onClose: handleToastClose,
    }),
    [errorMessage, handleToastClose],
  );
}
