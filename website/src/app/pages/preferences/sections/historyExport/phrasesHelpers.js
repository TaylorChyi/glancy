import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

export const sanitizePhraseField = (value) =>
  typeof value === "string" ? stripMarkdownArtifacts(value) : "";

export const normalizePhraseEntry = (phrase) => {
  if (typeof phrase === "string") {
    const text = sanitizePhraseField(phrase);
    return text ? { name: text, meaning: "" } : null;
  }

  const name = sanitizePhraseField(phrase?.词组);
  const meaning = sanitizePhraseField(phrase?.释义 ?? phrase?.解释);

  if (!name) {
    return null;
  }

  return { name, meaning };
};

export const formatPhraseBullet = ({ name, meaning }) =>
  meaning ? `• ${name} — ${meaning}` : `• ${name}`;

export const buildPhraseLines = (phrases = []) =>
  phrases.map(normalizePhraseEntry).filter(Boolean).map(formatPhraseBullet);

export const extractPhrasesFromEntry = (entry) =>
  Array.isArray(entry?.["常见词组"]) ? entry["常见词组"] : [];

export const hasPhraseContent = (collection) =>
  Array.isArray(collection) && collection.length > 0;
