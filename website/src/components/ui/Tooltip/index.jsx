import React from "react";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Tooltip.module.css";

function Tooltip({ icon, text, children }) {
  return (
    <span className={styles.tooltip}>
      {icon ? (
        <ThemeIcon name={icon} className={styles.icon} width={16} height={16} />
      ) : (
        children
      )}
      <span className={styles.content}>{text}</span>
    </span>
  );
}

export default Tooltip;
