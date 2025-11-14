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

export default function SelectMenuView({
  id,
  fullWidth,
  open,
  triggerRef,
  menuRef,
  options,
  activeValue,
  onToggle,
  onTriggerKeyDown,
  ariaLabel,
  label,
  isPlaceholder,
  onClose,
  onSelect,
}) {
  return (
    <div
      className={styles["menu-root"]}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <SelectMenuTrigger
        id={id}
        open={open}
        triggerRef={triggerRef}
        onToggle={onToggle}
        onKeyDown={onTriggerKeyDown}
        ariaLabel={ariaLabel}
        label={label}
        isPlaceholder={isPlaceholder}
      />
      <MenuSurface
        open={open}
        anchorRef={triggerRef}
        onClose={onClose}
        menuRef={menuRef}
        options={options}
        activeValue={activeValue}
        onSelect={onSelect}
      />
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
