import { useEffect } from "react";
import type { RefObject } from "react";

import { PANEL_MODE_SEARCH } from "../../hooks/useBottomPanelState";

export const shouldAutoFocusSearchInput = ({
  bottomPanelMode,
  inputRef,
}: {
  bottomPanelMode: string;
  inputRef: RefObject<HTMLInputElement>;
}) => bottomPanelMode === PANEL_MODE_SEARCH && Boolean(inputRef.current);

export const useDictionarySearchModeAutoFocus = ({
  bottomPanelMode,
  inputRef,
  focusInput,
}: {
  bottomPanelMode: string;
  inputRef: RefObject<HTMLInputElement>;
  focusInput: () => void;
}) => {
  useEffect(() => {
    if (!shouldAutoFocusSearchInput({ bottomPanelMode, inputRef })) {
      return;
    }
    focusInput();
  }, [bottomPanelMode, focusInput, inputRef]);
};

export default useDictionarySearchModeAutoFocus;
