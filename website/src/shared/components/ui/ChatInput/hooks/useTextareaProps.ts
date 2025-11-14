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
    [setTextareaRef, rows, placeholder, value, onChange, onKeyDown, onFocus, onBlur],
  );
