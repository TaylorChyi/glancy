import PropTypes from "prop-types";

import MenuSurface from "./parts/MenuSurface.jsx";
import SelectMenuTrigger from "./parts/Trigger.jsx";
import { OptionShape } from "./optionNormalizer.js";

import styles from "./SelectMenu.module.css";

const ElementType =
  typeof Element === "undefined" ? class ElementFallback {} : Element;

const refShape = PropTypes.shape({
  current: PropTypes.instanceOf(ElementType),
});

const getTriggerProps = ({
  id,
  open,
  triggerRef,
  onToggle,
  onTriggerKeyDown,
  ariaLabel,
  label,
  isPlaceholder,
}) => ({
  id,
  open,
  triggerRef,
  onToggle,
  onKeyDown: onTriggerKeyDown,
  ariaLabel,
  label,
  isPlaceholder,
});

const getMenuSurfaceProps = ({
  open,
  triggerRef,
  onClose,
  menuRef,
  options,
  activeValue,
  onSelect,
}) => ({
  open,
  anchorRef: triggerRef,
  onClose,
  menuRef,
  options,
  activeValue,
  onSelect,
});

export default function SelectMenuView(props) {
  const { fullWidth } = props;
  const triggerProps = getTriggerProps(props);
  const menuSurfaceProps = getMenuSurfaceProps(props);

  return (
    <div
      className={styles["menu-root"]}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <SelectMenuTrigger {...triggerProps} />
      <MenuSurface {...menuSurfaceProps} />
    </div>
  );
}

SelectMenuView.propTypes = {
  id: PropTypes.string,
  fullWidth: PropTypes.bool,
  open: PropTypes.bool.isRequired,
  triggerRef: refShape.isRequired,
  menuRef: refShape.isRequired,
  options: PropTypes.arrayOf(OptionShape).isRequired,
  activeValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggle: PropTypes.func.isRequired,
  onTriggerKeyDown: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
  label: PropTypes.string.isRequired,
  isPlaceholder: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

SelectMenuView.defaultProps = {
  id: undefined,
  fullWidth: false,
  ariaLabel: undefined,
  activeValue: undefined,
};
