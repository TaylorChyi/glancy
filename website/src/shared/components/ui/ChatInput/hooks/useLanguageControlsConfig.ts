/**
 * 背景：
 *  - 语言控制面板参数计算散落在主 Hook 内，难以独立演进或复用。
 * 目的：
 *  - 提供组合式 Hook，将选项归一化与属性组装集中处理，便于未来扩展更多语言能力。
 * 关键决策与取舍：
 *  - 以 useMemo 缓存归一化结果，避免重复计算；
 *  - 暴露 isVisible 与 props 两个语义单元，保持调用处语义清晰。
 * 影响范围：
 *  - ChatInput 语言选择功能与相关测试。
 * 演进与TODO：
 *  - 若后续加入语种推荐，可在此扩展排序或过滤策略。
 */
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
