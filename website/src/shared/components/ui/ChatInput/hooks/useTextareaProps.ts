/**
 * 背景：
 *  - textarea 的属性组装混杂在主 Hook 内，增加重复与条件逻辑。
 * 目的：
 *  - 将展示层属性归档为组合 Hook，简化主 Hook 的职责边界。
 * 关键决策与取舍：
 *  - 提供默认空函数避免调用方额外判空；
 *  - 使用 useMemo 确保返回对象引用稳定，降低渲染抖动。
 * 影响范围：
 *  - ChatInput 渲染属性与测试断言。
 * 演进与TODO：
 *  - 后续可在此扩展无障碍属性或实验性输入模式。
 */
import { useMemo } from "react";
import type React from "react";

export interface UseTextareaPropsParams {
  setTextareaRef: (node: HTMLTextAreaElement | null) => void;
  rows: number;
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const noop = () => {};

export const useTextareaProps = ({
  setTextareaRef,
  rows,
  placeholder,
  value,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
}: UseTextareaPropsParams) =>
  useMemo(
    () => ({
      ref: setTextareaRef,
      rows,
      placeholder,
      value,
      onChange,
      onKeyDown,
      onFocus: onFocus ?? noop,
      onBlur: onBlur ?? noop,
    }),
    [
      onBlur,
      onChange,
      onFocus,
      onKeyDown,
      placeholder,
      rows,
      setTextareaRef,
      value,
    ],
  );
