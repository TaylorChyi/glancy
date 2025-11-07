import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject, ReactNode } from "react";

import {
  resolveComparableValue,
  resolveCurrentOption,
  resolveNormalizedValue,
  toNormalizedOptions,
} from "@shared/components/ui/LanguageMenu/normalizers.js";

import type {
  LanguageOption,
  LanguageValue,
} from "./useActionInputBehavior.types";

export type LanguageVariantKey = "source" | "target";

interface VariantInput {
  key: LanguageVariantKey;
  label?: string;
  value?: LanguageValue;
  options: LanguageOption[];
  onChange?: (value: LanguageValue) => void;
  normalizeValue?: (value: LanguageValue) => LanguageValue;
  onOpen?: () => void;
}

interface NormalizedOption {
  value: string;
  badge: ReactNode;
  label: string;
  description?: string;
}

interface VariantModel {
  key: LanguageVariantKey;
  label: string;
  normalizedOptions: NormalizedOption[];
  currentOption: NormalizedOption | null;
  hasOptions: boolean;
  onChange?: (value: LanguageValue) => void;
  normalizeValue?: (value: LanguageValue) => LanguageValue;
  onOpen?: () => void;
}

interface UseLanguageLauncherParams {
  source: VariantInput;
  target: VariantInput;
}

interface UseLanguageLauncherResult {
  open: boolean;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  menuRef: MutableRefObject<HTMLDivElement | null>;
  variants: VariantModel[];
  activeVariant: VariantModel | null;
  handleToggle: () => void;
  handleClose: () => void;
  handleVariantEnter: (key: LanguageVariantKey) => void;
  handleSelect: (key: LanguageVariantKey, value: string) => void;
}

function resolveLabel(key: LanguageVariantKey, label?: string): string {
  if (typeof label === "string" && label.trim().length > 0) {
    return label;
  }
  return key === "source" ? "Source language" : "Target language";
}

function useNormalizedOptions(
  options: LanguageOption[],
  normalizeValue?: (value: LanguageValue) => LanguageValue,
) {
  return useMemo(
    () => toNormalizedOptions(options, normalizeValue) as NormalizedOption[],
    [options, normalizeValue],
  );
}

function useComparableSelection(
  value: LanguageValue | undefined,
  normalizeValue?: (value: LanguageValue) => LanguageValue,
) {
  return useMemo(
    () => resolveComparableValue(value, normalizeValue),
    [value, normalizeValue],
  );
}

function useCurrentOptionModel(
  normalizedOptions: NormalizedOption[],
  comparableValue: string | null,
) {
  return useMemo(
    () => resolveCurrentOption(normalizedOptions, comparableValue) ?? null,
    [normalizedOptions, comparableValue],
  );
}

function useVariantModel(input: VariantInput): VariantModel {
  const normalizedOptions = useNormalizedOptions(input.options, input.normalizeValue);
  const comparableValue = useComparableSelection(input.value, input.normalizeValue);
  const currentOption = useCurrentOptionModel(normalizedOptions, comparableValue);
  const hasOptions = normalizedOptions.length > 0 && Boolean(currentOption);

  return useMemo(
    () => ({
      key: input.key,
      label: resolveLabel(input.key, input.label),
      normalizedOptions,
      currentOption,
      hasOptions,
      onChange: input.onChange,
      normalizeValue: input.normalizeValue,
      onOpen: input.onOpen,
    }),
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
}

function useVariants(
  sourceModel: VariantModel,
  targetModel: VariantModel,
): VariantModel[] {
  return useMemo(
    () => [sourceModel, targetModel].filter((variant) => variant.hasOptions),
    [sourceModel, targetModel],
  );
}

function resolveNextActiveKey(
  current: LanguageVariantKey | null,
  variants: VariantModel[],
): LanguageVariantKey | null {
  if (variants.length === 0) {
    return null;
  }
  if (current && variants.some((variant) => variant.key === current)) {
    return current;
  }
  return variants[0].key;
}

function resolveActiveVariant(
  variants: VariantModel[],
  activeKey: LanguageVariantKey | null,
): VariantModel | null {
  if (variants.length === 0) {
    return null;
  }
  const selected = activeKey
    ? variants.find((variant) => variant.key === activeKey)
    : null;
  return selected ?? variants[0] ?? null;
}

function useActiveVariantState(variants: VariantModel[]): {
  activeVariant: VariantModel | null;
  setActiveKey: React.Dispatch<
    React.SetStateAction<LanguageVariantKey | null>
  >;
} {
  const [activeKey, setActiveKey] = useState<LanguageVariantKey | null>(null);

  useEffect(() => {
    setActiveKey((current) => resolveNextActiveKey(current, variants));
  }, [variants]);

  const activeVariant = useMemo(
    () => resolveActiveVariant(variants, activeKey),
    [activeKey, variants],
  );

  return { activeVariant, setActiveKey };
}

function useVariantOpenEmitter() {
  return useCallback((variant: VariantModel | null) => {
    variant?.onOpen?.();
  }, []);
}

function useVisibilityHandlers(
  variants: VariantModel[],
  activeVariant: VariantModel | null,
  setActiveKey: React.Dispatch<
    React.SetStateAction<LanguageVariantKey | null>
  >,
  emitVariantOpen: (variant: VariantModel | null) => void,
) {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((previous) => {
      const next = !previous;
      if (next) {
        const fallback = activeVariant ?? variants[0] ?? null;
        if (fallback) {
          setActiveKey(fallback.key);
          emitVariantOpen(fallback);
        }
      }
      return next;
    });
  }, [activeVariant, emitVariantOpen, setActiveKey, variants]);

  return { open, handleToggle, handleClose };
}

function useVariantEnterHandler(
  variants: VariantModel[],
  setActiveKey: React.Dispatch<
    React.SetStateAction<LanguageVariantKey | null>
  >,
  emitVariantOpen: (variant: VariantModel | null) => void,
) {
  return useCallback(
    (key: LanguageVariantKey) => {
      const targetVariant = variants.find((variant) => variant.key === key) ?? null;
      if (!targetVariant) {
        return;
      }
      setActiveKey(targetVariant.key);
      emitVariantOpen(targetVariant);
    },
    [emitVariantOpen, setActiveKey, variants],
  );
}

function useVariantSelectHandler(
  variants: VariantModel[],
  handleClose: () => void,
) {
  return useCallback(
    (key: LanguageVariantKey, value: string) => {
      const targetVariant = variants.find((variant) => variant.key === key);
      if (!targetVariant) {
        return;
      }

      const normalizedSelection = resolveNormalizedValue(
        value,
        targetVariant.normalizeValue,
      );

      targetVariant.onChange?.(normalizedSelection ?? value);
      handleClose();
    },
    [handleClose, variants],
  );
}

export default function useLanguageLauncher({
  source,
  target,
}: UseLanguageLauncherParams): UseLanguageLauncherResult {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const sourceModel = useVariantModel(source);
  const targetModel = useVariantModel(target);
  const variants = useVariants(sourceModel, targetModel);
  const { activeVariant, setActiveKey } = useActiveVariantState(variants);
  const emitVariantOpen = useVariantOpenEmitter();
  const visibility = useVisibilityHandlers(variants, activeVariant, setActiveKey, emitVariantOpen);
  const handleVariantEnter = useVariantEnterHandler(variants, setActiveKey, emitVariantOpen);
  const handleSelect = useVariantSelectHandler(variants, visibility.handleClose);

  return {
    triggerRef,
    menuRef,
    variants,
    activeVariant,
    handleVariantEnter,
    handleSelect,
    ...visibility,
  };
}
