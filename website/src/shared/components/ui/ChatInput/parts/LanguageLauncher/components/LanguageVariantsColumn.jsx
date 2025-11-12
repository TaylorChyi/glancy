import PropTypes from "prop-types";
import styles from "../../../ChatInput.module.css";

function VariantRow({ variant, isActive, onEnter }) {
  const description = variant.currentOption?.label || "--";
  return (
    <li role="none" className={styles["language-variant-item"]}>
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={isActive}
        className={styles["language-variant-button"]}
        data-active={isActive ? "true" : undefined}
        onMouseEnter={() => onEnter(variant.key)}
        onFocus={() => onEnter(variant.key)}
      >
        <span className={styles["language-variant-label"]}>
          {variant.label}
        </span>
        <span className={styles["language-variant-description"]}>
          {description}
        </span>
      </button>
    </li>
  );
}

VariantRow.propTypes = {
  variant: PropTypes.shape({
    key: PropTypes.oneOf(["source", "target"]).isRequired,
    label: PropTypes.string.isRequired,
    currentOption: PropTypes.shape({
      label: PropTypes.string,
    }),
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onEnter: PropTypes.func.isRequired,
};

export default function LanguageVariantsColumn({
  variants,
  activeKey,
  onVariantEnter,
  swapAction,
  onSwap,
}) {
  return (
    <div className={styles["language-variant-column"]} role="presentation">
      <ul role="menu" className={styles["language-variant-list"]}>
        {variants.map((variant) => (
          <VariantRow
            key={variant.key}
            variant={variant}
            isActive={variant.key === activeKey}
            onEnter={onVariantEnter}
          />
        ))}
      </ul>
      {swapAction ? (
        <button
          type="button"
          className={styles["language-swap-action"]}
          onClick={onSwap}
        >
          {swapAction.label}
        </button>
      ) : null}
    </div>
  );
}

LanguageVariantsColumn.propTypes = {
  variants: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeKey: PropTypes.oneOf(["source", "target"]),
  onVariantEnter: PropTypes.func.isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
  }),
  onSwap: PropTypes.func,
};

LanguageVariantsColumn.defaultProps = {
  activeKey: undefined,
  swapAction: null,
  onSwap: undefined,
};
