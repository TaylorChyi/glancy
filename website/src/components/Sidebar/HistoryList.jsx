import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory, useUser } from "@/context";
import Toast from "@/components/ui/Toast";
import styles from "./Sidebar.module.css";

function HistoryList({ onSelect }) {
  const { history, loadHistory, error } = useHistory();
  const { user } = useUser();
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

  const groupedHistory = useMemo(() => history ?? [], [history]);
  const hasHistory = groupedHistory.length > 0;

  const handleSelect = (item) => {
    if (!onSelect) return;
    const versionId = item?.latestVersionId ?? undefined;
    onSelect(item, versionId);
  };

  return (
    <>
      {hasHistory && (
        <div
          className={`${styles["sidebar-section"]} ${styles["history-list"]}`}
        >
          <ul className={styles["history-items"]}>
            {groupedHistory.map((item) => {
              return (
                <li key={item.termKey} className={styles["history-entry"]}>
                  <button
                    type="button"
                    className={styles["history-button"]}
                    onClick={() => handleSelect(item)}
                  >
                    <div className={styles["history-labels"]}>
                      <span className={styles["history-term-text"]}>
                        {item.term}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
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

HistoryList.propTypes = {
  onSelect: PropTypes.func,
};

export default HistoryList;
