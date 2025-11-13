import { useCallback, useMemo, useRef, useState } from "react";

import {
  formatRedeemCodeForDisplay,
  normalizeRedeemCodeInput,
} from "./redeemCodeUtils.js";

export const useRedeemCodeField = () => {
  const [redeemCode, setRedeemCode] = useState("");
  const redeemInputRef = useRef(null);

  const formattedRedeemCode = useMemo(
    () => formatRedeemCodeForDisplay(redeemCode),
    [redeemCode],
  );

  const handleRedeemCodeChange = useCallback((event) => {
    if (!event || typeof event !== "object" || !("target" in event)) {
      return;
    }

    const { value } = event.target ?? {};
    setRedeemCode(normalizeRedeemCodeInput(value ?? ""));
  }, []);

  return {
    redeemCode,
    formattedRedeemCode,
    handleRedeemCodeChange,
    redeemInputRef,
  };
};
