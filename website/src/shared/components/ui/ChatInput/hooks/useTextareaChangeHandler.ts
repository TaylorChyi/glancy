import { useCallback } from "react";
import type React from "react";

export interface UseTextareaChangeHandlerParams {
  resize: (element: HTMLTextAreaElement | null) => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const useTextareaChangeHandler = ({
  resize,
  onChange,
}: UseTextareaChangeHandlerParams) =>
  useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      resize(event.target);
      onChange?.(event);
    },
    [onChange, resize],
  );
