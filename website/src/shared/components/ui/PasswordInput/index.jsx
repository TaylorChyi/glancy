import { forwardRef, useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./PasswordInput.module.css";

const ICON_SIZE = 20;
const DEFAULT_LABELS = Object.freeze({
  show: "Show password",
  hide: "Hide password",
});

// eslint-disable-next-line react-refresh/only-export-components
export function usePasswordVisibility({
  defaultVisible = false,
  onVisibilityChange,
} = {}) {
  const [visible, setVisible] = useState(defaultVisible);

  const toggleVisibility = useCallback(() => {
    setVisible((prev) => {
      const next = !prev;
      onVisibilityChange?.(next);
      return next;
    });
  }, [onVisibilityChange]);

  return {
    visible,
    inputType: visible ? "text" : "password",
    toggleVisibility,
  };
}

const useToggleMetadata = ({
  mask,
  disabled,
  visible,
  toggleVisibility,
  labels,
  inputType,
}) => {
  const allowToggle = mask && !disabled;
  const type = allowToggle ? inputType : "text";
  const resolvedLabels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );
  const ariaLabel = allowToggle && visible ? resolvedLabels.hide : resolvedLabels.show;

  const handleToggle = useCallback(() => {
    if (!allowToggle) {
      return;
    }
    toggleVisibility();
  }, [allowToggle, toggleVisibility]);

  return { allowToggle, type, ariaLabel, handleToggle };
};

const useClassName = (base, extra) =>
  useMemo(() => [base, extra].filter(Boolean).join(" "), [base, extra]);

const PasswordToggleButton = ({
  allowToggle,
  handleToggle,
  ariaLabel,
  visible,
  iconSize,
  className,
}) =>
  allowToggle ? (
    <button
      type="button"
      className={className}
      onClick={handleToggle}
      aria-label={ariaLabel}
      aria-pressed={visible}
    >
      <ThemeIcon
        name={visible ? "eye-off" : "eye"}
        width={iconSize}
        height={iconSize}
        alt={ariaLabel}
      />
    </button>
  ) : null;

const PasswordInput = forwardRef(function PasswordInput(
  {
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
  },
  ref,
) {
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

  return (
    <div className={wrapperClassName} data-visible={allowToggle && visible}>
      <input
        {...inputProps}
        ref={ref}
        type={type}
        disabled={disabled}
        className={inputClassNames}
        autoComplete={autoComplete ?? "current-password"}
      />
      <PasswordToggleButton
        allowToggle={allowToggle}
        handleToggle={handleToggle}
        ariaLabel={ariaLabel}
        visible={visible}
        iconSize={iconSize}
        className={toggleClassNames}
      />
    </div>
  );
});

PasswordInput.propTypes = {
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  toggleClassName: PropTypes.string,
  defaultVisible: PropTypes.bool,
  onVisibilityChange: PropTypes.func,
  labels: PropTypes.shape({
    show: PropTypes.string,
    hide: PropTypes.string,
  }),
  iconSize: PropTypes.number,
  mask: PropTypes.bool,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
};

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
