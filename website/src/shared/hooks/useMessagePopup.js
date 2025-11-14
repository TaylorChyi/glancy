import { useCallback, useMemo, useReducer } from "react";

function resolvePopupState(message) {
  const normalizedMessage = message ?? "";
  return {
    open: Boolean(normalizedMessage),
    message: normalizedMessage,
  };
}

function popupReducer(state, action) {
  switch (action.type) {
    case "show":
      return resolvePopupState(action.message);
    case "close":
      return state.open
        ? { open: false, message: state.message }
        : state;
    case "reset":
      return resolvePopupState("");
    default:
      return state;
  }
}

export function useMessagePopup(initialMessage = "") {
  const [state, dispatch] = useReducer(
    popupReducer,
    initialMessage,
    resolvePopupState,
  );
  const showPopup = useCallback(
    (message) => dispatch({ type: "show", message }),
    [],
  );
  const closePopup = useCallback(() => dispatch({ type: "close" }), []);
  const resetPopup = useCallback(() => dispatch({ type: "reset" }), []);
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
