import { useEffect, useMemo, useState } from "react";
import {
  resolveComparableValue,
  resolveCurrentOption,
  toNormalizedOptions,
} from "@shared/components/ui/LanguageMenu/normalizers.js";
import type {
  LanguageVariantKey,
  VariantInput,
  VariantModel,
  NormalizedOption,
} from "./languageLauncher.types.js";

const resolveLabel = (key: LanguageVariantKey, label?: string): string => {
  if (typeof label === "string" && label.trim().length > 0) {
    return label;
  }
  return key === "source" ? "Source language" : "Target language";
};

const useNormalizedOptions = (
  options: VariantInput["options"],
  normalizeValue?: VariantInput["normalizeValue"],
) =>
  useMemo(
    () => toNormalizedOptions(options, normalizeValue) as NormalizedOption[],
    [options, normalizeValue],
  );

const useComparableSelection = (
  value: VariantInput["value"],
  normalizeValue?: VariantInput["normalizeValue"],
) =>
  useMemo(
    () => resolveComparableValue(value, normalizeValue),
    [value, normalizeValue],
  );

const useCurrentOptionModel = (
  normalizedOptions: NormalizedOption[],
  comparableValue: string | null,
) =>
  useMemo(
    () => resolveCurrentOption(normalizedOptions, comparableValue) ?? null,
    [normalizedOptions, comparableValue],
  );

const buildVariantModel = (
  key: LanguageVariantKey,
  label: VariantInput["label"],
  normalizedOptions: NormalizedOption[],
  currentOption: NormalizedOption | null,
  hasOptions: boolean,
  onChange?: VariantInput["onChange"],
  normalizeValue?: VariantInput["normalizeValue"],
  onOpen?: VariantInput["onOpen"],
): VariantModel => ({
  key,
  label: resolveLabel(key, label),
  normalizedOptions,
  currentOption,
  hasOptions,
  onChange,
  normalizeValue,
  onOpen,
});

export const useVariantModel = (input: VariantInput): VariantModel => {
  const normalizedOptions = useNormalizedOptions(
    input.options,
    input.normalizeValue,
  );
  const comparableValue = useComparableSelection(
    input.value,
    input.normalizeValue,
  );
  const currentOption = useCurrentOptionModel(
    normalizedOptions,
    comparableValue,
  );
  const hasOptions = normalizedOptions.length > 0 && Boolean(currentOption);

  return useMemo(
    () =>
      buildVariantModel(
        input.key,
        input.label,
        normalizedOptions,
        currentOption,
        hasOptions,
        input.onChange,
        input.normalizeValue,
        input.onOpen,
      ),
    [
      currentOption,
      hasOptions,
      input.key,
      input.label,
      input.normalizeValue,
      normalizedOptions,
      input.onChange,
      input.onOpen,
    ],
  );
};

export const useVariants = (
  sourceModel: VariantModel,
  targetModel: VariantModel,
): VariantModel[] =>
  useMemo(
    () => [sourceModel, targetModel].filter((variant) => variant.hasOptions),
    [sourceModel, targetModel],
  );

const resolveNextActiveKey = (
  current: LanguageVariantKey | null,
  variants: VariantModel[],
): LanguageVariantKey | null => {
  if (variants.length === 0) {
    return null;
  }
  if (current && variants.some((variant) => variant.key === current)) {
    return current;
  }
  return variants[0].key;
};

const resolveActiveVariant = (
  variants: VariantModel[],
  activeKey: LanguageVariantKey | null,
): VariantModel | null => {
  if (variants.length === 0) {
    return null;
  }
  const selected = activeKey
    ? variants.find((variant) => variant.key === activeKey)
    : null;
  return selected ?? variants[0] ?? null;
};

export const useActiveVariantState = (variants: VariantModel[]) => {
  const [activeKey, setActiveKey] = useState<LanguageVariantKey | null>(null);

  useEffect(() => {
    setActiveKey((current) => resolveNextActiveKey(current, variants));
  }, [variants]);

  const activeVariant = useMemo(
    () => resolveActiveVariant(variants, activeKey),
    [activeKey, variants],
  );

  return { activeVariant, setActiveKey };
};
