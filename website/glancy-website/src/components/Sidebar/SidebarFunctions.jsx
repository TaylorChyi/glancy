import Favorites from "./Favorites.jsx";
import HistoryList from "./HistoryList.jsx";
import styles from "./Sidebar.module.css";
import { useUser } from "@/context/UserContext.jsx";

function SidebarFunctions({ onToggleFavorites, onSelectHistory }) {
  const { user } = useUser();
  return (
    <div className={styles["sidebar-functions"]}>
      {user && <Favorites onToggle={onToggleFavorites} />}
      <HistoryList onSelect={onSelectHistory} />
    </div>
  );
}

export default SidebarFunctions;
