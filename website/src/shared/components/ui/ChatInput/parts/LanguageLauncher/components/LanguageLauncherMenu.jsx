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

export default function LanguageLauncherMenu({
  groupLabel,
  state,
  hoverGuards,
  swapAction,
}) {
  const {
    menuRef,
    variants,
    activeVariant,
    handleVariantEnter,
    handleSelect,
    handleClose,
  } = state;
  const activeKey = activeVariant?.key;
  const swapHandler = swapAction
    ? () => {
        hoverGuards.cancel();
        swapAction.onSwap();
        handleClose();
      }
    : undefined;

  return (
    <MenuSurface
      groupLabel={groupLabel}
      menuRef={menuRef}
      hoverGuards={hoverGuards}
    >
      <LanguageMenuColumns
        variants={variants}
        activeKey={activeKey}
        onVariantEnter={handleVariantEnter}
        swapAction={swapAction}
        onSwap={swapHandler}
        activeVariant={activeVariant}
        onSelect={handleSelect}
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
