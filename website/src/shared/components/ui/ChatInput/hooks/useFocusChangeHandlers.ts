import { useMemo } from "react";
import type React from "react";

import type {
  FocusChangeContext,
  UseActionInputBehaviorParams,
} from "./useActionInputBehavior.types";

export interface UseFocusChangeHandlersParams {
  onFocusChange?: UseActionInputBehaviorParams["onFocusChange"];
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  restoreFocus: () => void;
}

export interface UseFocusChangeHandlersResult {
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

export const useFocusChangeHandlers = ({
  onFocusChange,
  formRef,
  restoreFocus,
}: UseFocusChangeHandlersParams): UseFocusChangeHandlersResult => {
  return useMemo(() => {
    if (!onFocusChange) {
      return { onFocus: undefined, onBlur: undefined };
    }

    const createHandler =
      (
        isFocused: FocusChangeContext["isFocused"],
      ): ((event: React.FocusEvent<HTMLTextAreaElement>) => void) =>
      (event) => {
        onFocusChange({
          isFocused,
          event,
          formElement: formRef.current,
          restoreFocus,
        });
      };

    return {
      onFocus: createHandler(true),
      onBlur: createHandler(false),
    };
  }, [formRef, onFocusChange, restoreFocus]);
};
