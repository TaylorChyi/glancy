import PropTypes from "prop-types";
import { useOutsideToggle } from "@/hooks";
import Avatar from "@/components/ui/Avatar";
import SidebarActionItem from "./SidebarActionItem.jsx";
import styles from "./Sidebar.module.css";
import headerStyles from "@/components/Header/Header.module.css";

function SidebarUserMenuTrigger({
  size,
  showName,
  isPro,
  username,
  planLabel,
  children,
}) {
  const { open, setOpen, ref } = useOutsideToggle(false);
  const displayName = showName
    ? username || planLabel || ""
    : username || planLabel || "";
  const description = planLabel || "";

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const wrapperClassName = [
    styles["sidebar-user-trigger"],
    headerStyles["user-menu"],
  ].join(" ");

  return (
    <div className={wrapperClassName} ref={ref}>
      <SidebarActionItem
        icon={<Avatar width={size} height={size} />}
        label={displayName}
        description={description || undefined}
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        data-plan-tier={isPro ? "premium" : "free"}
      />
      {children({ open, setOpen })}
    </div>
  );
}

SidebarUserMenuTrigger.propTypes = {
  size: PropTypes.number.isRequired,
  showName: PropTypes.bool.isRequired,
  isPro: PropTypes.bool.isRequired,
  username: PropTypes.string.isRequired,
  planLabel: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
};

export default SidebarUserMenuTrigger;
