import React from "react";
import styles from "./ListItem.module.css";

function ListItem({
  text,
  onClick,
  actions,
  className = "",
  textClassName = "",
}) {
  return (
    <li
      className={[styles.item, className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <span className={[styles.text, textClassName].filter(Boolean).join(" ")}>
        {text}
      </span>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </li>
  );
}

export default ListItem;
