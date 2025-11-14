import PropTypes from "prop-types";
import { useMemo } from "react";
import { useHistory, useLanguage } from "@core/context";
import ThemeIcon from "@shared/components/ui/Icon";
import EmptyState from "@shared/components/ui/EmptyState";
import Button from "@shared/components/ui/Button";
import styles from "./HistoryDisplay.module.css";

const formatHistoryDate = (formatter, timestamp) => {
  if (!timestamp || !formatter) return null;
  try {
    return formatter.format(new Date(timestamp));
  } catch {
    return null;
  }
};

const useHistoryDisplayData = () => {
  const { history } = useHistory();
  const { lang, t } = useLanguage();

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

  return { items, dateFormatter, t };
};

const HistoryItem = ({ item, dateFormatter, onSelect }) => {
  const displayDate = formatHistoryDate(dateFormatter, item.createdAt);
  const handleClick = () =>
    onSelect?.(item, item?.latestVersionId ?? undefined);
  return (
    <li className={styles.card}>
      <button type="button" className={styles.term} onClick={handleClick}>
        <span className={styles["term-text"]}>{item.term}</span>
        <span className={styles.trailing}>
          {displayDate && (
            <time
              dateTime={item.createdAt ?? undefined}
              className={styles.meta}
            >
              {displayDate}
            </time>
          )}
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
};

const HistoryList = ({ items, dateFormatter, onSelect }) => (
  <ul className={styles.grid}>
    {items.map((item) => (
      <HistoryItem
        key={item.termKey}
        item={item}
        dateFormatter={dateFormatter}
        onSelect={onSelect}
      />
    ))}
  </ul>
);

const HistoryEmptyState = ({ onEmptyAction, t }) => (
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

function HistoryDisplay({ onEmptyAction, onSelect }) {
  const { items, dateFormatter, t } = useHistoryDisplayData();

  if (!items.length) {
    return <HistoryEmptyState onEmptyAction={onEmptyAction} t={t} />;
  }

  return (
    <div className={styles.container}>
      <HistoryList
        items={items}
        dateFormatter={dateFormatter}
        onSelect={onSelect}
      />
    </div>
  );
}

HistoryDisplay.propTypes = {
  onEmptyAction: PropTypes.func,
  onSelect: PropTypes.func,
};

export default HistoryDisplay;
