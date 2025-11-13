import { useMemo } from "react";

import type { UseActionInputBehaviorResult } from "./useActionInputBehavior.types";

type LanguageControlProps =
  UseActionInputBehaviorResult["languageControls"]["props"];

export type UseLanguageActionsResult = Pick<
  LanguageControlProps,
  | "onSourceLanguageChange"
  | "onTargetLanguageChange"
  | "onSwapLanguages"
  | "onMenuOpen"
>;

export type UseLanguageActionsParams = UseLanguageActionsResult;

export const useLanguageActions = ({
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
  onMenuOpen,
}: UseLanguageActionsParams): UseLanguageActionsResult =>
  useMemo(
    () => ({
      onSourceLanguageChange,
      onTargetLanguageChange,
      onSwapLanguages,
      onMenuOpen,
    }),
    [
      onMenuOpen,
      onSourceLanguageChange,
      onSwapLanguages,
      onTargetLanguageChange,
    ],
  );
