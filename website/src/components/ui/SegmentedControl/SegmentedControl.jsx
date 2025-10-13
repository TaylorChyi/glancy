/**
 * 背景：
 *  - 偏好页与举报模态重复实现段控按钮，样式与交互容易漂移。
 * 目的：
 *  - 以组合模式提供可复用的分段选择组件，统一角色属性与视觉反馈。
 * 关键决策与取舍：
 *  - 采用函数式 props 描述选项集合，放弃嵌套子组件 API，降低现有调用方迁移成本。
 * 影响范围：
 *  - 偏好设置分区、举报模态等需要段控交互的界面。
 * 演进与TODO：
 *  - TODO: 后续可扩展 density/size 等属性，以适配更复杂的布局需求。
 */
import PropTypes from "prop-types";
import styles from "./SegmentedControl.module.css";

const joinClassNames = (...tokens) => tokens.filter(Boolean).join(" ");

const segmentedOptionShape = PropTypes.shape({
  id: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
  label: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  ariaDescribedby: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
});

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
    styles.group,
    wrap ? styles.groupWrap : "",
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
          styles.option,
          isActive ? styles.optionActive : "",
          isDisabled ? styles.optionDisabled : "",
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
export { segmentedOptionShape };
