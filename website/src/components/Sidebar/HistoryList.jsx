import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory, useFavorites, useUser, useLanguage } from "@/context";
import ItemMenu from "@/components/ui/ItemMenu";
import Toast from "@/components/ui/Toast";
import styles from "./Sidebar.module.css";

const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    console.warn("[HistoryList] failed to format timestamp", err);
    return value;
  }
};

function HistoryList({ onSelect }) {
  const { history, removeHistory, favoriteHistory, loadHistory, error } =
    useHistory();
  const { toggleFavorite } = useFavorites();
  const { user } = useUser();
  const { t } = useLanguage();
  const [errorMessage, setErrorMessage] = useState("");
  const [expandedKey, setExpandedKey] = useState(null);

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

  const handleSelectVersion = (item, versionId) => {
    if (!onSelect) return;
    onSelect(item.term, versionId ?? item.latestVersionId);
  };

  const hasHistory = groupedHistory.length > 0;

  return (
    <>
      {hasHistory && (
        <div
          className={`${styles["sidebar-section"]} ${styles["history-list"]}`}
        >
          <ul className={styles["history-items"]}>
            {groupedHistory.map((item) => {
              const isExpanded = expandedKey === item.termKey;
              const secondaryVersions = item.versions.slice(1);
              return (
                <li key={item.termKey} className={styles["history-entry"]}>
                  <div className={styles["history-row"]}>
                    <button
                      type="button"
                      className={styles["history-term"]}
                      onClick={() => handleSelectVersion(item)}
                    >
                      <span className={styles["history-term-text"]}>
                        {item.term}
                      </span>
                      <span className={styles["history-meta"]}>
                        <span className={styles["history-count"]}>
                          {item.versions.length}
                        </span>
                        {item.createdAt ? (
                          <span className={styles["history-created"]}>
                            {formatTimestamp(item.createdAt)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    <ItemMenu
                      favoriteLabel={t.favoriteAction}
                      deleteLabel={t.deleteAction}
                      onFavorite={() => {
                        favoriteHistory(
                          item.termKey,
                          user,
                          item.latestVersionId ?? undefined,
                        );
                        toggleFavorite(item.term);
                      }}
                      onDelete={() => removeHistory(item.termKey, user)}
                    />
                  </div>
                  {secondaryVersions.length > 0 && (
                    <div className={styles["history-expansion"]}>
                      <button
                        type="button"
                        className={styles["history-expand"]}
                        onClick={() =>
                          setExpandedKey((prev) =>
                            prev === item.termKey ? null : item.termKey,
                          )
                        }
                        aria-expanded={isExpanded}
                        aria-controls={`history-${item.termKey}`}
                      >
                        {isExpanded
                          ? (t.collapse ?? "收起版本")
                          : (t.expand ?? "展开版本")}
                      </button>
                    </div>
                  )}
                  {secondaryVersions.length > 0 && isExpanded && (
                    <ul
                      id={`history-${item.termKey}`}
                      className={styles["history-versions"]}
                    >
                      {item.versions.map((version, index) => (
                        <li key={version.id}>
                          <button
                            type="button"
                            className={styles["history-version"]}
                            data-active={
                              index === 0 || version.id === item.latestVersionId
                                ? "true"
                                : undefined
                            }
                            onClick={() =>
                              handleSelectVersion(item, version.id)
                            }
                          >
                            <span>
                              {t.versionLabel ?? "版本"} {index + 1}
                            </span>
                            <span className={styles["history-version-time"]}>
                              {formatTimestamp(version.createdAt)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
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
