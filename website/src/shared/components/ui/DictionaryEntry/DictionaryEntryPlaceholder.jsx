import { useMemo } from "react";
import DictionaryEntrySkeleton from "./DictionaryEntrySkeleton.jsx";
import { DictionaryMarkdownStream } from "./DictionaryMarkdown.jsx";
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
        <DictionaryMarkdownStream text={previewMarkdown} />
      </div>
    );
  }

  if (isLoading) {
    return <DictionaryEntrySkeleton />;
  }

  return null;
}

export default DictionaryEntryPlaceholder;
