import { useMemo } from "react";

import type {
  LanguageOption,
  LanguageValue,
  UseActionInputBehaviorParams,
  UseActionInputBehaviorResult,
} from "./useActionInputBehavior.types";

const normalizeOptions = (options?: LanguageOption[]): LanguageOption[] =>
  Array.isArray(options) ? options : [];

const useNormalizedLanguageOptions = ({
  sourceLanguageOptions,
  targetLanguageOptions,
}: Pick<
  UseLanguageControlsConfigParams,
  "sourceLanguageOptions" | "targetLanguageOptions"
>) =>
  useMemo(
    () => [
      normalizeOptions(sourceLanguageOptions),
      normalizeOptions(targetLanguageOptions),
    ],
    [sourceLanguageOptions, targetLanguageOptions],
  );

type LanguageControlsPropsBuilderParams = Pick<
  UseLanguageControlsConfigParams,
  | "sourceLanguage"
  | "sourceLanguageLabel"
  | "targetLanguage"
  | "targetLanguageLabel"
  | "swapLabel"
  | "normalizeSourceLanguageFn"
  | "normalizeTargetLanguageFn"
> & {
  normalizedSourceOptions: LanguageOption[];
  normalizedTargetOptions: LanguageOption[];
};

const buildLanguageControlsProps = ({
  sourceLanguage,
  sourceLanguageLabel,
  targetLanguage,
  targetLanguageLabel,
  swapLabel,
  normalizeSourceLanguageFn,
  normalizeTargetLanguageFn,
  normalizedSourceOptions,
  normalizedTargetOptions,
}: LanguageControlsPropsBuilderParams) => ({
  sourceLanguage,
  sourceLanguageOptions: normalizedSourceOptions,
  sourceLanguageLabel,
  targetLanguage,
  targetLanguageOptions: normalizedTargetOptions,
  targetLanguageLabel,
  swapLabel,
  normalizeSourceLanguage: normalizeSourceLanguageFn,
  normalizeTargetLanguage: normalizeTargetLanguageFn,
});

const buildLanguageControlsDeps = (
  params: Pick<
    UseLanguageControlsConfigParams,
    | "sourceLanguage"
    | "sourceLanguageLabel"
    | "targetLanguage"
    | "targetLanguageLabel"
    | "swapLabel"
    | "normalizeSourceLanguageFn"
    | "normalizeTargetLanguageFn"
  >,
  normalizedSourceOptions: LanguageOption[],
  normalizedTargetOptions: LanguageOption[],
) => [
  normalizedSourceOptions,
  normalizedTargetOptions,
  params.sourceLanguage,
  params.sourceLanguageLabel,
  params.swapLabel,
  params.targetLanguage,
  params.targetLanguageLabel,
  params.normalizeSourceLanguageFn,
  params.normalizeTargetLanguageFn,
];

const useLanguageControlsProps = (
  params: Pick<
    UseLanguageControlsConfigParams,
    | "sourceLanguage"
    | "sourceLanguageLabel"
    | "targetLanguage"
    | "targetLanguageLabel"
    | "swapLabel"
    | "normalizeSourceLanguageFn"
    | "normalizeTargetLanguageFn"
  >,
  normalizedSourceOptions: LanguageOption[],
  normalizedTargetOptions: LanguageOption[],
) =>
  useMemo(
    () =>
      buildLanguageControlsProps({
        ...params,
        normalizedSourceOptions,
        normalizedTargetOptions,
      }),
    buildLanguageControlsDeps(
      params,
      normalizedSourceOptions,
      normalizedTargetOptions,
    ),
  );

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

export const useLanguageControlsConfig = (
  params: UseLanguageControlsConfigParams,
): UseLanguageControlsConfigResult => {
  const [normalizedSourceOptions, normalizedTargetOptions] =
    useNormalizedLanguageOptions(params);

  const props = useLanguageControlsProps(
    params,
    normalizedSourceOptions,
    normalizedTargetOptions,
  );

  const isVisible =
    normalizedSourceOptions.length > 0 || normalizedTargetOptions.length > 0;

  return { isVisible, props };
};
