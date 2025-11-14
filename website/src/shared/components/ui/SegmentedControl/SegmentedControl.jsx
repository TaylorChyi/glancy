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

function SegmentedControlOptions({ options, value, disabled, onSelect }) {
  return options.map((option) => {
    const isActive = Object.is(option.value, value);
    const isDisabled = disabled || Boolean(option.disabled);

    return (
      <SegmentedControlOption
        key={option.id ?? String(option.value)}
        option={option}
        isActive={isActive}
        isDisabled={isDisabled}
        onSelect={onSelect}
      />
    );
  });
}

function SegmentedControl(props) {
  const groupClassName = joinClassNames(segmentedControlClasses.group, props.wrap ? segmentedControlClasses.wrap : "", props.className);
  const handleSelect = useSegmentedControlSelect({
    disabled: props.disabled,
    onChange: props.onChange,
    value: props.value,
  });
  return (
    <div
      id={props.id}
      role="radiogroup"
      aria-labelledby={props.labelledBy}
      aria-label={props.labelledBy ? undefined : props.ariaLabel}
      aria-describedby={props.ariaDescribedby}
      aria-disabled={props.disabled ? "true" : undefined}
      className={groupClassName}
      data-wrap={props.wrap ? "true" : undefined}
    >
      <SegmentedControlOptions
        options={props.options}
        value={props.value}
        disabled={props.disabled}
        onSelect={handleSelect}
      />
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
