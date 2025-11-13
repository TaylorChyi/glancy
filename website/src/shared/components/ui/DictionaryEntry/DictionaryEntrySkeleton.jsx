import { useMemo } from "react";

import layoutStyles from "./DictionaryEntry.module.css";
import styles from "./DictionaryEntrySkeleton.module.css";

const generateSkeletonId = () => {
  const cryptoApi = globalThis?.crypto;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `skeleton-${Math.random().toString(36).slice(2, 11)}`;
};

function SkeletonSection({ lines = 2 }) {
  const lineIds = useMemo(
    () => Array.from({ length: lines }, () => generateSkeletonId()),
    [lines],
  );

  return (
    <div className={styles.section}>
      <div className={styles.label} />
      <div className={styles.lines}>
        {lineIds.map((lineId) => (
          <div key={lineId} className={styles.line} />
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
