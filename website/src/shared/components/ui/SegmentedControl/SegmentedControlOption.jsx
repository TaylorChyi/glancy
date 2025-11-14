import PropTypes from "prop-types";
import segmentedOptionShape from "./segmentedOptionShape.js";
import styles from "./SegmentedControl.module.css";
import joinClassNames from "./joinClassNames.js";
function SegmentedControlOption({ option, isActive, isDisabled, onSelect }) {
  const { value, label, ariaLabel, ariaDescribedby, className } = option;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={isDisabled ? "true" : undefined}
      className={joinClassNames(
        styles.option,
        isActive && styles["option-active"],
        isDisabled && styles["option-disabled"],
        className,
      )}
      disabled={isDisabled}
      onClick={() => onSelect(value, option)}
    >
      {label}
    </button>
  );
}
SegmentedControlOption.propTypes = { option: segmentedOptionShape.isRequired, isActive: PropTypes.bool.isRequired, isDisabled: PropTypes.bool.isRequired, onSelect: PropTypes.func.isRequired };
export default SegmentedControlOption;
