import { useMemo } from "react";

import type useBottomPanelState from "../../hooks/useBottomPanelState";
import { createInputFocusChangeHandler } from "./dictionaryInputFocusHandlers.ts";

export type UseDictionaryInputFocusChangeHandlerArgs = Pick<
  ReturnType<typeof useBottomPanelState>,
  "handleFocusChange" | "activateActionsMode"
>;

export const useDictionaryInputFocusChangeHandler = ({
  handleFocusChange,
  activateActionsMode,
}: UseDictionaryInputFocusChangeHandlerArgs) =>
  useMemo(
    () =>
      createInputFocusChangeHandler({
        handlePanelFocusChange: handleFocusChange,
        activateActionsMode,
      }),
    [activateActionsMode, handleFocusChange],
  );

export default useDictionaryInputFocusChangeHandler;
