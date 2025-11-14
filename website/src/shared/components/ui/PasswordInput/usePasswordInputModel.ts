import { useMemo } from "react";

import styles from "./PasswordInput.module.css";
import { usePasswordVisibility } from "./usePasswordVisibility";

const ICON_SIZE = 20;
const DEFAULT_LABELS = Object.freeze({
  show: "Show password",
  hide: "Hide password",
});

type PasswordInputModelProps = {
  className?: string;
  inputClassName?: string;
  toggleClassName?: string;
  defaultVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  labels?: typeof DEFAULT_LABELS;
  iconSize?: number;
  mask?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  [key: string]: unknown;
};

function useToggleMetadata({
  mask,
  disabled,
  visible,
  toggleVisibility,
  labels,
  inputType,
}: {
  mask: boolean;
  disabled: boolean;
  visible: boolean;
  toggleVisibility: () => void;
  labels: typeof DEFAULT_LABELS;
  inputType: string;
}) {
  return useMemo(() => {
    const allowToggle = mask && !disabled;
    const type = allowToggle ? inputType : "text";
    const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
    const ariaLabel =
      allowToggle && visible ? resolvedLabels.hide : resolvedLabels.show;
    const handleToggle = () => {
      if (allowToggle) {
        toggleVisibility();
      }
    };
    return { allowToggle, type, ariaLabel, handleToggle };
  }, [mask, disabled, inputType, labels, visible, toggleVisibility]);
}

const useClassName = (base: string, extra?: string) =>
  useMemo(() => [base, extra].filter(Boolean).join(" "), [base, extra]);

type BuildPasswordInputViewPropsArgs = {
  allowToggle: boolean;
  handleToggle: () => void;
  ariaLabel: string;
  visible: boolean;
  iconSize: number;
  wrapperClassName: string;
  inputClassNames: string;
  toggleClassNames: string;
  inputProps: Record<string, unknown>;
  type: string;
  disabled: boolean;
  autoComplete?: string;
};

function buildPasswordInputViewProps({
  allowToggle,
  handleToggle,
  ariaLabel,
  visible,
  iconSize,
  wrapperClassName,
  inputClassNames,
  toggleClassNames,
  inputProps,
  type,
  disabled,
  autoComplete,
}: BuildPasswordInputViewPropsArgs) {
  return {
    viewProps: {
      wrapperClassName,
      inputProps: {
        ...inputProps,
        type,
        disabled,
        className: inputClassNames,
        autoComplete: autoComplete ?? "current-password",
      },
      toggle: {
        allowToggle,
        handleToggle,
        ariaLabel,
        visible,
        iconSize,
        className: toggleClassNames,
      },
    },
  };
}

export function usePasswordInputModel({ className = "", inputClassName = "", toggleClassName = "", defaultVisible = false, onVisibilityChange, labels = DEFAULT_LABELS, iconSize = ICON_SIZE, mask = true, disabled = false, autoComplete, ...inputProps }: PasswordInputModelProps) {
  const { visible, inputType, toggleVisibility } = usePasswordVisibility({
    defaultVisible,
    onVisibilityChange,
  });
  const { allowToggle, type, ariaLabel, handleToggle } = useToggleMetadata({
    mask,
    disabled,
    visible,
    toggleVisibility,
    labels,
    inputType,
  });
  const wrapperClassName = useClassName(styles.wrapper, className),
    inputClassNames = useClassName(styles.input, inputClassName),
    toggleClassNames = useClassName(styles.toggle, toggleClassName);
  return buildPasswordInputViewProps({
    wrapperClassName, inputClassNames, toggleClassNames,
    inputProps, type, disabled,
    autoComplete, allowToggle,
    handleToggle, ariaLabel,
    visible, iconSize,
  });
}

export default usePasswordInputModel;
