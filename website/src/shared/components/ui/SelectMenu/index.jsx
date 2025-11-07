import PropTypes from "prop-types";

import MenuSurface from "./parts/MenuSurface.jsx";
import SelectMenuTrigger from "./parts/Trigger.jsx";
import { OptionShape } from "./optionNormalizer.js";
import useSelectMenuController from "./useSelectMenuController.js";

import styles from "./SelectMenu.module.css";

export default function SelectMenu({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  placeholder,
  fullWidth,
}) {
  const {
    open,
    menuRef,
    triggerRef,
    normalizedOptions,
    handleToggle,
    handleClose,
    handleSelect,
    handleTriggerKeyDown,
    resolvedAriaLabel,
    triggerLabel,
    isShowingPlaceholder,
    activeValue,
    hasOptions,
  } = useSelectMenuController({
    options,
    value,
    onChange,
    ariaLabel,
    placeholder,
  });

  if (!hasOptions) {
    return null;
  }

  return (
    <div
      className={styles["menu-root"]}
      data-fullwidth={fullWidth ? "true" : undefined}
    >
      <SelectMenuTrigger
        id={id}
        open={open}
        triggerRef={triggerRef}
        onToggle={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        ariaLabel={resolvedAriaLabel}
        label={triggerLabel}
        isPlaceholder={isShowingPlaceholder}
      />
      <MenuSurface
        open={open}
        anchorRef={triggerRef}
        onClose={handleClose}
        menuRef={menuRef}
        options={normalizedOptions}
        activeValue={activeValue}
        onSelect={handleSelect}
      />
    </div>
  );
}

SelectMenu.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(OptionShape),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  placeholder: PropTypes.string,
  fullWidth: PropTypes.bool,
};

SelectMenu.defaultProps = {
  id: undefined,
  options: [],
  value: "",
  onChange: undefined,
  ariaLabel: undefined,
  placeholder: undefined,
  fullWidth: false,
};
