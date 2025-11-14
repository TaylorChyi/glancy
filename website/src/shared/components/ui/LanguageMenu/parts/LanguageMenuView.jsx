import PropTypes from "prop-types";

import Popover from "@shared/components/ui/Popover/Popover.jsx";

import styles from "../LanguageMenu.module.css";
import { optionPropType, refPropType } from "./LanguageMenuPropTypes.js";
import { LanguageMenuPopoverContent } from "./LanguageMenuList.jsx";

function LanguageMenuTriggerContent({ badge, label, showTriggerLabel }) {
  return (
    <span className={styles["language-trigger-content"]}>
      <span className={styles["language-trigger-code"]}>{badge}</span>
      <span
        className={styles["language-trigger-label"]}
        data-visible={showTriggerLabel}
      >
        {label}
      </span>
    </span>
  );
}

LanguageMenuTriggerContent.propTypes = {
  badge: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  showTriggerLabel: PropTypes.bool.isRequired,
};

function LanguageMenuTrigger(props) {
  return <LanguageMenuTriggerButton {...props} />;
}

function LanguageMenuTriggerButton(props) {
  return (
    <button {...getLanguageMenuTriggerButtonAttributes(props)}>
      <LanguageMenuTriggerContent
        badge={props.badge}
        label={props.label}
        showTriggerLabel={props.showTriggerLabel}
      />
    </button>
  );
}

function getLanguageMenuTriggerButtonAttributes({
  id,
  open,
  variant,
  fullWidth,
  triggerRef,
  onToggle,
  onTriggerKeyDown,
  triggerAriaLabel,
  triggerTitle,
}) {
  const dataFullWidth = fullWidth ? "true" : undefined;

  return {
    type: "button",
    id,
    className: styles["language-trigger"],
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: onToggle,
    onKeyDown: onTriggerKeyDown,
    "aria-label": triggerAriaLabel,
    title: triggerTitle,
    ref: triggerRef,
    "data-open": open,
    "data-variant": variant,
    "data-fullwidth": dataFullWidth,
  };
}

LanguageMenuTrigger.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  variant: PropTypes.oneOf(["source", "target"]).isRequired,
  fullWidth: PropTypes.bool,
  triggerRef: refPropType,
  onToggle: PropTypes.func.isRequired,
  onTriggerKeyDown: PropTypes.func.isRequired,
  triggerAriaLabel: PropTypes.string.isRequired,
  triggerTitle: PropTypes.string.isRequired,
  showTriggerLabel: PropTypes.bool.isRequired,
  badge: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
};

LanguageMenuTrigger.defaultProps = {
  id: undefined,
  fullWidth: false,
  triggerRef: undefined,
};


function LanguageMenuPopover(props) {
  const { open, triggerRef, menuRef, options, currentValue, onSelect, onClose } =
    props;

  return (
    <Popover
      isOpen={open}
      anchorRef={triggerRef}
      onClose={onClose}
      placement="top"
      align="start"
      fallbackPlacements={["bottom"]}
      offset={12}
    >
      {open && (
        <LanguageMenuPopoverContent
          menuRef={menuRef}
          open={open}
          options={options}
          currentValue={currentValue}
          onSelect={onSelect}
        />
      )}
    </Popover>
  );
}

LanguageMenuPopover.propTypes = {
  open: PropTypes.bool.isRequired,
  triggerRef: refPropType,
  menuRef: refPropType,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  currentValue: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

LanguageMenuPopover.defaultProps = {
  triggerRef: undefined,
  menuRef: undefined,
};

function getLanguageMenuTriggerProps({
  id,
  open,
  variant,
  fullWidth,
  triggerRef,
  onToggle,
  onTriggerKeyDown,
  triggerAriaLabel,
  triggerTitle,
  showTriggerLabel,
  currentOption,
}) {
  return {
    id,
    open,
    variant,
    fullWidth,
    triggerRef,
    onToggle,
    onTriggerKeyDown,
    triggerAriaLabel,
    triggerTitle,
    showTriggerLabel,
    badge: currentOption.badge,
    label: currentOption.label,
  };
}

function getLanguageMenuPopoverProps({
  open,
  triggerRef,
  menuRef,
  options,
  currentOption,
  onSelect,
  onClose,
}) {
  return {
    open,
    triggerRef,
    menuRef,
    options,
    currentValue: currentOption.value,
    onSelect,
    onClose,
  };
}

export default function LanguageMenuView(props) {
  return (
    <div
      className={styles["language-select-wrapper"]}
      data-fullwidth={props.fullWidth ? "true" : undefined}
    >
      <LanguageMenuTrigger {...getLanguageMenuTriggerProps(props)} />
      <LanguageMenuPopover {...getLanguageMenuPopoverProps(props)} />
    </div>
  );
}

LanguageMenuView.propTypes = {
  id: PropTypes.string,
  open: PropTypes.bool.isRequired,
  variant: PropTypes.oneOf(["source", "target"]).isRequired,
  fullWidth: PropTypes.bool,
  triggerRef: refPropType,
  menuRef: refPropType,
  currentOption: optionPropType.isRequired,
  options: PropTypes.arrayOf(optionPropType).isRequired,
  onToggle: PropTypes.func.isRequired,
  onTriggerKeyDown: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  triggerAriaLabel: PropTypes.string.isRequired,
  triggerTitle: PropTypes.string.isRequired,
  showTriggerLabel: PropTypes.bool.isRequired,
};

LanguageMenuView.defaultProps = {
  id: undefined,
  fullWidth: false,
  triggerRef: undefined,
  menuRef: undefined,
};
