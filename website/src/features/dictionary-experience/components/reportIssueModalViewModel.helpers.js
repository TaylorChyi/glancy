import { __INTERNALS__ as languageInternals } from "./helpers/reportIssueLanguageUtils";

export { createLanguageLabels, resolveLanguageContext } from "./helpers/reportIssueLanguageUtils";
export { buildSummaryItems } from "./helpers/reportIssueSummaryUtils";

export const createCategoryOptions = (categories, translations) =>
  categories.map((option) => ({
    id: option.value,
    value: option.value,
    label: translations[option.labelKey] ?? option.value,
  }));

const pickTranslation = (translations, keys, fallback) => {
  for (const key of keys) {
    const value = translations[key];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return fallback;
};

const MODAL_STRING_FIELDS = {
  title: { keys: ["reportTitle"], fallback: "Report an issue" },
  categoryLabel: { keys: ["reportCategoryLabel"], fallback: "Issue type" },
  descriptionLabel: { keys: ["reportDescriptionLabel"], fallback: "Details" },
  descriptionPlaceholder: {
    keys: ["reportDescriptionPlaceholder"],
    fallback: "Tell us more (optional)",
  },
  cancelLabel: { keys: ["reportCancel", "cancel"], fallback: "Cancel" },
  submitLabel: { keys: ["reportSubmit"], fallback: "Submit" },
  submittingLabel: {
    keys: ["reportSubmitting", "loading"],
    fallback: "Submitting",
  },
  closeLabel: { keys: ["close"], fallback: "Close" },
};

const createModalStringResolver = (translations) => (keys, fallback) =>
  pickTranslation(translations, keys, fallback);

const resolveModalFieldEntries = (resolve) =>
  Object.entries(MODAL_STRING_FIELDS).map(([key, { keys, fallback }]) => [
    key,
    resolve(keys, fallback),
  ]);

export const buildModalStrings = (translations, error) => {
  const resolve = createModalStringResolver(translations);
  const resolvedFields = Object.fromEntries(resolveModalFieldEntries(resolve));
  return {
    ...resolvedFields,
    errorMessage: error ? resolve(["reportErrorMessage"], error) : "",
  };
};

export const __INTERNALS__ = {
  ...languageInternals,
  pickTranslation,
  MODAL_STRING_FIELDS,
  createModalStringResolver,
  resolveModalFieldEntries,
};
