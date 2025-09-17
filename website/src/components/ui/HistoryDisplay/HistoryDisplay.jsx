import PropTypes from "prop-types";
import { useHistory, useLanguage } from "@/context";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import styles from "./HistoryDisplay.module.css";

function HistoryDisplay({ onEmptyAction }) {
  const { history } = useHistory();
  const { t } = useLanguage();

  if (!history.length) {
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

  return (
    <div className={styles.container}>
      <ul className={styles.grid}>
        {history.map((item, idx) => (
          <li key={`${item}-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

HistoryDisplay.propTypes = {
  onEmptyAction: PropTypes.func,
};

export default HistoryDisplay;
