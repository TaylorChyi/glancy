import { useHistory, useLanguage } from "@/context";
import styles from "./HistoryDisplay.module.css";

function HistoryDisplay() {
  const { history } = useHistory();
  const { t } = useLanguage();

  if (!history.length) {
    return (
      <div className="display-content">
        <div className="display-term">{t.noHistory}</div>
      </div>
    );
  }

  return (
    <div className="display-content" style={{ maxHeight: 400, overflowY: "auto", width: "100%" }}>
      <ul className={styles["history-grid-display"]}>
        {history.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryDisplay;
