import { useId, useState } from "react";
import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import NavItem from "./NavItem.jsx";
import styles from "./CollapsibleNav.module.css";

function CollapsibleNav({ label, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const handleToggle = () => {
    setOpen((previous) => !previous);
  };

  return (
    <div className={styles.wrapper} data-open={open}>
      <NavItem
        icon={icon}
        label={label}
        onClick={handleToggle}
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className={styles.chevron} aria-hidden="true">
          <ThemeIcon
            name={open ? "chevron-down" : "chevron-right"}
            width={16}
            height={16}
          />
        </span>
      </NavItem>
      <div className={styles.panel} data-open={open} id={panelId}>
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
}

CollapsibleNav.propTypes = {
  label: PropTypes.node.isRequired,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  defaultOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

CollapsibleNav.defaultProps = {
  icon: undefined,
  defaultOpen: true,
};

export default CollapsibleNav;
