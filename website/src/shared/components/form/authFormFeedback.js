import { useCallback, useState } from "react";
import { useMessagePopup } from "@shared/hooks/useMessagePopup.js";

const useFeedbackChannels = () => {
  const {
    popupConfig,
    popupOpen,
    popupMsg,
    showPopup,
    closePopup,
    resetPopup,
  } = useMessagePopup();
  const [toast, setToast] = useState({ open: false, message: "" });

  const showToast = useCallback((message) => {
    setToast({ open: Boolean(message), message: message ?? "" });
  }, []);

  const resetToast = useCallback(() => {
    setToast({ open: false, message: "" });
  }, []);

  return {
    popup: { open: popupOpen, message: popupMsg },
    toast,
    showPopup,
    showToast,
    resetPopup,
    resetToast,
    closePopup,
    popupConfig,
  };
};

export { useFeedbackChannels };
