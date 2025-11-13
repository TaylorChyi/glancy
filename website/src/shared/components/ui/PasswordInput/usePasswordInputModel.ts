import { useCallback, useMemo } from "react";

import styles from "./PasswordInput.module.css";
import { usePasswordVisibility } from "./usePasswordVisibility";

const ICON_SIZE = 20;
const DEFAULT_LABELS = Object.freeze({
  show: "Show password",
  hide: "Hide password",
});

const useToggleMetadata = ({
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
}) => {
  const allowToggle = mask && !disabled;
  const type = allowToggle ? inputType : "text";
  const resolvedLabels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );
  const ariaLabel =
    allowToggle && visible ? resolvedLabels.hide : resolvedLabels.show;

  const handleToggle = useCallback(() => {
    if (!allowToggle) {
      return;
    }
    toggleVisibility();
  }, [allowToggle, toggleVisibility]);

  return { allowToggle, type, ariaLabel, handleToggle };
};

const useClassName = (base: string, extra?: string) =>
  useMemo(() => [base, extra].filter(Boolean).join(" "), [base, extra]);

export const usePasswordInputModel = (props) => {
  const {
    className = "",
    inputClassName = "",
    toggleClassName = "",
    defaultVisible = false,
    onVisibilityChange,
    labels = DEFAULT_LABELS,
    iconSize = ICON_SIZE,
    mask = true,
    disabled = false,
    autoComplete,
    ...inputProps
  } = props;

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

  const wrapperClassName = useClassName(styles.wrapper, className);
  const inputClassNames = useClassName(styles.input, inputClassName);
  const toggleClassNames = useClassName(styles.toggle, toggleClassName);

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
};

export default usePasswordInputModel;
