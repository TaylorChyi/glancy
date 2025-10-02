import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import styles from "./Preferences.module.css";
import { useLanguage, useTheme, useUser } from "@/context";
import { API_PATHS } from "@/config/api.js";
import MessagePopup from "@/components/ui/MessagePopup";
import { useApi } from "@/hooks/useApi.js";
import { VoiceSelector } from "@/components";
import { useSettingsStore, SUPPORTED_SYSTEM_LANGUAGES } from "@/store/settings";
import { useVoiceStore } from "@/store";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@/utils/language.js";
import ThemeIcon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import { useTtsPlayer } from "@/hooks/useTtsPlayer.js";

const SOURCE_LANG_STORAGE_KEY = "sourceLang";
const TARGET_LANG_STORAGE_KEY = "targetLang";
const PERSONALIZATION_ENABLED_STORAGE_KEY = "glancy:personalization-enabled";

const VOICE_PREVIEW_SAMPLES = Object.freeze({
  en: "Hi, I'm Glancy.",
  zh: "你好，我是 Glancy。",
});

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

/**
 * 背景：
 *  - 之前导航标签与内容标题共用同一文案来源，导致无法表达差异化语义。
 * 目的：
 *  - 提供显式的导航标签与内容标题映射，确保信息架构的可扩展性与可维护性。
 * 关键决策与取舍：
 *  - 采用集中 Copy Registry 的方式返回 labels/titles/descriptions，避免到处散落的文案取值逻辑。
 *  - 未引入复杂状态机，原因是当前需求仅涉及静态文案分层，使用简单映射即可满足演进需求。
 */
