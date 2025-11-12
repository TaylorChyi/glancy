import PropTypes from "prop-types";

import LanguageMenuColumns from "./LanguageMenuColumns.jsx";
import styles from "../../ChatInput.module.css";

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

function createSwapHandler(swapAction, hoverGuards, handleClose) {
  if (!swapAction) {
    return undefined;
  }
  return () => {
    hoverGuards.cancel();
    swapAction.onSwap();
    handleClose();
  };
}

export default function LanguageLauncherMenu({
  groupLabel,
  state,
  hoverGuards,
  swapAction,
}) {
  const swapHandler = createSwapHandler(
    swapAction,
    hoverGuards,
    state.handleClose,
  );

  return (
    <MenuSurface
      groupLabel={groupLabel}
      menuRef={state.menuRef}
      hoverGuards={hoverGuards}
    >
      <LanguageMenuColumns
        variants={state.variants}
        activeKey={state.activeVariant?.key}
        onVariantEnter={state.handleVariantEnter}
        swapAction={swapAction}
        onSwap={swapHandler}
        activeVariant={state.activeVariant}
        onSelect={state.handleSelect}
      />
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
