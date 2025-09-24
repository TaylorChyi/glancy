import PropTypes from "prop-types";
import { useMemo } from "react";
import { useHistory, useLanguage } from "@/context";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import styles from "./HistoryDisplay.module.css";

function HistoryDisplay({ onEmptyAction, onSelect }) {
  const { history } = useHistory();
  const { t } = useLanguage();

  const items = useMemo(() => history ?? [], [history]);

  if (!items.length) {
    return (
      <EmptyState
        size="sm"
        iconName="command-line"
        title={t.historyEmptyTitle}
        description={t.historyEmptyDescription}
        actions={
          onEmptyAction ? (
            <Button type="button" onClick={onEmptyAction}>
              {t.historyEmptyAction}
            </Button>
          ) : null
        }
      />
    );
  }

  const handleSelect = (term, versionId) => {
    if (!onSelect) return;
    onSelect(term, versionId);
  };

  return (
    <div className={styles.container}>
      <ul className={styles.grid}>
        {items.map((item) => {
          const versions = Array.isArray(item.versions) ? item.versions : [];
          return (
            <li key={item.termKey} className={styles.card}>
              <div className={styles.header}>
                <button
                  type="button"
                  className={styles.term}
                  onClick={() =>
                    handleSelect(
                      item.term,
                      item.latestVersionId ??
                        versions[0]?.id ??
                        versions[0]?.versionId ??
                        undefined,
                    )
                  }
                >
                  <span className={styles["term-text"]}>{item.term}</span>
                </button>
              </div>
              {versions.length > 0 ? (
                <ul
                  className={styles.versions}
                  id={`history-card-${item.termKey}`}
                >
                  {versions.map((version, index) => {
                    const versionId =
                      version?.id ??
                      version?.versionId ??
                      `${item.termKey}-${index}`;
                    const isActive = item.latestVersionId
                      ? String(versionId) === String(item.latestVersionId)
                      : index === 0;
                    return (
                      <li key={versionId}>
                        <button
                          type="button"
                          className={styles.version}
                          data-active={isActive ? "true" : undefined}
                          onClick={() => handleSelect(item.term, versionId)}
                        >
                          <span className={styles["version-label"]}>
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
  );
}

HistoryDisplay.propTypes = {
  onEmptyAction: PropTypes.func,
  onSelect: PropTypes.func,
};

export default HistoryDisplay;
