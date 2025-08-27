import React from "react";
import styles from "./Loader.module.css";

/** 简单的加载指示器组件 */
const Loader: React.FC = () => (
  <div className={styles.loader}>
    <div className={styles.spinner} />
  </div>
);

export default Loader;