const buildTabCopyMap = (t) => {
  const tabLabelMap = buildTabLabelMap(t);
  return {
    labels: tabLabelMap,
    titles: {
      [TAB_KEYS.GENERAL]: t.prefInterfaceTitle || tabLabelMap[TAB_KEYS.GENERAL],
      [TAB_KEYS.PERSONALIZATION]:
        t.prefPersonalizationTitle || tabLabelMap[TAB_KEYS.PERSONALIZATION],
      [TAB_KEYS.KEYBOARD]:
        t.prefKeyboardTitle || tabLabelMap[TAB_KEYS.KEYBOARD],
      [TAB_KEYS.DATA]: t.prefDataTitle || tabLabelMap[TAB_KEYS.DATA],
      [TAB_KEYS.ACCOUNT]: t.prefAccountTitle || tabLabelMap[TAB_KEYS.ACCOUNT],
    },
    descriptions: {
      [TAB_KEYS.GENERAL]: t.settingsGeneralDescription || "",
      [TAB_KEYS.PERSONALIZATION]: t.settingsPersonalizationDescription || "",
      [TAB_KEYS.KEYBOARD]: t.settingsKeyboardDescription || "",
      [TAB_KEYS.DATA]: t.settingsDataDescription || "",
      [TAB_KEYS.ACCOUNT]: t.settingsAccountDescription || "",
    },
  };
};

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
  onClose,
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
  const voiceSelections = useVoiceStore((state) => state.voices || {});
  const englishVoiceId = voiceSelections.en || "";
  const chineseVoiceId = voiceSelections.zh || "";
  const {
    play: playVoicePreview,
    stop: stopVoicePreview,
    loading: isVoicePreviewLoading,
    playing: isVoicePreviewPlaying,
  } = useTtsPlayer({ scope: "sentence" });
  const [previewLang, setPreviewLang] = useState(null);

  useEffect(() => {
    setActiveTab(resolveInitialTab(initialTab));
  }, [initialTab]);

  useEffect(
    () => () => {
      stopVoicePreview();
      setPreviewLang(null);
    },
    [stopVoicePreview],
  );

  useEffect(() => {
    if (
      activeTab !== TAB_KEYS.GENERAL &&
      (isVoicePreviewPlaying || isVoicePreviewLoading)
    ) {
      stopVoicePreview();
      setPreviewLang(null);
    }
  }, [
    activeTab,
    isVoicePreviewLoading,
    isVoicePreviewPlaying,
    stopVoicePreview,
  ]);

  const systemLanguageFormatter = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang], { type: "language" });
    } catch (error) {
      console.warn("[preferences] Intl.DisplayNames unsupported", error);
      return null;
    }
  }, [lang]);

  const {
    labels: tabLabelMap,
    titles: tabTitleMap,
    descriptions: tabDescriptionMap,
  } = useMemo(() => buildTabCopyMap(t), [t]);

  const voiceSampleTextMap = useMemo(
    () => ({
      en: t.settingsVoicePreviewTextEn || VOICE_PREVIEW_SAMPLES.en,
      zh: t.settingsVoicePreviewTextZh || VOICE_PREVIEW_SAMPLES.zh,
    }),
    [t.settingsVoicePreviewTextEn, t.settingsVoicePreviewTextZh],
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

  const handleVoicePreview = useCallback(
    async (langCode) => {
      const sample = voiceSampleTextMap[langCode];
      if (!sample) {
        return;
      }
      const selectedVoice =
        langCode === "zh"
          ? chineseVoiceId || undefined
          : englishVoiceId || undefined;
      const isActivePreview =
        previewLang === langCode &&
        (isVoicePreviewPlaying || isVoicePreviewLoading);
      if (isActivePreview) {
        stopVoicePreview();
        setPreviewLang(null);
        return;
      }
      setPreviewLang(langCode);
      try {
        await playVoicePreview({
          text: sample,
          lang: langCode,
          voice: selectedVoice,
        });
      } catch (error) {
        console.error("[preferences] Voice preview failed", error);
        setPreviewLang(null);
      }
    },
    [
      voiceSampleTextMap,
      chineseVoiceId,
      englishVoiceId,
      previewLang,
      isVoicePreviewPlaying,
      isVoicePreviewLoading,
      stopVoicePreview,
      playVoicePreview,
    ],
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
    const defaultsTitle = t.prefDefaultsTitle || tabTitleMap[TAB_KEYS.GENERAL];
    const defaultsDescription =
      t.prefDefaultsDescription || tabDescriptionMap[TAB_KEYS.GENERAL];
    const voicesTitle = t.prefVoicesTitle || t.prefVoiceEn;
    const voicesDescription =
      t.prefVoicesDescription || tabDescriptionMap[TAB_KEYS.GENERAL];
    const englishPreviewActive =
      previewLang === "en" && (isVoicePreviewLoading || isVoicePreviewPlaying);
    const chinesePreviewActive =
      previewLang === "zh" && (isVoicePreviewLoading || isVoicePreviewPlaying);

    return (
      <>
        <SettingsSection
          title={defaultsTitle}
          description={defaultsDescription}
        >
          <SettingsRow label={t.prefTheme} htmlFor="pref-theme">
            <PillSelect
              id="pref-theme"
              value={theme}
              options={themeOptions}
              onChange={(event) => setTheme(event.target.value)}
            />
          </SettingsRow>
          <SettingsRow
            label={t.prefSystemLanguage}
            htmlFor="pref-system-language"
          >
            <PillSelect
              id="pref-system-language"
              value={systemLanguage}
              options={systemLanguageOptions}
              onChange={(event) =>
                handleSystemLanguageChange(event.target.value)
              }
            />
          </SettingsRow>
          <SettingsRow label={t.prefLanguage} htmlFor="pref-source-language">
            <PillSelect
              id="pref-source-language"
              value={sourceLang}
              options={languageOptions}
              onChange={(event) =>
                handleSourceLanguageChange(event.target.value)
              }
            />
          </SettingsRow>
          <SettingsRow
            label={t.prefSearchLanguage}
            htmlFor="pref-target-language"
          >
            <PillSelect
              id="pref-target-language"
              value={targetLang}
              options={searchLanguageOptions}
              onChange={(event) =>
                handleTargetLanguageChange(event.target.value)
              }
            />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title={voicesTitle} description={voicesDescription}>
          <SettingsRow label={t.prefVoiceEn} htmlFor="pref-voice-en">
            <VoicePreviewButton
              onClick={() => handleVoicePreview("en")}
              active={englishPreviewActive}
              loading={isVoicePreviewLoading && previewLang === "en"}
              disabled={
                !user ||
                ((isVoicePreviewLoading || isVoicePreviewPlaying) &&
                  previewLang !== "en")
              }
              playLabel={t.settingsVoicePreviewPlay}
              stopLabel={t.settingsVoicePreviewStop}
            />
            <PillSelectField>
              <VoiceSelector
                lang="en"
                id="pref-voice-en"
                variant="pill"
                className={styles["pill-native"]}
              />
            </PillSelectField>
          </SettingsRow>
          <SettingsRow label={t.prefVoiceZh} htmlFor="pref-voice-zh">
            <VoicePreviewButton
              onClick={() => handleVoicePreview("zh")}
              active={chinesePreviewActive}
              loading={isVoicePreviewLoading && previewLang === "zh"}
              disabled={
                !user ||
                ((isVoicePreviewLoading || isVoicePreviewPlaying) &&
                  previewLang !== "zh")
              }
              playLabel={t.settingsVoicePreviewPlay}
              stopLabel={t.settingsVoicePreviewStop}
            />
            <PillSelectField>
              <VoiceSelector
                lang="zh"
                id="pref-voice-zh"
                variant="pill"
                className={styles["pill-native"]}
              />
            </PillSelectField>
          </SettingsRow>
        </SettingsSection>
      </>
    );
  };

  const renderPersonalizationPanel = () => (
    <>
      <SettingsSection
        title={tabTitleMap[TAB_KEYS.PERSONALIZATION]}
        description={tabDescriptionMap[TAB_KEYS.PERSONALIZATION]}
      >
        <SettingsRow
          label={t.settingsEnableCustomization || "Enable customization"}
          htmlFor="personalization-toggle"
        >
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
        </SettingsRow>
        <SettingsRow
          label={t.settingsOccupation}
          htmlFor="personal-occupation"
          controlFullWidth
        >
          <input
            id="personal-occupation"
            type="text"
            className={styles["input-control"]}
            value={occupation}
            onChange={(event) => setOccupation(event.target.value)}
            placeholder={t.settingsOccupationPlaceholder || "e.g. Student"}
            disabled={!personalizationEnabled}
          />
        </SettingsRow>
        <SettingsRow
          label={t.settingsAboutYou}
          htmlFor="personal-about"
          alignTop
          controlFullWidth
        >
          <textarea
            id="personal-about"
            rows={3}
            className={styles["input-area"]}
            value={persona}
            onChange={(event) => setPersona(event.target.value)}
            placeholder={
              t.settingsAboutYouPlaceholder ||
              "Share your expertise, interests, or context."
            }
            disabled={!personalizationEnabled}
          />
        </SettingsRow>
        <SettingsRow
          label={t.settingsLearningGoal}
          htmlFor="personal-goal"
          alignTop
          controlFullWidth
        >
          <textarea
            id="personal-goal"
            rows={3}
            className={styles["input-area"]}
            value={learningGoal}
            onChange={(event) => setLearningGoal(event.target.value)}
            placeholder={
              t.settingsLearningGoalPlaceholder ||
              "Tell us the outcome you're aiming for."
            }
            disabled={!personalizationEnabled}
          />
        </SettingsRow>
      </SettingsSection>
    </>
  );

  const renderKeyboardPanel = () => (
    <>
      <SettingsSection
        title={tabTitleMap[TAB_KEYS.KEYBOARD]}
        description={tabDescriptionMap[TAB_KEYS.KEYBOARD]}
      >
        <div className={styles["section-columns"]}>
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
        </div>
      </SettingsSection>
    </>
  );

  const renderDataPanel = () => (
    <>
      <SettingsSection
        title={tabTitleMap[TAB_KEYS.DATA]}
        description={tabDescriptionMap[TAB_KEYS.DATA]}
      >
        <div className={styles["data-card"]}>
          <p className={styles["data-description"]}>
            {t.settingsDataNotice || ""}
          </p>
          <div className={styles["data-actions"]}>
            <button
              type="button"
              className={styles["secondary-button"]}
              disabled
            >
              {t.settingsExportData}
            </button>
            <button
              type="button"
              className={styles["secondary-button"]}
              disabled
            >
              {t.settingsEraseHistory}
            </button>
          </div>
        </div>
      </SettingsSection>
    </>
  );

  const renderAccountPanel = () => {
    const planName = user?.plan || (user?.isPro ? "plus" : "free");
    const planLabel = planName
      ? planName.charAt(0).toUpperCase() + planName.slice(1)
      : "";
    return (
      <>
        <SettingsSection
          title={tabTitleMap[TAB_KEYS.ACCOUNT]}
          description={tabDescriptionMap[TAB_KEYS.ACCOUNT]}
        >
          <div className={styles["account-card"]}>
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
            <dl className={styles["account-rows"]}>
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
        </SettingsSection>
      </>
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

  const closeLabel = t.close ?? "Close";
  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  return (
    <>
      <form
        className={containerClassName}
        onSubmit={handleSave}
        aria-labelledby="settings-heading"
        aria-describedby="settings-description"
      >
        <aside className={styles.sidebar} aria-label={t.prefTitle}>
          {typeof onClose === "function" ? (
            <button
              type="button"
              className={styles["sidebar-close"]}
              aria-label={closeLabel}
              onClick={handleClose}
            >
              {/*
               * 背景：
               *  - Dialog 变体需要就地关闭入口，避免用户依赖外层组件寻找关闭控件。
               * 关键取舍：
               *  - 通过局部 SVG 图标避免新增全局资产，同时沿用侧边栏的交互令牌，保持节奏一致。
               */}
              <CloseGlyph
                className={styles["sidebar-close-icon"]}
                aria-hidden="true"
              />
            </button>
          ) : null}
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
                const buttonClassName = isActive
                  ? `${styles["nav-button"]} ${styles["nav-button-active"]}`
                  : styles["nav-button"];
                return (
                  <li key={tab} className={styles["nav-item"]}>
                    <button
                      type="button"
                      role="tab"
                      id={tabId}
                      className={buttonClassName}
                      aria-selected={isActive}
                      aria-controls={tabPanelId}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => handleTabClick(tab)}
                      onKeyDown={handleNavKeyDown(index)}
                      ref={registerNavRef(index)}
                    >
                      <span className={styles["nav-dot"]} aria-hidden="true" />
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
          <header className={styles["content-header"]}>
            <h2 id="settings-heading" className={styles["content-title"]}>
              {tabTitleMap[activeTab]}
            </h2>
            {tabDescriptionMap[activeTab] ? (
              <p className={styles["content-description"]}>
                {tabDescriptionMap[activeTab]}
              </p>
            ) : null}
          </header>
          <div className={styles["section-stack"]} id="settings-description">
            {renderActivePanel()}
          </div>
          <footer className={styles["content-footer"]}>
            <button
              type="submit"
              className={styles["primary-button"]}
              disabled={isSaving}
            >
              {isSaving ? (t.saving ?? t.saveButton) : t.saveButton}
            </button>
          </footer>
        </section>
      </form>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <section className={styles.section} aria-label={title}>
      <header className={styles["section-header"]}>
        <h3 className={styles["section-title"]}>{title}</h3>
        {description ? (
          <p className={styles["section-description"]}>{description}</p>
        ) : null}
      </header>
      <div className={styles["section-body"]}>{children}</div>
    </section>
  );
}

SettingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
};

SettingsSection.defaultProps = {
  description: undefined,
};

function SettingsRow({
  label,
  description,
  htmlFor,
  children,
  alignTop = false,
  controlFullWidth = false,
  className = "",
}) {
  const rowClassName = [
    styles.row,
    alignTop ? styles["row-top"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const controlClassName = [
    styles["row-control"],
    controlFullWidth ? styles["row-control-full"] : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClassName}>
      <div className={styles["row-label"]}>
        {htmlFor ? (
          <label htmlFor={htmlFor} className={styles["row-label-text"]}>
            {label}
          </label>
        ) : (
          <span className={styles["row-label-text"]}>{label}</span>
        )}
        {description ? (
          <p className={styles["row-label-description"]}>{description}</p>
        ) : null}
      </div>
      <div className={controlClassName}>{children}</div>
    </div>
  );
}

SettingsRow.propTypes = {
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  htmlFor: PropTypes.string,
  children: PropTypes.node.isRequired,
  alignTop: PropTypes.bool,
  controlFullWidth: PropTypes.bool,
  className: PropTypes.string,
};

SettingsRow.defaultProps = {
  description: undefined,
  htmlFor: undefined,
  alignTop: false,
  controlFullWidth: false,
  className: "",
};

function PillSelectField({ children }) {
  return (
    <div className={styles["pill-select"]}>
      {children}
      <ChevronDownGlyph className={styles["pill-select-icon"]} />
    </div>
  );
}

PillSelectField.propTypes = {
  children: PropTypes.node.isRequired,
};

function PillSelect({ id, value, options, onChange, disabled = false }) {
  return (
    <PillSelectField>
      <select
        id={id}
        className={styles["pill-native"]}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </PillSelectField>
  );
}

PillSelect.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

PillSelect.defaultProps = {
  disabled: false,
};

function VoicePreviewButton({
  onClick,
  active,
  loading,
  disabled,
  playLabel,
  stopLabel,
}) {
  const label = active ? stopLabel || "Stop" : playLabel || "Play";
  const isDisabled = disabled && !active;

  return (
    <button
      type="button"
      className={styles["play-button"]}
      onClick={onClick}
      data-active={active}
      aria-pressed={active}
      aria-busy={loading}
      disabled={isDisabled}
    >
      <PlayGlyph active={active} />
      <span>{loading && !active ? `${label}…` : label}</span>
    </button>
  );
}

VoicePreviewButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  active: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  playLabel: PropTypes.string,
  stopLabel: PropTypes.string,
};

VoicePreviewButton.defaultProps = {
  active: false,
  loading: false,
  disabled: false,
  playLabel: undefined,
  stopLabel: undefined,
};

function ChevronDownGlyph({ className }) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

ChevronDownGlyph.propTypes = {
  className: PropTypes.string,
};

ChevronDownGlyph.defaultProps = {
  className: "",
};

function PlayGlyph({ active }) {
  if (active) {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3.25 2.5h1.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-5.5a.75.75 0 0 1 .75-.75Zm4 0h1.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-5.5a.75.75 0 0 1 .75-.75Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.25 2.15 9.2 5.63a.4.4 0 0 1 0 .7L3.25 9.11a.4.4 0 0 1-.6-.35v-6a.4.4 0 0 1 .6-.35Z"
        fill="currentColor"
      />
    </svg>
  );
}

PlayGlyph.propTypes = {
  active: PropTypes.bool,
};

PlayGlyph.defaultProps = {
  active: false,
};

/**
 * 背景：
 *  - 设置侧边栏需提供统一的关闭图标，同时不依赖额外的资产构建。
 * 目的：
 *  - 提供语义化的乘号图标用于对话框关闭按钮，保持与导航控件一致的视觉密度。
 * 关键决策与取舍：
 *  - 采用内联 SVG 以规避新增静态资源与构建步骤；路径参数参考 16px 基线，便于未来主题复用。
 */
function CloseGlyph({ className, ...props }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      {...props}
    >
      <path
        d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 0 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 1 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

CloseGlyph.propTypes = {
  className: PropTypes.string,
};

CloseGlyph.defaultProps = {
  className: undefined,
};

Preferences.propTypes = {
  variant: PropTypes.oneOf(Object.values(VARIANTS)),
  initialTab: PropTypes.oneOf(TAB_ORDER),
  onOpenAccountManager: PropTypes.func,
  onClose: PropTypes.func,
};

Preferences.defaultProps = {
  variant: VARIANTS.PAGE,
  initialTab: TAB_KEYS.GENERAL,
  onOpenAccountManager: undefined,
  onClose: undefined,
};

export default Preferences;
