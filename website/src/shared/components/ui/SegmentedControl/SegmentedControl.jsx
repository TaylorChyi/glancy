import PropTypes from "prop-types";
import segmentedOptionShape from "./segmentedOptionShape.js";
import styles from "./SegmentedControl.module.css";
import joinClassNames from "./joinClassNames.js";
import SegmentedControlOption from "./SegmentedControlOption.jsx";
import useSegmentedControlSelect from "./useSegmentedControlSelect.js";

const segmentedControlClasses = {
  group: styles.group,
  wrap: styles["group-wrap"],
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

  const handleSelect = useSegmentedControlSelect({
    disabled,
    onChange,
    value,
  });

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
        const isActive = Object.is(option.value, value);
        const isDisabled = disabled || Boolean(option.disabled);

        return (
          <SegmentedControlOption
            key={option.id ?? String(option.value)}
            option={option}
            isActive={isActive}
            isDisabled={isDisabled}
            onSelect={handleSelect}
          />
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
