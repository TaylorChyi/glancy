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

  const splitFieldsClassName = `${styles["section-fields"]} ${styles["section-fields-split"]}`;

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
          <fieldset className={styles.section}>
            <legend className={styles["section-title"]}>
              {t.prefDefaultsTitle}
            </legend>
            <p className={styles["section-description"]}>
              {t.prefDefaultsDescription}
            </p>
            <div className={splitFieldsClassName}>
              <FormRow
                label={t.prefLanguage}
                id="source-lang"
                className={styles.field}
              >
                <SelectField
                  value={sourceLang}
                  onChange={setSourceLang}
                  options={languageOptions}
                />
              </FormRow>
              <FormRow
                label={t.prefSearchLanguage}
                id="target-lang"
                className={styles.field}
              >
                <SelectField
                  value={targetLang}
                  onChange={setTargetLang}
                  options={searchLanguageOptions}
                />
              </FormRow>
            </div>
          </fieldset>

          <fieldset className={styles.section}>
            <legend className={styles["section-title"]}>
              {t.prefInterfaceTitle}
            </legend>
            <p className={styles["section-description"]}>
              {t.prefInterfaceDescription}
            </p>
            <div className={splitFieldsClassName}>
              <FormRow
                label={t.prefSystemLanguage}
                id="system-language"
                className={styles.field}
              >
                <SelectField
                  value={systemLanguage}
                  onChange={handleSystemLanguageChange}
                  options={systemLanguageOptions}
                />
              </FormRow>
              <FormRow
                label={t.prefTheme}
                id="theme-select"
                className={styles.field}
              >
                <SelectField
                  value={theme}
                  onChange={setTheme}
                  options={themeOptions}
                />
              </FormRow>
            </div>
          </fieldset>

          <fieldset className={`${styles.section} ${styles["section-voices"]}`}>
            <legend className={styles["section-title"]}>
              {t.prefVoicesTitle}
            </legend>
            <p className={styles["section-description"]}>
              {t.prefVoicesDescription}
            </p>
            <div className={splitFieldsClassName}>
              <FormRow
                label={t.prefVoiceEn}
                id="voice-en"
                className={styles.field}
              >
                <VoiceSelector lang="en" />
              </FormRow>
              <FormRow
                label={t.prefVoiceZh}
                id="voice-zh"
                className={styles.field}
              >
                <VoiceSelector lang="zh" />
              </FormRow>
            </div>
          </fieldset>
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
