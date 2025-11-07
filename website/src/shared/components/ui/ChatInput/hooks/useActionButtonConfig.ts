import { useMemo } from "react";
import type { UseActionInputBehaviorResult } from "./useActionInputBehavior.types";

export interface UseActionButtonConfigParams {
  value: string;
  onSubmit: () => void;
  sendLabel?: string;
  restoreFocus: () => void;
}

export const useActionButtonConfig = ({
  value,
  onSubmit,
  sendLabel,
  restoreFocus,
}: UseActionButtonConfigParams): UseActionInputBehaviorResult["actionButtonProps"] =>
  useMemo(
    () => ({
      canSubmit: value.trim().length > 0,
      onSubmit,
      sendLabel: sendLabel ?? "Send",
      restoreFocus,
    }),
    [onSubmit, restoreFocus, sendLabel, value],
  );
