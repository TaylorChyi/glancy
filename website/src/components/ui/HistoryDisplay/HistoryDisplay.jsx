import PropTypes from "prop-types";
import { useMemo } from "react";
import { useHistory, useLanguage } from "@/context";
import ThemeIcon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import styles from "./HistoryDisplay.module.css";

function HistoryDisplay({ onEmptyAction, onSelect }) {
  const { history } = useHistory();
  const { t, lang } = useLanguage();

  const items = useMemo(() => history ?? [], [history]);
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

  const handleSelect = (term) => {
    if (!onSelect) return;
    onSelect(term);
  };

  return (
    <div className={styles.container}>
      <ul className={styles.grid}>
        {items.map((item) => {
          const displayDate = resolveDisplayDate(item.createdAt);
          return (
            <li key={item.termKey} className={styles.card}>
              <button
                type="button"
                className={styles.term}
                onClick={() => handleSelect(item.term)}
              >
                <span className={styles["term-text"]}>{item.term}</span>
                <span className={styles.trailing}>
                  {displayDate ? (
                    <time
                      dateTime={item.createdAt ?? undefined}
                      className={styles.meta}
                    >
                      {displayDate}
                    </time>
                  ) : null}
                  <ThemeIcon
                    name="arrow-right"
                    width={18}
                    height={18}
                    aria-hidden="true"
                    className={styles.arrow}
                  />
                </span>
              </button>
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
