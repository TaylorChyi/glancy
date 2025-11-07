import { useMemo } from "react";

import type {
  LanguageOption,
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";

const normalizeOptions = (options?: LanguageOption[]): LanguageOption[] =>
  Array.isArray(options) ? options : [];

export interface UseLanguageControlsConfigParams {
  sourceLanguage?: LanguageValue;
  sourceLanguageOptions?: LanguageOption[];
  sourceLanguageLabel?: string;
  onSourceLanguageChange?: (value: LanguageValue) => void;
  targetLanguage?: LanguageValue;
  targetLanguageOptions?: LanguageOption[];
  targetLanguageLabel?: string;
  onTargetLanguageChange?: (value: LanguageValue) => void;
  onSwapLanguages?: () => void;
  swapLabel?: string;
  normalizeSourceLanguageFn: NonNullable<
    UseActionInputBehaviorParams["normalizeSourceLanguageFn"]
  >;
  normalizeTargetLanguageFn: NonNullable<
    UseActionInputBehaviorParams["normalizeTargetLanguageFn"]
  >;
  onMenuOpen?: (variant?: "source" | "target") => void;
}

export interface UseLanguageControlsConfigResult {
  isVisible: boolean;
  props: UseActionInputBehaviorResult["languageControls"]["props"];
}

export const useLanguageControlsConfig = ({
  sourceLanguage,
  sourceLanguageOptions,
  sourceLanguageLabel,
  onSourceLanguageChange,
  targetLanguage,
  targetLanguageOptions,
  targetLanguageLabel,
  onTargetLanguageChange,
  onSwapLanguages,
  swapLabel,
  normalizeSourceLanguageFn,
  normalizeTargetLanguageFn,
  onMenuOpen,
}: UseLanguageControlsConfigParams): UseLanguageControlsConfigResult => {
  const [normalizedSourceOptions, normalizedTargetOptions] = useMemo(
    () => [
      normalizeOptions(sourceLanguageOptions),
      normalizeOptions(targetLanguageOptions),
    ],
    [sourceLanguageOptions, targetLanguageOptions],
  );

  const props = useMemo(
    () => ({
      sourceLanguage,
      sourceLanguageOptions: normalizedSourceOptions,
      sourceLanguageLabel,
      onSourceLanguageChange,
      targetLanguage,
      targetLanguageOptions: normalizedTargetOptions,
      targetLanguageLabel,
      onTargetLanguageChange,
      onSwapLanguages,
      swapLabel,
      normalizeSourceLanguage: normalizeSourceLanguageFn,
      normalizeTargetLanguage: normalizeTargetLanguageFn,
      onMenuOpen,
    }),
    [
      normalizeSourceLanguageFn,
      normalizeTargetLanguageFn,
      normalizedSourceOptions,
      normalizedTargetOptions,
      onMenuOpen,
      onSourceLanguageChange,
      onSwapLanguages,
      onTargetLanguageChange,
      sourceLanguage,
      sourceLanguageLabel,
      swapLabel,
      targetLanguage,
      targetLanguageLabel,
    ],
  );

  const isVisible =
    normalizedSourceOptions.length > 0 || normalizedTargetOptions.length > 0;

  return { isVisible, props };
};
