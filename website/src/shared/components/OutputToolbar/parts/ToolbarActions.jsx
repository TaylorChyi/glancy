import PropTypes from "prop-types";
import styles from "../OutputToolbar.module.css";
import { useToolbarActionsModel } from "../hooks/useToolbarActionsModel.js";

const resolveVariantClass = (variant) => {
  if (!variant) return "";
  return styles[`tool-button-${variant}`] || "";
};

const renderActionButton = ({ item, baseToolButtonClass }) => {
  const variantClass = resolveVariantClass(item.variant);
  const className = [baseToolButtonClass, variantClass]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      key={item.key}
      type="button"
      className={className}
      data-active={item.active ? "true" : undefined}
      onClick={item.onClick}
      aria-label={item.label}
      title={item.label}
      disabled={item.disabled}
      ref={item.anchorRef}
      onKeyDown={item.onKeyDown}
    >
      {item.icon}
    </button>
  );
};

function ToolbarActions({ baseToolButtonClass, translator, ...modelProps }) {
  const { items } = useToolbarActionsModel({
    translator,
    ...modelProps,
  });

  if (!items.length) {
    return null;
  }

  return (
    <div className={styles["action-strip"]}>
      {items.map((item) =>
        renderActionButton({
          item,
          baseToolButtonClass,
        }),
      )}
    </div>
  );
}

ToolbarActions.propTypes = {
  translator: PropTypes.shape({
    copyAction: PropTypes.string,
    copySuccess: PropTypes.string,
    deleteButton: PropTypes.string,
    deleteAction: PropTypes.string,
    report: PropTypes.string,
  }).isRequired,
  baseToolButtonClass: PropTypes.string.isRequired,
  user: PropTypes.shape({ id: PropTypes.string }),
  disabled: PropTypes.bool.isRequired,
  canCopy: PropTypes.bool,
  onCopy: PropTypes.func,
  copyFeedbackState: PropTypes.string,
  isCopySuccess: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
};

ToolbarActions.defaultProps = {
  user: null,
  canCopy: false,
  onCopy: undefined,
  copyFeedbackState: "idle",
  isCopySuccess: false,
  canDelete: false,
  onDelete: undefined,
  canReport: false,
  onReport: undefined,
};

export default ToolbarActions;
