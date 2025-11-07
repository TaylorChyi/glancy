import { useCallback } from "react";
import type React from "react";

import type { UseActionInputBehaviorParams } from "./useActionInputBehavior.types";

export interface UseSubmissionHandlersParams {
  value: string;
  onSubmit?: UseActionInputBehaviorParams["onSubmit"];
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  releaseFocus: () => void;
}

export interface UseSubmissionHandlersResult {
  formProps: {
    ref: React.MutableRefObject<HTMLFormElement | null>;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  };
  onTextareaKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onActionSubmit: () => void;
}

export const useSubmissionHandlers = ({
  value,
  onSubmit,
  formRef,
  releaseFocus,
}: UseSubmissionHandlersParams): UseSubmissionHandlersResult => {
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (value.trim() === "") {
        return;
      }
      releaseFocus();
      onSubmit?.(event);
    },
    [onSubmit, releaseFocus, value],
  );

  const onTextareaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    [formRef],
  );

  const onActionSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, [formRef]);

  return {
    formProps: {
      ref: formRef,
      onSubmit: handleSubmit,
    },
    onTextareaKeyDown,
    onActionSubmit,
  };
};
