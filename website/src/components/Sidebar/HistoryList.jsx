import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory, useFavorites, useUser, useLanguage } from "@/context";
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

  const groupedHistory = useMemo(() => history ?? [], [history]);

  const resolveVersionId = (version, fallback) =>
    version?.id ??
    version?.versionId ??
    version?.metadata?.id ??
    version?.metadata?.versionId ??
    fallback;

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
              const versions = Array.isArray(item.versions)
                ? item.versions
                : [];
              const primaryVersionId =
                item.latestVersionId ??
                resolveVersionId(versions[0], `${item.termKey}-0`);
              return (
                <li key={item.termKey} className={styles["history-entry"]}>
                  <div className={styles["history-row"]}>
                    <button
                      type="button"
                      className={styles["history-term"]}
                      onClick={() =>
                        handleSelectVersion(item, primaryVersionId)
                      }
                    >
                      <span className={styles["history-term-text"]}>
                        {item.term}
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
                  {versions.length > 0 ? (
                    <ul
                      id={`history-${item.termKey}`}
                      className={styles["history-versions"]}
                    >
                      {versions.map((version, index) => {
                        const versionId = resolveVersionId(
                          version,
                          `${item.termKey}-${index}`,
                        );
                        const isActive = item.latestVersionId
                          ? String(versionId) === String(item.latestVersionId)
                          : index === 0;
                        return (
                          <li key={versionId}>
                            <button
                              type="button"
                              className={styles["history-version"]}
                              data-active={isActive ? "true" : undefined}
                              onClick={() =>
                                handleSelectVersion(item, versionId)
                              }
                            >
                              <span>
                                {t.versionLabel ?? "版本"} {index + 1}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
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
