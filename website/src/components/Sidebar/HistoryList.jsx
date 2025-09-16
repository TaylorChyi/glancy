import { useEffect } from "react";
import { useHistory, useFavorites, useUser } from "@/context";
import { useLanguage } from "@/context";
import ListItem from "@/components/ui/ListItem";
import ItemMenu from "@/components/ui/ItemMenu";
import Toast from "@/components/ui/Toast";
import styles from "./Sidebar.module.css";

function HistoryList({ onSelect }) {
  const {
    history,
    loadHistory,
    removeHistory,
    favoriteHistory,
    error,
    clearError,
  } = useHistory();
  const { toggleFavorite } = useFavorites();
  const { user } = useUser();
  const { t } = useLanguage();

  useEffect(() => {
    if (!user?.token) return;
    loadHistory(user);
  }, [user, loadHistory]);

  return (
    <>
      {history.length > 0 && (
        <div
          className={`${styles["sidebar-section"]} ${styles["history-list"]}`}
        >
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
      )}
      <Toast
        open={!!error}
        message={error || ""}
        onClose={clearError}
        duration={5000}
      />
    </>
  );
}

export default HistoryList;
