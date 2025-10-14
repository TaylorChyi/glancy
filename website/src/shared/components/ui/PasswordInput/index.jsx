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

  const allowToggle = mask && !disabled;
  const type = allowToggle ? inputType : "text";

  const { show, hide } = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );

  const ariaLabel = allowToggle && visible ? hide : show;

  const handleToggle = useCallback(() => {
    if (!allowToggle) {
      return;
    }
    toggleVisibility();
  }, [allowToggle, toggleVisibility]);

  const wrapperClassName = useMemo(
    () => [styles.wrapper, className].filter(Boolean).join(" "),
    [className],
  );
  const inputClassNames = useMemo(
    () => [styles.input, inputClassName].filter(Boolean).join(" "),
    [inputClassName],
  );
  const toggleClassNames = useMemo(
    () => [styles.toggle, toggleClassName].filter(Boolean).join(" "),
    [toggleClassName],
  );

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
      {allowToggle && (
        <button
          type="button"
          className={toggleClassNames}
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
      )}
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
