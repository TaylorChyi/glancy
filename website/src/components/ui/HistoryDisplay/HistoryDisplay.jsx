import { forwardRef } from "react";
import { FixedSizeList as List } from "react-window";
import { useHistory, useLanguage } from "@/context";
import styles from "./HistoryDisplay.module.css";

const ITEM_HEIGHT = 32;

const InnerElement = forwardRef(function InnerElement({ style, ...rest }, ref) {
  return (
    <ul
      ref={ref}
      style={style}
      className={styles["history-grid-display"]}
      {...rest}
    />
  );
});

const Row = ({ data, index, style }) => <li style={style}>{data[index]}</li>;

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

  const height = Math.min(400, history.length * ITEM_HEIGHT);

  return (
    <List
      height={height}
      itemCount={history.length}
      itemSize={ITEM_HEIGHT}
      width="100%"
      itemData={history}
      innerElementType={InnerElement}
    >
      {Row}
    </List>
  );
}

export default HistoryDisplay;
