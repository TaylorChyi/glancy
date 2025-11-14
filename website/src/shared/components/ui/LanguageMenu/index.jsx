import PropTypes from "prop-types";

import LanguageMenuView from "./parts/LanguageMenuView.jsx";
import useLanguageMenu from "./useLanguageMenu.js";

const buildLanguageMenuViewProps = (
  { id, variant, fullWidth, ariaLabel, showLabel },
  {
    open,
    triggerRef,
    menuRef,
    normalizedOptions,
    currentOption,
    handleToggle,
    handleSelect,
    handleTriggerKeyDown,
    closeMenu,
  },
) => ({
  id,
  open,
  variant,
  fullWidth,
  triggerRef,
  menuRef,
  currentOption,
  options: normalizedOptions,
  onToggle: handleToggle,
  onTriggerKeyDown: handleTriggerKeyDown,
  onSelect: handleSelect,
  onClose: closeMenu,
  triggerAriaLabel: ariaLabel || currentOption.label,
  triggerTitle: currentOption.label,
  showTriggerLabel: Boolean(showLabel),
});

export default function LanguageMenu(props) {
  const menuState = useLanguageMenu({
    options: props.options,
    value: props.value,
    normalizeValue: props.normalizeValue,
    onChange: props.onChange,
    onOpen: props.onOpen,
    variant: props.variant,
  });

  const { normalizedOptions, currentOption } = menuState;

  if (normalizedOptions.length === 0 || !currentOption) {
    return null;
  }

  return (
    <LanguageMenuView {...buildLanguageMenuViewProps(props, menuState)} />
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
