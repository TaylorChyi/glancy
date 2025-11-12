import { useLanguage } from "@core/context";
import styles from "./DictionaryEntry.module.css";
import LegacyDictionaryArticle from "./LegacyDictionaryArticle.jsx";
import ModernDictionaryArticle from "./ModernDictionaryArticle.jsx";
import MarkdownArticle from "./MarkdownArticle.jsx";

function tryParseJson(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function buildEntryClassName(className) {
  return [styles["dictionary-entry"], className].filter(Boolean).join(" ");
}

function isModernEntry(entry) {
  return Object.prototype.hasOwnProperty.call(entry, "发音解释");
}

export default function DictionaryEntry({ entry, className }) {
  const { t, lang } = useLanguage();
  if (!entry) return null;

  const entryClassName = buildEntryClassName(className);

  if (entry.markdown) {
    const parsed = tryParseJson(entry.markdown);
    if (parsed) {
      return <DictionaryEntry entry={parsed} className={className} />;
    }
    return <MarkdownArticle markdown={entry.markdown} className={entryClassName} />;
  }

  return isModernEntry(entry) ? (
    <ModernDictionaryArticle
      entry={entry}
      className={entryClassName}
      t={t}
      lang={lang}
    />
  ) : (
    <LegacyDictionaryArticle
      entry={entry}
      className={entryClassName}
      t={t}
      lang={lang}
    />
  );
}
