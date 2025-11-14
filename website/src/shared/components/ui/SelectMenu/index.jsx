import PropTypes from "prop-types";

import { OptionShape } from "./optionNormalizer.js";
import SelectMenuView from "./SelectMenuView.jsx";
import useSelectMenuController from "./useSelectMenuController.js";

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
    <SelectMenuView
      id={id}
      fullWidth={fullWidth}
      open={open}
      triggerRef={triggerRef}
      menuRef={menuRef}
      options={normalizedOptions}
      activeValue={activeValue}
      onToggle={handleToggle}
      onTriggerKeyDown={handleTriggerKeyDown}
      ariaLabel={resolvedAriaLabel}
      label={triggerLabel}
      isPlaceholder={isShowingPlaceholder}
      onClose={handleClose}
      onSelect={handleSelect}
    />
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
