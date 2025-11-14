export const buildSummaryItems = ({
  term,
  language,
  resolvedLanguageLabel,
  dictionaryModeLabel,
  translations,
}) => {
  const summaryItems = [
    {
      key: "term",
      label: translations.reportTermLabel ?? "Term",
      value: term,
    },
  ];

  if (language) {
    summaryItems.push({
      key: "language",
      label: translations.reportLanguageLabel ?? "Language",
      value: resolvedLanguageLabel,
    });
  }

  if (dictionaryModeLabel) {
    summaryItems.push({
      key: "dictionary-mode",
      label: translations.reportFlavorLabel ?? "Dictionary",
      value: dictionaryModeLabel,
    });
  }

  return summaryItems;
};
