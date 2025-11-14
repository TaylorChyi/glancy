import PropTypes from "prop-types";
import styles from "../../../ChatInput.module.css";
import LanguageMenuColumns from "./LanguageMenuColumns.jsx";

function MenuSurface({ groupLabel, menuRef, hoverGuards, children }) {
  return (
    <div
      ref={menuRef}
      className={styles["language-launcher-menu"]}
      role="menu"
      aria-label={groupLabel}
      onMouseOver={hoverGuards.enter}
      onMouseOut={hoverGuards.leave}
    >
      {children}
    </div>
  );
}

MenuSurface.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  menuRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

function getSwapHandler(hoverGuards, swapAction, handleClose) {
  if (!swapAction) {
    return undefined;
  }

  return () => {
    hoverGuards.cancel();
    swapAction.onSwap();
    handleClose();
  };
}

function getLanguageMenuColumnsProps(state, hoverGuards, swapAction) {
  const {
    variants,
    activeVariant,
    handleVariantEnter,
    handleSelect,
    handleClose,
  } = state;

  return {
    variants,
    activeKey: activeVariant?.key,
    onVariantEnter: handleVariantEnter,
    swapAction,
    onSwap: getSwapHandler(hoverGuards, swapAction, handleClose),
    activeVariant,
    onSelect: handleSelect,
  };
}

export default function LanguageLauncherMenu({
  groupLabel,
  state,
  hoverGuards,
  swapAction,
}) {
  const { menuRef } = state;
  const columnsProps = getLanguageMenuColumnsProps(state, hoverGuards, swapAction);

  return (
    <MenuSurface
      groupLabel={groupLabel}
      menuRef={menuRef}
      hoverGuards={hoverGuards}
    >
      <LanguageMenuColumns {...columnsProps} />
    </MenuSurface>
  );
}

LanguageLauncherMenu.propTypes = {
  groupLabel: PropTypes.string.isRequired,
  state: PropTypes.shape({
    menuRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) })
      .isRequired,
    variants: PropTypes.arrayOf(PropTypes.object).isRequired,
    activeVariant: PropTypes.object,
    handleVariantEnter: PropTypes.func.isRequired,
    handleSelect: PropTypes.func.isRequired,
    handleClose: PropTypes.func.isRequired,
  }).isRequired,
  hoverGuards: PropTypes.shape({
    enter: PropTypes.func.isRequired,
    leave: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
  }).isRequired,
  swapAction: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onSwap: PropTypes.func.isRequired,
  }),
};

LanguageLauncherMenu.defaultProps = {
  swapAction: null,
};
