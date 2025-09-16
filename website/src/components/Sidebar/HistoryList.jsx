import { useHistory, useFavorites, useUser } from "@/context";
import { useLanguage } from "@/context";
import ListItem from "@/components/ui/ListItem";
import ItemMenu from "@/components/ui/ItemMenu";
import styles from "./Sidebar.module.css";

function HistoryList({ onSelect }) {
  const { history, removeHistory, favoriteHistory } = useHistory();
  const { toggleFavorite } = useFavorites();
  const { user } = useUser();
  const { t } = useLanguage();

  if (history.length === 0) return null;

  return (
    <div className={`${styles["sidebar-section"]} ${styles["history-list"]}`}>
      <ul>
        {history.map((h, i) => (
          <ListItem
            key={i}
            text={h}
            onClick={() => onSelect && onSelect(h)}
            actions={
              <ItemMenu
                favoriteLabel={t.favoriteAction}
                deleteLabel={t.deleteAction}
                onFavorite={() => {
                  favoriteHistory(h, user);
                  toggleFavorite(h);
                }}
                onDelete={() => removeHistory(h, user)}
              />
            }
          />
        ))}
      </ul>
    </div>
  );
}

export default HistoryList;
