import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useHistory, useLanguage } from "@/context";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import styles from "./HistoryDisplay.module.css";

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
  } catch (error) {
    console.warn("[HistoryDisplay] failed to format timestamp", error);
    return value;
  }
};

function HistoryDisplay({ onEmptyAction, onSelect }) {
  const { history } = useHistory();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(() => new Set());

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

  const toggleExpanded = (termKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(termKey)) {
        next.delete(termKey);
      } else {
        next.add(termKey);
      }
      return next;
    });
  };

  const handleSelect = (term, versionId) => {
    if (!onSelect) return;
    onSelect(term, versionId);
  };

  return (
    <div className={styles.container}>
      <ul className={styles.grid}>
        {items.map((item) => {
          const isExpanded = expanded.has(item.termKey);
          return (
            <li key={item.termKey} className={styles.card}>
              <div className={styles.header}>
                <button
                  type="button"
                  className={styles.term}
                  onClick={() =>
                    handleSelect(item.term, item.latestVersionId ?? undefined)
                  }
                >
                  <span className={styles["term-text"]}>{item.term}</span>
                  <span className={styles.badge}>{item.versions.length}</span>
                </button>
                {item.createdAt ? (
                  <span className={styles.timestamp}>
                    {formatTimestamp(item.createdAt)}
                  </span>
                ) : null}
              </div>
              {item.versions.length > 1 ? (
                <button
                  type="button"
                  className={styles.toggle}
                  onClick={() => toggleExpanded(item.termKey)}
                  aria-expanded={isExpanded}
                  aria-controls={`history-card-${item.termKey}`}
                >
                  {isExpanded
                    ? (t.collapse ?? "收起版本")
                    : (t.expand ?? "展开版本")}
                </button>
              ) : null}
              {(item.versions.length === 1 || isExpanded) && (
                <ul
                  className={styles.versions}
                  id={`history-card-${item.termKey}`}
                >
                  {item.versions.map((version, index) => (
                    <li key={version.id}>
                      <button
                        type="button"
                        className={styles.version}
                        data-active={
                          version.id === item.latestVersionId
                            ? "true"
                            : undefined
                        }
                        onClick={() => handleSelect(item.term, version.id)}
                      >
                        <span>
                          {t.versionLabel ?? "版本"} {index + 1}
                        </span>
                        <span className={styles["version-time"]}>
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
  );
}

HistoryDisplay.propTypes = {
  onEmptyAction: PropTypes.func,
  onSelect: PropTypes.func,
};

export default HistoryDisplay;
