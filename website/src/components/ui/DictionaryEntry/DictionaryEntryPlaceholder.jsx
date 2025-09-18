import MarkdownStream from "@/components/ui/MarkdownStream";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import layoutStyles from "./DictionaryEntry.module.css";
import styles from "./DictionaryEntryPlaceholder.module.css";
import DictionaryEntrySkeleton from "./DictionaryEntrySkeleton.jsx";

function PreviewRenderer({ children }) {
  return (
    <MarkdownRenderer className={styles["preview-text"]}>
      {children}
    </MarkdownRenderer>
  );
}

function DictionaryEntryPlaceholder({ preview, isLoading }) {
  if (preview) {
    return (
      <article
        className={`${layoutStyles["dictionary-entry"]} ${styles.preview}`}
      >
        <MarkdownStream text={preview} renderer={PreviewRenderer} />
      </article>
    );
  }

  if (isLoading) {
    return <DictionaryEntrySkeleton />;
  }

  return null;
}

export default DictionaryEntryPlaceholder;
