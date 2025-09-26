import { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import styles from "./Preferences.module.css";
import { useLanguage } from "@/context";
import { useTheme } from "@/context";
import { useUser } from "@/context";
import { API_PATHS } from "@/config/api.js";
import MessagePopup from "@/components/ui/MessagePopup";
import SelectField from "@/components/form/SelectField.jsx";
import FormRow from "@/components/form/FormRow.jsx";
import { useApi } from "@/hooks/useApi.js";
import {
  VoiceSelector,
  SettingsSurface,
  SETTINGS_SURFACE_VARIANTS,
} from "@/components";
import { useSettingsStore, SUPPORTED_SYSTEM_LANGUAGES } from "@/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";

const SOURCE_LANG_STORAGE_KEY = "sourceLang";
const TARGET_LANG_STORAGE_KEY = "targetLang";
const DEFAULT_SOURCE_LANG = "auto";
const DEFAULT_TARGET_LANG = "ENGLISH";
const DEFAULT_THEME = "system";

const VARIANTS = {
  PAGE: "page",
  DIALOG: "dialog",
};

function Preferences({ variant = VARIANTS.PAGE }) {
  const { t, lang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const api = useApi();
  const { systemLanguage, setSystemLanguage } = useSettingsStore((state) => ({
    systemLanguage: state.systemLanguage,
    setSystemLanguage: state.setSystemLanguage,
  }));
  const [sourceLang, setSourceLang] = useState(
    localStorage.getItem(SOURCE_LANG_STORAGE_KEY) || DEFAULT_SOURCE_LANG,
  );
  const [targetLang, setTargetLang] = useState(
    localStorage.getItem(TARGET_LANG_STORAGE_KEY) || DEFAULT_TARGET_LANG,
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");

  const systemLanguageFormatter = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: "language" });
    } catch (error) {
      console.warn("[preferences] Intl.DisplayNames unsupported", error);
      return null;
    }
  }, [lang]);

  const formatLanguageLabel = useCallback(
    (code) => {
      const label = systemLanguageFormatter?.of(code);
      if (!label) {
        return code.toUpperCase();
      }
      return label
        .split(" ")
        .map((segment) =>
          segment.length > 0
            ? segment[0].toUpperCase() + segment.slice(1)
            : segment,
        )
        .join(" ");
    },
    [systemLanguageFormatter],
  );

  const systemLanguageOptions = useMemo(
    () => [
      { value: SYSTEM_LANGUAGE_AUTO, label: t.prefSystemLanguageAuto },
      ...SUPPORTED_SYSTEM_LANGUAGES.map((code) => ({
        value: code,
        label: formatLanguageLabel(code),
      })),
    ],
    [formatLanguageLabel, t.prefSystemLanguageAuto],
  );

  const languageOptions = useMemo(
    () => [
      { value: DEFAULT_SOURCE_LANG, label: t.autoDetect },
      { value: "CHINESE", label: "CHINESE" },
      { value: "ENGLISH", label: "ENGLISH" },
    ],
    [t],
  );

  const searchLanguageOptions = useMemo(
    () => [
      { value: "CHINESE", label: "CHINESE" },
      { value: "ENGLISH", label: "ENGLISH" },
    ],
    [],
  );

  const themeOptions = useMemo(
    () => [
      { value: "light", label: "light" },
      { value: "dark", label: "dark" },
      { value: DEFAULT_THEME, label: "system" },
    ],
    [],
  );

  const persistLanguages = useCallback((source, target) => {
    localStorage.setItem(SOURCE_LANG_STORAGE_KEY, source);
    localStorage.setItem(TARGET_LANG_STORAGE_KEY, target);
  }, []);

  const openPopup = useCallback((message) => {
    setPopupMsg(message);
    setPopupOpen(true);
  }, []);

  const applyPreferences = useCallback(
    (data) => {
      const nextSource = data.systemLanguage || DEFAULT_SOURCE_LANG;
      const nextTarget = data.searchLanguage || DEFAULT_TARGET_LANG;
      setSourceLang(nextSource);
      setTargetLang(nextTarget);
      persistLanguages(nextSource, nextTarget);
    },
    [persistLanguages],
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    api
      .request(`${API_PATHS.preferences}/user`)
      .then((data) => {
        applyPreferences(data);
      })
      .catch((err) => {
        console.error(err);
        openPopup(t.fail);
      });
  }, [api, applyPreferences, openPopup, t.fail, user]);

  const handleSystemLanguageChange = useCallback(
    (value) => {
      setSystemLanguage(value);
    },
    [setSystemLanguage],
  );

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      if (!user) {
        return;
      }
      try {
        await api.jsonRequest(`${API_PATHS.preferences}/user`, {
          method: "POST",
          body: {
            systemLanguage: sourceLang,
            searchLanguage: targetLang,
            theme,
          },
        });
        persistLanguages(sourceLang, targetLang);
        openPopup(t.saveSuccess);
      } catch (error) {
        console.error(error);
        openPopup(t.fail);
      }
    },
    [
      api,
      openPopup,
      persistLanguages,
      sourceLang,
      targetLang,
      theme,
      t.fail,
      t.saveSuccess,
      user,
    ],
  );

  const surfaceVariant =
    variant === VARIANTS.PAGE
      ? SETTINGS_SURFACE_VARIANTS.PAGE
      : SETTINGS_SURFACE_VARIANTS.MODAL;

  const preferenceSections = useMemo(
    () => [
      {
        id: "languages",
        title: t.prefDefaultsTitle,
        description: t.prefDefaultsDescription,
        fields: [
          {
            key: "source-language",
            label: t.prefLanguage,
            id: "source-lang",
            node: (
              <SelectField
                value={sourceLang}
                onChange={setSourceLang}
                options={languageOptions}
              />
            ),
          },
          {
            key: "target-language",
            label: t.prefSearchLanguage,
            id: "target-lang",
            node: (
              <SelectField
                value={targetLang}
                onChange={setTargetLang}
                options={searchLanguageOptions}
              />
            ),
          },
        ],
      },
      {
        id: "interface",
        title: t.prefInterfaceTitle,
        description: t.prefInterfaceDescription,
        fields: [
          {
            key: "system-language",
            label: t.prefSystemLanguage,
            id: "system-language",
            node: (
              <SelectField
                value={systemLanguage}
                onChange={handleSystemLanguageChange}
                options={systemLanguageOptions}
              />
            ),
          },
          {
            key: "theme",
            label: t.prefTheme,
            id: "theme-select",
            node: (
              <SelectField
                value={theme}
                onChange={setTheme}
                options={themeOptions}
              />
            ),
          },
        ],
      },
      {
        id: "voices",
        title: t.prefVoicesTitle,
        description: t.prefVoicesDescription,
        span: "wide",
        fields: [
          {
            key: "voice-en",
            label: t.prefVoiceEn,
            id: "voice-en",
            node: <VoiceSelector lang="en" />,
          },
          {
            key: "voice-zh",
            label: t.prefVoiceZh,
            id: "voice-zh",
            node: <VoiceSelector lang="zh" />,
          },
        ],
      },
    ],
    [
      handleSystemLanguageChange,
      languageOptions,
      searchLanguageOptions,
      setSourceLang,
      setTargetLang,
      setTheme,
      sourceLang,
      systemLanguage,
      systemLanguageOptions,
      targetLang,
      t.prefDefaultsDescription,
      t.prefDefaultsTitle,
      t.prefInterfaceDescription,
      t.prefInterfaceTitle,
      t.prefLanguage,
      t.prefSearchLanguage,
      t.prefSystemLanguage,
      t.prefTheme,
      t.prefVoiceEn,
      t.prefVoiceZh,
      t.prefVoicesDescription,
      t.prefVoicesTitle,
      theme,
      themeOptions,
    ],
  );

  return (
    <>
      <SettingsSurface
        variant={surfaceVariant}
        title={t.prefTitle}
        description={t.prefDescription}
        onSubmit={handleSave}
        actions={
          <button type="submit" className={styles["submit-button"]}>
            {t.saveButton}
          </button>
        }
      >
        <div className={styles.sections}>
          {preferenceSections.map((section) => {
            const sectionClassName = [
              styles.section,
              section.span === "wide" ? styles["section-wide"] : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <section
                key={section.id}
                className={sectionClassName}
                aria-labelledby={`${section.id}-title`}
              >
                <header className={styles["section-header"]}>
                  <h3
                    id={`${section.id}-title`}
                    className={styles["section-title"]}
                  >
                    {section.title}
                  </h3>
                  <p className={styles["section-description"]}>
                    {section.description}
                  </p>
                </header>
                <div className={styles["section-fields"]}>
                  {section.fields.map((field) => (
                    <FormRow
                      key={field.key}
                      label={field.label}
                      id={field.id}
                      className={styles.field}
                    >
                      {field.node}
                    </FormRow>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </SettingsSurface>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}

Preferences.propTypes = {
  variant: PropTypes.oneOf(Object.values(VARIANTS)),
};

Preferences.defaultProps = {
  variant: VARIANTS.PAGE,
};

export default Preferences;
