import { useMemo } from "react";
import DictionaryEntry from "./DictionaryEntry.jsx";
import DictionaryEntrySkeleton from "./DictionaryEntrySkeleton.jsx";
import styles from "./DictionaryEntryPlaceholder.module.css";

function DictionaryEntryPlaceholder({ preview, isLoading }) {
  const previewEntry = useMemo(() => {
    if (!preview) return null;
    return { markdown: preview };
  }, [preview]);

  if (previewEntry) {
    return (
      <div className={styles["preview-wrapper"]}>
        <DictionaryEntry entry={previewEntry} />
      </div>
    );
  }

  if (isLoading) {
    return <DictionaryEntrySkeleton />;
  }

  return null;
}

export default DictionaryEntryPlaceholder;
