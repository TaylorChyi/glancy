import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory, useUser, useLanguage } from "@/context";
import ThemeIcon from "@/components/ui/Icon";
import Toast from "@/components/ui/Toast";
import styles from "./Sidebar.module.css";

function HistoryList({ onSelect }) {
  const { history, loadHistory, error } = useHistory();
  const { user } = useUser();
  const { lang } = useLanguage();
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
  const locale = lang === "en" ? "en-US" : "zh-CN";
  const dateFormatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [locale]);

  const resolveDisplayDate = (timestamp) => {
    if (!timestamp || !dateFormatter) return null;
    try {
      return dateFormatter.format(new Date(timestamp));
    } catch {
      return null;
    }
  };

  const handleSelect = (item) => {
    if (!onSelect) return;
    onSelect(item.term);
  };

  return (
    <>
      {hasHistory && (
        <div
          className={`${styles["sidebar-section"]} ${styles["history-list"]}`}
        >
          <ul className={styles["history-items"]}>
            {groupedHistory.map((item) => {
              const displayDate = resolveDisplayDate(item.createdAt);
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
                      {displayDate ? (
                        <time
                          dateTime={item.createdAt ?? undefined}
                          className={styles["history-meta"]}
                        >
                          {displayDate}
                        </time>
                      ) : null}
                    </div>
                    <ThemeIcon
                      name="arrow-right"
                      width={18}
                      height={18}
                      aria-hidden="true"
                      className={styles["history-arrow"]}
                    />
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
