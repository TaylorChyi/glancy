import PropTypes from "prop-types";
import CheckIcon from "@shared/components/ui/LanguageMenu/parts/CheckIcon.jsx";
import styles from "../../../ChatInput.module.css";

function VariantOption({ option, isActive, onSelect }) {
  return (
    <li role="none" className={styles["language-option-item"]}>
      <button
        type="button"
        role="menuitemradio"
        aria-checked={isActive}
        className={styles["language-option-button"]}
        data-active={isActive ? "true" : undefined}
        onClick={() => onSelect(option.value)}
        title={option.description || option.label}
      >
        <span className={styles["language-option-code"]}>{option.badge}</span>
        <span className={styles["language-option-name"]}>{option.label}</span>
        <span className={styles["language-option-check"]} aria-hidden="true">
          {isActive ? <CheckIcon /> : null}
        </span>
      </button>
    </li>
  );
}

VariantOption.propTypes = {
  option: PropTypes.shape({
    value: PropTypes.string.isRequired,
    badge: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default function LanguageOptionsColumn({ variant, onSelect }) {
  const options = variant?.normalizedOptions ?? [];
  const activeValue = variant?.currentOption?.value;
  const variantKey = variant?.key ?? "source";

  if (options.length === 0) {
    return (
      <div className={styles["language-options-column"]} role="presentation">
        <div className={styles["language-empty-state"]}>暂无可用语言</div>
      </div>
    );
  }

  return (
    <div className={styles["language-options-column"]} role="presentation">
      <ul role="menu" className={styles["language-options-list"]}>
        {options.map((option) => (
          <VariantOption
            key={option.value}
            option={option}
            isActive={option.value === activeValue}
            onSelect={(value) => onSelect(variantKey, value)}
          />
        ))}
      </ul>
    </div>
  );
}

LanguageOptionsColumn.propTypes = {
  variant: PropTypes.shape({
    key: PropTypes.oneOf(["source", "target"]),
    normalizedOptions: PropTypes.array,
    currentOption: PropTypes.shape({ value: PropTypes.string }),
  }),
  onSelect: PropTypes.func.isRequired,
};

LanguageOptionsColumn.defaultProps = {
  variant: null,
};
