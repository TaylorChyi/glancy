import PropTypes from "prop-types";
import { useUser } from "@/context";
import Favorites from "./Favorites.jsx";
import styles from "./Sidebar.module.css";

function SidebarQuickActions({ onToggleFavorites }) {
  const { user } = useUser();
  const showFavorites = Boolean(user);

  return (
    <div className={styles["sidebar-quick-actions"]}>
      {showFavorites ? <Favorites onToggle={onToggleFavorites} /> : null}
    </div>
  );
}

SidebarQuickActions.propTypes = {
  onToggleFavorites: PropTypes.func,
};

export default SidebarQuickActions;
