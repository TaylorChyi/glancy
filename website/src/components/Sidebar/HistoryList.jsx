import { useEffect, useState } from "react";
import { useHistory, useFavorites, useUser } from "@/context";
import { useLanguage } from "@/context";
import ListItem from "@/components/ui/ListItem";
import ItemMenu from "@/components/ui/ItemMenu";
import Toast from "@/components/ui/Toast";
import styles from "./Sidebar.module.css";

function HistoryList({ onSelect }) {
  const { history, removeHistory, favoriteHistory, loadHistory, error } =
    useHistory();
  const { toggleFavorite } = useFavorites();
  const { user } = useUser();
  const { t } = useLanguage();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    loadHistory(user);
  }, [user, loadHistory]);

  useEffect(() => {
    if (!error) return;
    setErrorMessage(error);
  }, [error]);

  const handleToastClose = () => {
    setErrorMessage("");
  };

  const hasHistory = history.length > 0;

  return (
    <>
      {hasHistory && (
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
        open={!!errorMessage}
        message={errorMessage}
        onClose={handleToastClose}
      />
    </>
  );
}

export default HistoryList;
