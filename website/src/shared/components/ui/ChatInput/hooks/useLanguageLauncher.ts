/**
 * 背景：
 *  - 语言选择控件需要统一管理双语种的选项、打开状态与交互逻辑。
 * 目的：
 *  - 提供集中式 Hook，将源/目标语言的归一化、当前项与交互回调封装，供视图层复用。
 * 关键决策与取舍：
 *  - 继续复用共享 normalizer，避免在 ChatInput 内重复实现归一化策略；
 *  - 以有限状态机思路维护 activeVariant，确保任一时刻仅有一个子菜单展开；
 *  - 将 variant-specific onOpen 视为策略注入，便于埋点与未来行为扩展。
 * 影响范围：
 *  - ChatInput 语言菜单触发器的行为逻辑。
 * 演进与TODO：
 *  - TODO: 后续可在此扩展键盘左右切换 variant 的行为，提升无鼠标体验。
 */
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

function useVariantModel(input: VariantInput): VariantModel {
  const { key, label, options, value, normalizeValue, onChange, onOpen } = input;

  const normalizedOptions = useMemo(
    () => toNormalizedOptions(options, normalizeValue) as NormalizedOption[],
    [options, normalizeValue],
  );

  const comparableValue = useMemo(
    () => resolveComparableValue(value, normalizeValue),
    [value, normalizeValue],
  );

  const currentOption = useMemo(
    () => resolveCurrentOption(normalizedOptions, comparableValue) ?? null,
    [normalizedOptions, comparableValue],
  );

  const hasOptions = normalizedOptions.length > 0 && Boolean(currentOption);

  return useMemo(
    () => ({
      key,
      label: resolveLabel(key, label),
      normalizedOptions,
      currentOption,
      hasOptions,
      onChange,
      normalizeValue,
      onOpen,
    }),
    [
      currentOption,
      hasOptions,
      key,
      label,
      normalizeValue,
      normalizedOptions,
      onChange,
      onOpen,
    ],
  );
}

export default function useLanguageLauncher({
  source,
  target,
}: UseLanguageLauncherParams): UseLanguageLauncherResult {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<LanguageVariantKey | null>(null);

  const sourceModel = useVariantModel(source);
  const targetModel = useVariantModel(target);

  const variants = useMemo(
    () => [sourceModel, targetModel].filter((variant) => variant.hasOptions),
    [sourceModel, targetModel],
  );

  useEffect(() => {
    if (variants.length === 0) {
      setActiveKey(null);
      return;
    }

    const hasActive = activeKey
      ? variants.some((variant) => variant.key === activeKey)
      : false;

    if (!hasActive) {
      setActiveKey(variants[0].key);
    }
  }, [activeKey, variants]);

  const activeVariant = useMemo(
    () =>
      variants.find((variant) => variant.key === activeKey) ?? variants[0] ?? null,
    [activeKey, variants],
  );

  const emitVariantOpen = useCallback(
    (variant: VariantModel | null) => {
      variant?.onOpen?.();
    },
    [],
  );

  const handleToggle = useCallback(() => {
    setOpen((previous) => {
      const next = !previous;
      if (next) {
        const fallbackVariant =
          variants.find((variant) => variant.key === activeKey) ?? variants[0] ?? null;
        if (fallbackVariant) {
          setActiveKey(fallbackVariant.key);
          emitVariantOpen(fallbackVariant);
        }
      }
      return next;
    });
  }, [activeKey, emitVariantOpen, variants]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleVariantEnter = useCallback(
    (key: LanguageVariantKey) => {
      const targetVariant = variants.find((variant) => variant.key === key) ?? null;
      if (!targetVariant) {
        return;
      }
      setActiveKey(targetVariant.key);
      emitVariantOpen(targetVariant);
    },
    [emitVariantOpen, variants],
  );

  const handleSelect = useCallback(
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
      setOpen(false);
    },
    [variants],
  );

  return {
    open,
    triggerRef,
    menuRef,
    variants,
    activeVariant,
    handleToggle,
    handleClose,
    handleVariantEnter,
    handleSelect,
  };
}
