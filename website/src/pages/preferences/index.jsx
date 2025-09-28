import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./Preferences.module.css";
import { useLanguage, useTheme, useUser } from "@/context";
import { API_PATHS } from "@/config/api.js";
import MessagePopup from "@/components/ui/MessagePopup";
import { useApi } from "@/hooks/useApi.js";
import { VoiceSelector } from "@/components";
import { useSettingsStore, SUPPORTED_SYSTEM_LANGUAGES } from "@/store/settings";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@/utils/language.js";
import ThemeIcon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";

const SOURCE_LANG_STORAGE_KEY = "sourceLang";
const TARGET_LANG_STORAGE_KEY = "targetLang";
const PERSONALIZATION_ENABLED_STORAGE_KEY = "glancy:personalization-enabled";

const readLocalPreference = (key) => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.warn(
      `[preferences] Unable to read ${key} from localStorage`,
      error,
    );
    return null;
  }
};

const writeLocalPreference = (key, value) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[preferences] Unable to write ${key} to localStorage`, error);
  }
};

const VARIANTS = {
  PAGE: "page",
  DIALOG: "dialog",
};

const TAB_KEYS = Object.freeze({
  GENERAL: "general",
  PERSONALIZATION: "personalization",
  KEYBOARD: "keyboard",
  DATA: "data",
  ACCOUNT: "account",
});

const TAB_ORDER = [
  TAB_KEYS.GENERAL,
  TAB_KEYS.PERSONALIZATION,
  TAB_KEYS.KEYBOARD,
  TAB_KEYS.DATA,
  TAB_KEYS.ACCOUNT,
];

const TAB_ICONS = Object.freeze({
  [TAB_KEYS.GENERAL]: "cog-6-tooth",
  [TAB_KEYS.PERSONALIZATION]: "adjustments-horizontal",
  [TAB_KEYS.KEYBOARD]: "command-line",
  [TAB_KEYS.DATA]: "shield-check",
  [TAB_KEYS.ACCOUNT]: "user",
});

const KEYBOARD_SHORTCUTS = [
  { combo: "⌘ / Ctrl + K", labelKey: "shortcutSearch" },
  { combo: "⌘ / Ctrl + Enter", labelKey: "shortcutSend" },
  { combo: "↑", labelKey: "shortcutEdit" },
  { combo: "Esc", labelKey: "shortcutDismiss" },
];

const buildTabLabelMap = (t) => ({
  [TAB_KEYS.GENERAL]: t.settingsTabGeneral || "General",
  [TAB_KEYS.PERSONALIZATION]: t.settingsTabPersonalization || "Personalization",
  [TAB_KEYS.KEYBOARD]: t.settingsTabKeyboard || "Keyboard",
  [TAB_KEYS.DATA]: t.settingsTabData || "Data controls",
  [TAB_KEYS.ACCOUNT]: t.settingsTabAccount || "Account",
});

const toStoreSourceLanguage = (value) => {
  if (!value || value === WORD_LANGUAGE_AUTO) {
    return WORD_LANGUAGE_AUTO;
  }
  return normalizeWordSourceLanguage(value);
};

const toUiSourceLanguage = (value) => {
  const normalized = normalizeWordSourceLanguage(value);
  return normalized === WORD_LANGUAGE_AUTO ? WORD_LANGUAGE_AUTO : normalized;
};

const toUiTargetLanguage = (value) =>
  normalizeWordTargetLanguage(value ?? WORD_DEFAULT_TARGET_LANGUAGE);

const toStoreTargetLanguage = (value) => normalizeWordTargetLanguage(value);

const resolveInitialTab = (candidate) =>
  TAB_ORDER.includes(candidate) ? candidate : TAB_KEYS.GENERAL;

function Preferences({
  variant = VARIANTS.PAGE,
  initialTab = TAB_KEYS.GENERAL,
  onOpenAccountManager,
}) {
  const { t, lang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const api = useApi();
  const {
    systemLanguage,
    setSystemLanguage,
    dictionarySourceLanguage,
    setDictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionaryTargetLanguage,
  } = useSettingsStore((state) => ({
    systemLanguage: state.systemLanguage,
    setSystemLanguage: state.setSystemLanguage,
    dictionarySourceLanguage: state.dictionarySourceLanguage,
    setDictionarySourceLanguage: state.setDictionarySourceLanguage,
    dictionaryTargetLanguage: state.dictionaryTargetLanguage,
    setDictionaryTargetLanguage: state.setDictionaryTargetLanguage,
  }));

  const [activeTab, setActiveTab] = useState(resolveInitialTab(initialTab));
  const [sourceLang, setSourceLang] = useState(() =>
    toUiSourceLanguage(
      readLocalPreference(SOURCE_LANG_STORAGE_KEY) ?? dictionarySourceLanguage,
    ),
  );
  const [targetLang, setTargetLang] = useState(() =>
    toUiTargetLanguage(
      readLocalPreference(TARGET_LANG_STORAGE_KEY) ?? dictionaryTargetLanguage,
    ),
  );
  const [personalizationEnabled, setPersonalizationEnabled] = useState(() => {
    const persisted = readLocalPreference(PERSONALIZATION_ENABLED_STORAGE_KEY);
    if (persisted === "true" || persisted === "false") {
      return persisted === "true";
    }
    return true;
  });
  const [occupation, setOccupation] = useState("");
  const [persona, setPersona] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [profileMeta, setProfileMeta] = useState({ age: "", gender: "" });
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setActiveTab(resolveInitialTab(initialTab));
  }, [initialTab]);

  const systemLanguageFormatter = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: "language" });
    } catch (error) {
      console.warn("[preferences] Intl.DisplayNames unsupported", error);
      return null;
    }
  }, [lang]);

  const tabLabelMap = useMemo(() => buildTabLabelMap(t), [t]);
  const tabDescriptionMap = useMemo(
    () => ({
      [TAB_KEYS.GENERAL]: t.settingsGeneralDescription || "",
      [TAB_KEYS.PERSONALIZATION]: t.settingsPersonalizationDescription || "",
      [TAB_KEYS.KEYBOARD]: t.settingsKeyboardDescription || "",
      [TAB_KEYS.DATA]: t.settingsDataDescription || "",
      [TAB_KEYS.ACCOUNT]: t.settingsAccountDescription || "",
    }),
    [t],
  );

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
      { value: WORD_LANGUAGE_AUTO, label: t.autoDetect },
      { value: "CHINESE", label: "CHINESE" },
      { value: "ENGLISH", label: "ENGLISH" },
    ],
    [t.autoDetect],
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
      { value: "system", label: "system" },
    ],
    [],
  );

  const persistLanguages = useCallback((source, target) => {
    writeLocalPreference(SOURCE_LANG_STORAGE_KEY, source);
    writeLocalPreference(TARGET_LANG_STORAGE_KEY, target);
  }, []);

  const persistPersonalization = useCallback((enabled) => {
    writeLocalPreference(
      PERSONALIZATION_ENABLED_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  }, []);

  const openPopup = useCallback((message) => {
    setPopupMsg(message);
    setPopupOpen(true);
  }, []);

  const handleSourceLanguageChange = useCallback(
    (value) => {
      const candidate = value ?? WORD_LANGUAGE_AUTO;
      const uiValue =
        typeof candidate === "string" ? candidate : WORD_LANGUAGE_AUTO;
      setSourceLang(uiValue);
      setDictionarySourceLanguage(toStoreSourceLanguage(uiValue));
    },
    [setDictionarySourceLanguage],
  );

  const handleTargetLanguageChange = useCallback(
    (value) => {
      const uiValue = toUiTargetLanguage(value);
      setTargetLang(uiValue);
      setDictionaryTargetLanguage(toStoreTargetLanguage(uiValue));
    },
    [setDictionaryTargetLanguage],
  );

  const applyPreferences = useCallback(
    (data) => {
      const nextSource = data.systemLanguage || WORD_LANGUAGE_AUTO;
      const nextTarget = data.searchLanguage || WORD_DEFAULT_TARGET_LANGUAGE;
      handleSourceLanguageChange(nextSource);
      handleTargetLanguageChange(nextTarget);
      persistLanguages(nextSource, nextTarget);
    },
    [handleSourceLanguageChange, handleTargetLanguageChange, persistLanguages],
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

  useEffect(() => {
    if (!user || !api?.profiles?.fetchProfile) {
      return;
    }
    api.profiles
      .fetchProfile({ token: user.token })
      .then((profile) => {
        setOccupation(profile.job || "");
        setPersona(profile.interest || "");
        setLearningGoal(profile.goal || "");
        setProfileMeta({
          age: profile.age ?? "",
          gender: profile.gender ?? "",
        });
        if (!readLocalPreference(PERSONALIZATION_ENABLED_STORAGE_KEY)) {
          const hasData = Boolean(
            profile.job || profile.interest || profile.goal,
          );
          setPersonalizationEnabled(hasData);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [api, user]);

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
      setIsSaving(true);
      try {
        const requests = [
          api.jsonRequest(`${API_PATHS.preferences}/user`, {
            method: "POST",
            body: {
              systemLanguage: sourceLang,
              searchLanguage: targetLang,
              theme,
            },
          }),
        ];

        if (api?.profiles?.saveProfile) {
          requests.push(
            api.profiles.saveProfile({
              token: user.token,
              profile: {
                age: profileMeta.age,
                gender: profileMeta.gender,
                job: personalizationEnabled ? occupation : "",
                interest: personalizationEnabled ? persona : "",
                goal: personalizationEnabled ? learningGoal : "",
              },
            }),
          );
        }

        await Promise.all(requests);
        persistLanguages(sourceLang, targetLang);
        persistPersonalization(personalizationEnabled);
        openPopup(t.saveSuccess);
      } catch (error) {
        console.error(error);
        openPopup(t.fail);
      } finally {
        setIsSaving(false);
      }
    },
    [
      api,
      sourceLang,
      targetLang,
      theme,
      user,
      profileMeta.age,
      profileMeta.gender,
      occupation,
      persona,
      learningGoal,
      personalizationEnabled,
      persistLanguages,
      persistPersonalization,
      openPopup,
      t.saveSuccess,
      t.fail,
    ],
  );

  useEffect(() => {
    setSourceLang((prev) =>
      prev === dictionarySourceLanguage
        ? prev
        : toUiSourceLanguage(dictionarySourceLanguage),
    );
  }, [dictionarySourceLanguage]);

  useEffect(() => {
    setTargetLang((prev) =>
      prev === dictionaryTargetLanguage
        ? prev
        : toUiTargetLanguage(dictionaryTargetLanguage),
    );
  }, [dictionaryTargetLanguage]);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(resolveInitialTab(tab));
  }, []);

  const navRefs = useRef([]);

  const registerNavRef = useCallback(
    (index) => (node) => {
      navRefs.current[index] = node ?? null;
    },
    [],
  );

  const focusTabByIndex = useCallback((index) => {
    const target = navRefs.current[index];
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }, []);

  const handleNavKeyDown = useCallback(
    (index) => (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = (index + 1) % TAB_ORDER.length;
        handleTabClick(TAB_ORDER[nextIndex]);
        focusTabByIndex(nextIndex);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = index === 0 ? TAB_ORDER.length - 1 : index - 1;
        handleTabClick(TAB_ORDER[nextIndex]);
        focusTabByIndex(nextIndex);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        handleTabClick(TAB_ORDER[0]);
        focusTabByIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        const lastIndex = TAB_ORDER.length - 1;
        handleTabClick(TAB_ORDER[lastIndex]);
        focusTabByIndex(lastIndex);
      }
    },
    [focusTabByIndex, handleTabClick],
  );

  const renderGeneralPanel = () => {
    const defaultsTitle = t.prefDefaultsTitle || tabLabelMap[TAB_KEYS.GENERAL];
    const defaultsDescription =
      t.prefDefaultsDescription || tabDescriptionMap[TAB_KEYS.GENERAL];
    const voicesTitle = t.prefVoicesTitle || t.prefVoiceEn;
    const voicesDescription =
      t.prefVoicesDescription || tabDescriptionMap[TAB_KEYS.GENERAL];

    return (
      <>
        <section className={styles.section} aria-label={defaultsTitle}>
          <div className={styles["section-header"]}>
            <h3 className={styles["section-title"]}>{defaultsTitle}</h3>
            {defaultsDescription ? (
              <p className={styles["section-description"]}>
                {defaultsDescription}
              </p>
            ) : null}
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <div>
                <label htmlFor="pref-theme" className={styles["field-label"]}>
                  {t.prefTheme}
                </label>
              </div>
              <select
                id="pref-theme"
                className={styles.select}
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <div>
                <label
                  htmlFor="pref-system-language"
                  className={styles["field-label"]}
                >
                  {t.prefSystemLanguage}
                </label>
              </div>
              <select
                id="pref-system-language"
                className={styles.select}
                value={systemLanguage}
                onChange={(event) =>
                  handleSystemLanguageChange(event.target.value)
                }
              >
                {systemLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <div>
                <label
                  htmlFor="pref-source-language"
                  className={styles["field-label"]}
                >
                  {t.prefLanguage}
                </label>
              </div>
              <select
                id="pref-source-language"
                className={styles.select}
                value={sourceLang}
                onChange={(event) =>
                  handleSourceLanguageChange(event.target.value)
                }
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <div>
                <label
                  htmlFor="pref-target-language"
                  className={styles["field-label"]}
                >
                  {t.prefSearchLanguage}
                </label>
              </div>
              <select
                id="pref-target-language"
                className={styles.select}
                value={targetLang}
                onChange={(event) =>
                  handleTargetLanguageChange(event.target.value)
                }
              >
                {searchLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
        <section className={styles.section} aria-label={voicesTitle}>
          <div className={styles["section-header"]}>
            <h3 className={styles["section-title"]}>{voicesTitle}</h3>
            {voicesDescription ? (
              <p className={styles["section-description"]}>
                {voicesDescription}
              </p>
            ) : null}
          </div>
          <div className={styles.fields}>
            <div className={styles.field}>
              <div>
                <label
                  htmlFor="pref-voice-en"
                  className={styles["field-label"]}
                >
                  {t.prefVoiceEn}
                </label>
              </div>
              <VoiceSelector lang="en" id="pref-voice-en" />
            </div>
            <div className={styles.field}>
              <div>
                <label
                  htmlFor="pref-voice-zh"
                  className={styles["field-label"]}
                >
                  {t.prefVoiceZh}
                </label>
              </div>
              <VoiceSelector lang="zh" id="pref-voice-zh" />
            </div>
          </div>
        </section>
      </>
    );
  };

  const renderPersonalizationPanel = () => (
    <section
      className={styles.section}
      aria-label={tabLabelMap[TAB_KEYS.PERSONALIZATION]}
    >
      <div className={styles["section-header"]}>
        <h3 className={styles["section-title"]}>
          {tabLabelMap[TAB_KEYS.PERSONALIZATION]}
        </h3>
        {tabDescriptionMap[TAB_KEYS.PERSONALIZATION] ? (
          <p className={styles["section-description"]}>
            {tabDescriptionMap[TAB_KEYS.PERSONALIZATION]}
          </p>
        ) : null}
      </div>
      <div className={styles.fields}>
        <div className={`${styles.field} ${styles["field-inline"]}`}>
          <div>
            <span className={styles["field-label"]}>
              {t.settingsEnableCustomization || "Enable customization"}
            </span>
          </div>
          <label className={styles.switch} htmlFor="personalization-toggle">
            <input
              id="personalization-toggle"
              type="checkbox"
              role="switch"
              aria-checked={personalizationEnabled}
              checked={personalizationEnabled}
              onChange={(event) =>
                setPersonalizationEnabled(event.target.checked)
              }
            />
            <span aria-hidden="true" />
          </label>
        </div>
        <div className={styles.field}>
          <div>
            <label
              htmlFor="personal-occupation"
              className={styles["field-label"]}
            >
              {t.settingsOccupation}
            </label>
          </div>
          <input
            id="personal-occupation"
            type="text"
            className={styles.input}
            value={occupation}
            onChange={(event) => setOccupation(event.target.value)}
            placeholder={t.settingsOccupationPlaceholder || "e.g. Student"}
            disabled={!personalizationEnabled}
          />
        </div>
        <div className={styles.field}>
          <div>
            <label htmlFor="personal-about" className={styles["field-label"]}>
              {t.settingsAboutYou}
            </label>
          </div>
          <textarea
            id="personal-about"
            rows={3}
            className={styles.textarea}
            value={persona}
            onChange={(event) => setPersona(event.target.value)}
            placeholder={
              t.settingsAboutYouPlaceholder ||
              "Share your expertise, interests, or context."
            }
            disabled={!personalizationEnabled}
          />
        </div>
        <div className={styles.field}>
          <div>
            <label htmlFor="personal-goal" className={styles["field-label"]}>
              {t.settingsLearningGoal}
            </label>
          </div>
          <textarea
            id="personal-goal"
            rows={3}
            className={styles.textarea}
            value={learningGoal}
            onChange={(event) => setLearningGoal(event.target.value)}
            placeholder={
              t.settingsLearningGoalPlaceholder ||
              "Tell us the outcome you're aiming for."
            }
            disabled={!personalizationEnabled}
          />
        </div>
      </div>
    </section>
  );

  const renderKeyboardPanel = () => (
    <section
      className={styles.section}
      aria-label={tabLabelMap[TAB_KEYS.KEYBOARD]}
    >
      <div className={styles["section-header"]}>
        <h3 className={styles["section-title"]}>
          {tabLabelMap[TAB_KEYS.KEYBOARD]}
        </h3>
        {tabDescriptionMap[TAB_KEYS.KEYBOARD] ? (
          <p className={styles["section-description"]}>
            {tabDescriptionMap[TAB_KEYS.KEYBOARD]}
          </p>
        ) : null}
      </div>
      <ul className={styles["shortcut-list"]}>
        {KEYBOARD_SHORTCUTS.map((shortcut) => (
          <li key={shortcut.labelKey} className={styles["shortcut-item"]}>
            <span className={styles["shortcut-key"]}>{shortcut.combo}</span>
            <span className={styles["shortcut-label"]}>
              {t[shortcut.labelKey] || shortcut.labelKey}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  const renderDataPanel = () => (
    <section className={styles.section} aria-label={tabLabelMap[TAB_KEYS.DATA]}>
      <div className={styles["section-header"]}>
        <h3 className={styles["section-title"]}>
          {tabLabelMap[TAB_KEYS.DATA]}
        </h3>
        {tabDescriptionMap[TAB_KEYS.DATA] ? (
          <p className={styles["section-description"]}>
            {tabDescriptionMap[TAB_KEYS.DATA]}
          </p>
        ) : null}
      </div>
      <div className={styles["data-card"]}>
        <p className={styles["field-description"]}>
          {t.settingsDataNotice || ""}
        </p>
        <div className={styles["data-actions"]}>
          <button type="button" className={styles["secondary-button"]} disabled>
            {t.settingsExportData}
          </button>
          <button type="button" className={styles["secondary-button"]} disabled>
            {t.settingsEraseHistory}
          </button>
        </div>
      </div>
    </section>
  );

  const renderAccountPanel = () => {
    const planName = user?.plan || (user?.isPro ? "plus" : "free");
    const planLabel = planName
      ? planName.charAt(0).toUpperCase() + planName.slice(1)
      : "";
    return (
      <section
        className={styles.section}
        aria-label={tabLabelMap[TAB_KEYS.ACCOUNT]}
      >
        <div className={styles["section-header"]}>
          <h3 className={styles["section-title"]}>
            {tabLabelMap[TAB_KEYS.ACCOUNT]}
          </h3>
          {tabDescriptionMap[TAB_KEYS.ACCOUNT] ? (
            <p className={styles["section-description"]}>
              {tabDescriptionMap[TAB_KEYS.ACCOUNT]}
            </p>
          ) : null}
        </div>
        <div className={styles.fields}>
          <div className={styles["account-header"]}>
            <Avatar width={56} height={56} />
            <div className={styles["account-meta"]}>
              <span className={styles["account-name"]}>
                {user?.username || ""}
              </span>
              <span className={styles["account-plan"]}>{planLabel}</span>
            </div>
            {typeof onOpenAccountManager === "function" ? (
              <button
                type="button"
                className={styles["secondary-button"]}
                onClick={onOpenAccountManager}
              >
                {t.settingsManageProfile || "Manage profile"}
              </button>
            ) : null}
          </div>
          <dl className={styles["account-list"]}>
            <div className={styles["account-row"]}>
              <dt>{t.settingsAccountUsername}</dt>
              <dd>{user?.username || t.settingsEmptyValue || ""}</dd>
            </div>
            <div className={styles["account-row"]}>
              <dt>{t.settingsAccountEmail}</dt>
              <dd>{user?.email || t.settingsEmptyValue || ""}</dd>
            </div>
            <div className={styles["account-row"]}>
              <dt>{t.settingsAccountPhone}</dt>
              <dd>{user?.phone || t.settingsEmptyValue || ""}</dd>
            </div>
            <div className={styles["account-row"]}>
              <dt>{t.settingsAccountAge}</dt>
              <dd>{profileMeta.age || t.settingsEmptyValue || ""}</dd>
            </div>
            <div className={styles["account-row"]}>
              <dt>{t.settingsAccountGender}</dt>
              <dd>{profileMeta.gender || t.settingsEmptyValue || ""}</dd>
            </div>
          </dl>
        </div>
      </section>
    );
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case TAB_KEYS.PERSONALIZATION:
        return renderPersonalizationPanel();
      case TAB_KEYS.KEYBOARD:
        return renderKeyboardPanel();
      case TAB_KEYS.DATA:
        return renderDataPanel();
      case TAB_KEYS.ACCOUNT:
        return renderAccountPanel();
      case TAB_KEYS.GENERAL:
      default:
        return renderGeneralPanel();
    }
  };

  const panelId = `settings-panel-${activeTab}`;
  const containerClassName =
    variant === VARIANTS.PAGE
      ? `${styles.container} ${styles.page}`
      : styles.container;

  return (
    <>
      <form
        className={containerClassName}
        onSubmit={handleSave}
        aria-labelledby="settings-heading"
        aria-describedby="settings-description"
      >
        <header className={styles.header}>
          <h2 id="settings-heading" className={styles.title}>
            {t.prefTitle}
          </h2>
          <p id="settings-description" className={styles.description}>
            {t.prefDescription}
          </p>
        </header>
        <div className={styles.body}>
          <aside className={styles.sidebar} aria-label={t.prefTitle}>
            <nav aria-label={t.prefTitle}>
              <ul
                className={styles["nav-list"]}
                role="tablist"
                aria-orientation="vertical"
              >
                {TAB_ORDER.map((tab, index) => {
                  const isActive = activeTab === tab;
                  const icon = TAB_ICONS[tab];
                  const tabId = `settings-tab-${tab}`;
                  const tabPanelId = `settings-panel-${tab}`;
                  return (
                    <li key={tab}>
                      <button
                        type="button"
                        role="tab"
                        id={tabId}
                        className={
                          isActive
                            ? `${styles["nav-button"]} ${styles["nav-button-active"]}`
                            : styles["nav-button"]
                        }
                        aria-selected={isActive}
                        aria-controls={tabPanelId}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => handleTabClick(tab)}
                        onKeyDown={handleNavKeyDown(index)}
                        ref={registerNavRef(index)}
                      >
                        {icon ? (
                          <ThemeIcon
                            name={icon}
                            width={18}
                            height={18}
                            className={styles["nav-icon"]}
                          />
                        ) : null}
                        <span className={styles["nav-label"]}>
                          {tabLabelMap[tab]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
          <section
            className={styles.content}
            role="tabpanel"
            id={panelId}
            aria-labelledby={`settings-tab-${activeTab}`}
          >
            {renderActivePanel()}
          </section>
        </div>
        <footer className={styles.actions}>
          <button
            type="submit"
            className={styles["primary-button"]}
            disabled={isSaving}
          >
            {isSaving ? (t.saving ?? t.saveButton) : t.saveButton}
          </button>
        </footer>
      </form>
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
  initialTab: PropTypes.oneOf(TAB_ORDER),
  onOpenAccountManager: PropTypes.func,
};

Preferences.defaultProps = {
  variant: VARIANTS.PAGE,
  initialTab: TAB_KEYS.GENERAL,
  onOpenAccountManager: undefined,
};

export default Preferences;
