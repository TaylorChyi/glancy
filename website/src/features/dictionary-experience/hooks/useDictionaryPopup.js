import { useCallback, useState } from "react";

export function useDictionaryPopup() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  const showPopup = useCallback((message) => {
    if (!message) {
      return;
    }
    setPopupMsg(message);
    setPopupOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
  }, []);

  return {
    popupOpen,
    popupMsg,
    showPopup,
    closePopup,
  };
}
