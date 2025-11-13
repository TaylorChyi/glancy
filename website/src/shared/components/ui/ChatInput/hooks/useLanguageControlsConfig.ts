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
  targetLanguage?: LanguageValue;
  targetLanguageOptions?: LanguageOption[];
  targetLanguageLabel?: string;
  swapLabel?: string;
  normalizeSourceLanguageFn: NonNullable<
    UseActionInputBehaviorParams["normalizeSourceLanguageFn"]
  >;
  normalizeTargetLanguageFn: NonNullable<
    UseActionInputBehaviorParams["normalizeTargetLanguageFn"]
  >;
}

export interface UseLanguageControlsConfigResult {
  isVisible: boolean;
  props: Omit<
    UseActionInputBehaviorResult["languageControls"]["props"],
    | "onSourceLanguageChange"
    | "onTargetLanguageChange"
    | "onSwapLanguages"
    | "onMenuOpen"
  >;
}

export const useLanguageControlsConfig = ({
  sourceLanguage,
  sourceLanguageOptions,
  sourceLanguageLabel,
  targetLanguage,
  targetLanguageOptions,
  targetLanguageLabel,
  swapLabel,
  normalizeSourceLanguageFn,
  normalizeTargetLanguageFn,
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
      targetLanguage,
      targetLanguageOptions: normalizedTargetOptions,
      targetLanguageLabel,
      swapLabel,
      normalizeSourceLanguage: normalizeSourceLanguageFn,
      normalizeTargetLanguage: normalizeTargetLanguageFn,
    }),
    [
      normalizeSourceLanguageFn,
      normalizeTargetLanguageFn,
      normalizedSourceOptions,
      normalizedTargetOptions,
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
