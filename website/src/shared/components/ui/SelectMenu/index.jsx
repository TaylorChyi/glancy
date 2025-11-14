import PropTypes from "prop-types";

import { OptionShape } from "./optionNormalizer.js";
import SelectMenuView from "./SelectMenuView.jsx";
import useSelectMenuController from "./useSelectMenuController.js";

export default function SelectMenu({ id, options, value, onChange, ariaLabel, placeholder, fullWidth }) {
  const controller = useSelectMenuController({ options, value, onChange, ariaLabel, placeholder });
  if (!controller.hasOptions) return null;

  return (
    <SelectMenuView
      id={id}
      fullWidth={fullWidth}
      open={controller.open}
      triggerRef={controller.triggerRef}
      menuRef={controller.menuRef}
      options={controller.normalizedOptions}
      activeValue={controller.activeValue}
      onToggle={controller.handleToggle}
      onTriggerKeyDown={controller.handleTriggerKeyDown}
      ariaLabel={controller.resolvedAriaLabel}
      label={controller.triggerLabel}
      isPlaceholder={controller.isShowingPlaceholder}
      onClose={controller.handleClose}
      onSelect={controller.handleSelect}
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
