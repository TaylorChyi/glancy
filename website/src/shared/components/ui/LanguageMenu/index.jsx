import PropTypes from "prop-types";

import LanguageMenuView from "./parts/LanguageMenuView.jsx";
import useLanguageMenu from "./useLanguageMenu.js";

export default function LanguageMenu({
  id,
  options,
  value,
  onChange,
  ariaLabel,
  normalizeValue,
  showLabel,
  variant,
  onOpen,
  fullWidth,
}) {
  const {
    open,
    triggerRef,
    menuRef,
    normalizedOptions,
    currentOption,
    handleToggle,
    handleSelect,
    handleTriggerKeyDown,
    closeMenu,
  } = useLanguageMenu({
    options,
    value,
    normalizeValue,
    onChange,
    onOpen,
    variant,
  });

  if (normalizedOptions.length === 0 || !currentOption) {
    return null;
  }

  const triggerAriaLabel = ariaLabel || currentOption.label;
  const triggerTitle = currentOption.label;
  const showTriggerLabel = Boolean(showLabel);

  return (
    <LanguageMenuView
      id={id}
      open={open}
      variant={variant}
      fullWidth={fullWidth}
      triggerRef={triggerRef}
      menuRef={menuRef}
      currentOption={currentOption}
      options={normalizedOptions}
      onToggle={handleToggle}
      onTriggerKeyDown={handleTriggerKeyDown}
      onSelect={handleSelect}
      onClose={closeMenu}
      triggerAriaLabel={triggerAriaLabel}
      triggerTitle={triggerTitle}
      showTriggerLabel={showTriggerLabel}
    />
  );
}

LanguageMenu.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  onChange: PropTypes.func,
  ariaLabel: PropTypes.string,
  normalizeValue: PropTypes.func,
  showLabel: PropTypes.bool,
  variant: PropTypes.oneOf(["source", "target"]),
  onOpen: PropTypes.func,
  fullWidth: PropTypes.bool,
};

LanguageMenu.defaultProps = {
  id: undefined,
  options: [],
  value: undefined,
  onChange: undefined,
  ariaLabel: undefined,
  normalizeValue: undefined,
  showLabel: false,
  variant: "source",
  onOpen: undefined,
  fullWidth: false,
};
