import { Fragment, memo } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./Header.module.css";
import {
  useMenuClose,
  useMenuSections,
  useTranslationResolver,
} from "./useUserMenuDropdown.js";

const menuItemShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  action: PropTypes.func,
  tone: PropTypes.oneOf(["default", "danger"]).isRequired,
});

const menuSectionShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(menuItemShape).isRequired,
});

const MenuItemButton = memo(function MenuItemButton({ item, handleMenuAction }) {
  const buttonClassName =
    item.tone === "danger"
      ? `${styles["menu-item"]} ${styles["menu-item-danger"]}`
      : styles["menu-item"];

  return (
    <button
      type="button"
      role="menuitem"
      className={buttonClassName}
      onClick={handleMenuAction(item.action)}
    >
      <span className={styles["menu-item-leading"]} aria-hidden="true">
        <ThemeIcon
          name={item.icon}
          className={styles["menu-icon"]}
          width={20}
          height={20}
          tone="dark"
        />
      </span>
      <span className={styles["menu-label"]}>{item.label}</span>
    </button>
  );
});

const MenuSection = memo(function MenuSection({
  section,
  isLast,
  handleMenuAction,
}) {
  return (
    <Fragment>
      {section.items.map((item) => (
        <MenuItemButton
          key={item.key}
          item={item}
          handleMenuAction={handleMenuAction}
        />
      ))}
      {!isLast && <div className={styles["menu-divider"]} aria-hidden="true" />}
    </Fragment>
  );
});

const MenuSections = ({ sections, handleMenuAction }) => (
  <div className={styles["menu-panel"]} role="menu">
    {sections.map((section, index) => (
      <MenuSection
        key={section.key}
        section={section}
        isLast={index === sections.length - 1}
        handleMenuAction={handleMenuAction}
      />
    ))}
  </div>
);

MenuSections.propTypes = {
  sections: PropTypes.arrayOf(menuSectionShape).isRequired,
  handleMenuAction: PropTypes.func.isRequired,
};

MenuSection.propTypes = {
  section: menuSectionShape.isRequired,
  isLast: PropTypes.bool.isRequired,
  handleMenuAction: PropTypes.func.isRequired,
};

MenuItemButton.propTypes = {
  item: menuItemShape.isRequired,
  handleMenuAction: PropTypes.func.isRequired,
};

function UserMenuDropdown({
  open,
  setOpen,
  t,
  isPro,
  onOpenSettings,
  onOpenUpgrade,
  onOpenLogout,
}) {
  const { rootRef, handleMenuAction } = useMenuClose(open, setOpen);
  const translate = useTranslationResolver(t);
  const menuSections = useMenuSections({
    isPro,
    translate,
    onOpenSettings,
    onOpenUpgrade,
    onOpenLogout,
  });

  if (!open) return null;

  return (
    <div ref={rootRef} className={styles["user-menu-dropdown"]}>
      <MenuSections sections={menuSections} handleMenuAction={handleMenuAction} />
    </div>
  );
}

UserMenuDropdown.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
  isPro: PropTypes.bool,
  onOpenSettings: PropTypes.func,
  onOpenUpgrade: PropTypes.func,
  onOpenLogout: PropTypes.func,
};

UserMenuDropdown.defaultProps = {
  isPro: false,
  onOpenSettings: undefined,
  onOpenUpgrade: undefined,
  onOpenLogout: undefined,
};

export default UserMenuDropdown;
