import type { FocusEvent } from "react";

export type PanelFocusContext = {
  isFocused: boolean;
  formElement?: HTMLFormElement;
  event: FocusEvent;
};

export const createInputFocusChangeHandler = ({
  handlePanelFocusChange,
  activateActionsMode,
}: {
  handlePanelFocusChange: (context: PanelFocusContext) => void;
  activateActionsMode: () => void;
}) =>
  (context: PanelFocusContext) => {
    handlePanelFocusChange(context);
    if (context.isFocused) {
      return;
    }

    const { formElement, event } = context;
    const relatedTarget = event?.relatedTarget as Node | null;
    const isWithinForm = Boolean(
      formElement && relatedTarget && formElement.contains(relatedTarget),
    );

    if (!isWithinForm) {
      activateActionsMode();
    }
  };
