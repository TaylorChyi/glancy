import styles from "./Loader.module.css";

function Loader() {
  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.symbol} aria-hidden="true">
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
