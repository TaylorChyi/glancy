import PropTypes from "prop-types";
import segmentedOptionShape from "./segmentedOptionShape.js";
import styles from "./SegmentedControl.module.css";

const joinClassNames = (...tokens) => tokens.filter(Boolean).join(" ");

const segmentedControlClasses = {
  group: styles.group,
  wrap: styles["group-wrap"],
  option: styles.option,
  activeOption: styles["option-active"],
  disabledOption: styles["option-disabled"],
};

function SegmentedControl({
  value,
  options,
  onChange,
  labelledBy,
  ariaLabel,
  ariaDescribedby,
  className,
  wrap,
  disabled,
  id,
}) {
  const groupClassName = joinClassNames(
    segmentedControlClasses.group,
    wrap ? segmentedControlClasses.wrap : "",
    className,
  );

  const handleSelect = (optionValue, option) => {
    if (disabled || option.disabled) {
      return;
    }
    if (Object.is(optionValue, value)) {
      return;
    }
    if (typeof onChange === "function") {
      onChange(optionValue, option);
    }
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled ? "true" : undefined}
      className={groupClassName}
      data-wrap={wrap ? "true" : undefined}
    >
      {options.map((option) => {
        const {
          id: optionId,
          value: optionValue,
          label,
          ariaLabel: optionAriaLabel,
          ariaDescribedby: optionAriaDescribedby,
          disabled: optionDisabled,
          className: optionClassName,
        } = option;
        const isActive = Object.is(optionValue, value);
        const isDisabled = disabled || Boolean(optionDisabled);
        const buttonClassName = joinClassNames(
          segmentedControlClasses.option,
          isActive ? segmentedControlClasses.activeOption : "",
          isDisabled ? segmentedControlClasses.disabledOption : "",
          optionClassName,
        );
        return (
          <button
            key={optionId ?? String(optionValue)}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={optionAriaLabel}
            aria-describedby={optionAriaDescribedby}
            aria-disabled={isDisabled ? "true" : undefined}
            className={buttonClassName}
            disabled={isDisabled}
            onClick={() => handleSelect(optionValue, option)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

SegmentedControl.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.object,
  ]),
  options: PropTypes.arrayOf(segmentedOptionShape).isRequired,
  onChange: PropTypes.func,
  labelledBy: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaDescribedby: PropTypes.string,
  className: PropTypes.string,
  wrap: PropTypes.bool,
  disabled: PropTypes.bool,
};

SegmentedControl.defaultProps = {
  id: undefined,
  value: undefined,
  onChange: undefined,
  labelledBy: undefined,
  ariaLabel: undefined,
  ariaDescribedby: undefined,
  className: undefined,
  wrap: false,
  disabled: false,
};

export default SegmentedControl;
