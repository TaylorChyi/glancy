import type { ReactNode } from "react";

import type {
  VariantKey,
  VariantOpenHandlers,
} from "../hooks/useVariantOpenHandlers";

export interface VariantOption {
  value: string | symbol;
  label: string;
  description?: string;
  badge?: ReactNode;
}

export interface VariantParams {
  key: VariantKey;
  label?: string;
  value?: string | symbol;
  options?: VariantOption[];
  onChange?: (value: string | symbol) => void;
  normalizeValue?: (value: unknown) => unknown;
  onOpen?: () => void;
}

export interface SwapAction {
  label: string;
  onSwap: () => void;
}

export interface LanguageLauncherViewModel {
  params: Record<VariantKey, VariantParams>;
  groupLabel: string;
  swapAction: SwapAction | null;
}

export interface CreateLanguageLauncherViewModelProps {
  sourceLanguageLabel?: string;
  sourceLanguage?: string | symbol;
  sourceLanguageOptions?: VariantOption[];
  onSourceLanguageChange?: (value: string | symbol) => void;
  normalizeSourceLanguage?: (value: unknown) => unknown;
  targetLanguageLabel?: string;
  targetLanguage?: string | symbol;
  targetLanguageOptions?: VariantOption[];
  onTargetLanguageChange?: (value: string | symbol) => void;
  normalizeTargetLanguage?: (value: unknown) => unknown;
  onSwapLanguages?: () => void;
  swapLabel?: string;
}

function composeVariantInput(config: VariantParams): VariantParams {
  return {
    key: config.key,
    label: config.label,
    value: config.value,
    options: config.options ?? [],
    onChange: config.onChange,
    normalizeValue: config.normalizeValue,
    onOpen: config.onOpen,
  };
}

function buildGroupLabel(
  sourceLabel?: string,
  targetLabel?: string,
) {
  const labelTokens = [sourceLabel, targetLabel].filter(Boolean);
  if (labelTokens.length === 0) {
    return "language selection";
  }
  return labelTokens.join(" → ");
}

function resolveSwapAction(
  onSwapLanguages?: () => void,
  swapLabel?: string,
): SwapAction | null {
  if (typeof onSwapLanguages !== "function") {
    return null;
  }
  return {
    label: swapLabel || "Swap",
    onSwap: onSwapLanguages,
  };
}

function createSourceVariant(
  props: CreateLanguageLauncherViewModelProps,
  openHandlers: VariantOpenHandlers,
) {
  return composeVariantInput({
    key: "source",
    label: props.sourceLanguageLabel,
    value: props.sourceLanguage,
    options: props.sourceLanguageOptions,
    onChange: props.onSourceLanguageChange,
    normalizeValue: props.normalizeSourceLanguage,
    onOpen: openHandlers.source,
  });
}

function createTargetVariant(
  props: CreateLanguageLauncherViewModelProps,
  openHandlers: VariantOpenHandlers,
) {
  return composeVariantInput({
    key: "target",
    label: props.targetLanguageLabel,
    value: props.targetLanguage,
    options: props.targetLanguageOptions,
    onChange: props.onTargetLanguageChange,
    normalizeValue: props.normalizeTargetLanguage,
    onOpen: openHandlers.target,
  });
}

export default function createLanguageLauncherViewModel(
  props: CreateLanguageLauncherViewModelProps,
  openHandlers: VariantOpenHandlers,
): LanguageLauncherViewModel {
  const params: Record<VariantKey, VariantParams> = {
    source: createSourceVariant(props, openHandlers),
    target: createTargetVariant(props, openHandlers),
  };

  return {
    params,
    groupLabel: buildGroupLabel(
      props.sourceLanguageLabel,
      props.targetLanguageLabel,
    ),
    swapAction: resolveSwapAction(props.onSwapLanguages, props.swapLabel),
  };
}
