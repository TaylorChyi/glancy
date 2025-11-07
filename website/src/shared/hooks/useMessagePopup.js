import { useCallback, useMemo, useState } from "react";

function createPopupState(message) {
  const normalizedMessage = message ?? "";
  return {
    open: Boolean(normalizedMessage),
    message: normalizedMessage,
  };
}

export function useMessagePopup(initialMessage = "") {
  const [state, setState] = useState(() => createPopupState(initialMessage));

  const showPopup = useCallback((message) => {
    const nextMessage = message ?? "";
    if (!nextMessage) {
      setState(createPopupState(""));
      return;
    }
    setState({ open: true, message: nextMessage });
  }, []);

  const closePopup = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const resetPopup = useCallback(() => {
    setState(createPopupState(""));
  }, []);

  const popupConfig = useMemo(
    () => ({
      open: state.open,
      message: state.message,
      onClose: closePopup,
    }),
    [closePopup, state.message, state.open],
  );

  return {
    popupOpen: state.open,
    popupMsg: state.message,
    showPopup,
    closePopup,
    resetPopup,
    popupConfig,
  };
}
