import { useMemo } from "react";
import DictionaryEntrySkeleton from "./DictionaryEntrySkeleton.jsx";
import DictionaryMarkdown from "./DictionaryMarkdown.jsx";
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";
import styles from "./DictionaryEntryPlaceholder.module.css";

function DictionaryEntryPlaceholder({ preview, isLoading }) {
  const previewMarkdown = useMemo(() => {
    if (!preview) return "";
    return normalizeDictionaryMarkdown(preview);
  }, [preview]);

  if (previewMarkdown) {
    return (
      <div className={styles["preview-wrapper"]}>
        <DictionaryMarkdown>{previewMarkdown}</DictionaryMarkdown>
      </div>
    );
  }

  if (isLoading) {
    return <DictionaryEntrySkeleton />;
  }

  return null;
}

export default DictionaryEntryPlaceholder;
