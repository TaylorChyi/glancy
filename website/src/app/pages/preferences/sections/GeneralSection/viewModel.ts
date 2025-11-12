type TranslationMap = Record<string, string | undefined>;

type Option = {
  value: string;
  label: string;
};

type GeneralFieldModel = {
  fieldId: string;
  label: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
};

type LanguageFieldModel = {
  selectId: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  normalizeValue: (value?: string | null) => string;
};

export type GeneralSectionViewModel = {
  section: {
    title: string;
    headingId: string;
  };
  themeField: GeneralFieldModel;
  languageField: LanguageFieldModel;
  markdownField: GeneralFieldModel;
};

const THEME_ORDER = Object.freeze(["light", "dark", "system"]);

type CreateViewModelArgs = {
  title: string;
  headingId: string;
  ids: {
    theme: string;
    language: string;
    markdown: string;
  };
  theme: string;
  systemLanguage?: string | null;
  markdownMode: string;
  translations: TranslationMap;
  availableLanguages: string[];
  systemLanguageAutoValue: string;
  handlers: {
    onThemeSelect: (value: string) => void;
    onLanguageSelect: (value: string) => void;
    onMarkdownModeSelect: (value: string) => void;
    normalizeSystemLanguage: (value?: string | null) => string;
  };
  markdownModes: string[];
};

const resolveThemeLabel = (translations: TranslationMap, value: string) => {
  if (value === "light") {
    return translations.settingsGeneralThemeLight ?? "Light";
  }
  if (value === "dark") {
    return translations.settingsGeneralThemeDark ?? "Dark";
  }
  if (value === "system") {
    return translations.settingsGeneralThemeSystem ?? "System";
  }
  return value;
};

const resolveLanguageLabel = (translations: TranslationMap, code: string) => {
  const key = `settingsGeneralLanguageOption_${code}`;
  if (code === "zh") {
    return translations[key] ?? "Chinese";
  }
  if (code === "en") {
    return translations[key] ?? "English";
  }
  return translations[key] ?? code;
};

const resolveMarkdownLabel = (translations: TranslationMap, value: string) => {
  if (value === "dynamic") {
    return translations.settingsGeneralMarkdownDynamic ?? "Render dynamically";
  }
  if (value === "plain") {
    return translations.settingsGeneralMarkdownPlain ?? "Show raw text";
  }
  return value;
};

export const createGeneralSectionViewModel = ({
  title,
  headingId,
  ids,
  theme,
  systemLanguage,
  markdownMode,
  translations,
  availableLanguages,
  systemLanguageAutoValue,
  handlers,
  markdownModes,
}: CreateViewModelArgs): GeneralSectionViewModel => {
  const themeField: GeneralFieldModel = {
    fieldId: ids.theme,
    label: translations.settingsGeneralThemeLabel ??
      translations.prefTheme ??
      "Theme",
    options: THEME_ORDER.map((value) => ({
      value,
      label: resolveThemeLabel(translations, value),
    })),
    value: theme,
    onSelect: handlers.onThemeSelect,
  };

  const languageField: LanguageFieldModel = {
    selectId: ids.language,
    label:
      translations.settingsGeneralLanguageLabel ??
      translations.prefSystemLanguage ??
      "System language",
    options: [
      {
        value: systemLanguageAutoValue,
        label:
          translations.prefSystemLanguageAuto ?? "Match device language",
      },
      ...availableLanguages.map((code) => ({
        value: code,
        label: resolveLanguageLabel(translations, code),
      })),
    ],
    value: systemLanguage ?? systemLanguageAutoValue,
    onChange: handlers.onLanguageSelect,
    normalizeValue: handlers.normalizeSystemLanguage,
  };

  const markdownField: GeneralFieldModel = {
    fieldId: ids.markdown,
    label: translations.settingsGeneralMarkdownLabel ?? "Markdown rendering",
    options: markdownModes.map((value) => ({
      value,
      label: resolveMarkdownLabel(translations, value),
    })),
    value: markdownMode,
    onSelect: handlers.onMarkdownModeSelect,
  };

  return {
    section: { title, headingId },
    themeField,
    languageField,
    markdownField,
  };
};
