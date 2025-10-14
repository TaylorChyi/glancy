import layoutStyles from "./DictionaryEntry.module.css";
import styles from "./DictionaryEntrySkeleton.module.css";

function SkeletonSection({ lines = 2 }) {
  return (
    <div className={styles.section}>
      <div className={styles.label} />
      <div className={styles.lines}>
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className={styles.line} />
        ))}
      </div>
    </div>
  );
}

function DictionaryEntrySkeleton() {
  return (
    <article
      className={`${layoutStyles["dictionary-entry"]} ${styles.skeleton}`}
    >
      <div className={styles.header}>
        <div className={styles.title} />
        <div className={styles.phonetic} />
      </div>
      <SkeletonSection lines={3} />
      <SkeletonSection lines={2} />
      <SkeletonSection lines={4} />
    </article>
  );
}

export default DictionaryEntrySkeleton;
