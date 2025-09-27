import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import {
  WORD_LANGUAGE_AUTO,
  WORD_DEFAULT_TARGET_LANGUAGE,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
} from "@/utils/language.js";
import ThemeIcon from "@/components/ui/Icon";

const SOURCE_LANG_STORAGE_KEY = "sourceLang";
const TARGET_LANG_STORAGE_KEY = "targetLang";
const DEFAULT_SOURCE_LANG = "auto";
const DEFAULT_TARGET_LANG = WORD_DEFAULT_TARGET_LANGUAGE;
const DEFAULT_THEME = "system";

const VARIANTS = {
  PAGE: "page",
  DIALOG: "dialog",
};

const SECTION_NAV_ICONS = Object.freeze({
  languages: "glancy-web",
  interface: "cog-6-tooth",
  voices: "voice-button",
});

const toStoreSourceLanguage = (value) => {
  if (!value || value === DEFAULT_SOURCE_LANG) {
    return WORD_LANGUAGE_AUTO;
  }
  return normalizeWordSourceLanguage(value);
};

const toUiSourceLanguage = (value) => {
  const normalized = normalizeWordSourceLanguage(value);
  return normalized === WORD_LANGUAGE_AUTO ? DEFAULT_SOURCE_LANG : normalized;
};

const toUiTargetLanguage = (value) =>
  normalizeWordTargetLanguage(value ?? DEFAULT_TARGET_LANG);

const toStoreTargetLanguage = (value) => normalizeWordTargetLanguage(value);

function Preferences({ variant = VARIANTS.PAGE }) {
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
  const legacySourceRef = useRef(localStorage.getItem(SOURCE_LANG_STORAGE_KEY));
  const legacyTargetRef = useRef(localStorage.getItem(TARGET_LANG_STORAGE_KEY));
  const [sourceLang, setSourceLang] = useState(() =>
    toUiSourceLanguage(legacySourceRef.current ?? dictionarySourceLanguage),
  );
  const [targetLang, setTargetLang] = useState(() =>
    toUiTargetLanguage(legacyTargetRef.current ?? dictionaryTargetLanguage),
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const sectionRefs = useRef({});
  const dialogContentRef = useRef(null);
  const [activeDialogSection, setActiveDialogSection] = useState("");

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

  const handleSourceLanguageChange = useCallback(
    (value) => {
      const candidate = value ?? DEFAULT_SOURCE_LANG;
      const uiValue =
        typeof candidate === "string" ? candidate : DEFAULT_SOURCE_LANG;
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
      const nextSource = data.systemLanguage || DEFAULT_SOURCE_LANG;
      const nextTarget = data.searchLanguage || DEFAULT_TARGET_LANG;
      handleSourceLanguageChange(nextSource);
      handleTargetLanguageChange(nextTarget);
      persistLanguages(nextSource, nextTarget);
    },
    [handleSourceLanguageChange, handleTargetLanguageChange, persistLanguages],
  );

  useEffect(() => {
    const legacySource = legacySourceRef.current;
    if (legacySource && dictionarySourceLanguage === WORD_LANGUAGE_AUTO) {
      const normalized = toStoreSourceLanguage(legacySource);
      if (normalized !== dictionarySourceLanguage) {
        setDictionarySourceLanguage(normalized);
      }
      legacySourceRef.current = null;
    }
    const legacyTarget = legacyTargetRef.current;
    if (
      legacyTarget &&
      dictionaryTargetLanguage === WORD_DEFAULT_TARGET_LANGUAGE
    ) {
      const normalized = toStoreTargetLanguage(legacyTarget);
      if (normalized !== dictionaryTargetLanguage) {
        setDictionaryTargetLanguage(normalized);
      }
      legacyTargetRef.current = null;
    }
  }, [
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  ]);

  useEffect(() => {
    const uiValue = toUiSourceLanguage(dictionarySourceLanguage);
    setSourceLang((prev) => (prev === uiValue ? prev : uiValue));
  }, [dictionarySourceLanguage]);

  useEffect(() => {
    const uiValue = toUiTargetLanguage(dictionaryTargetLanguage);
    setTargetLang((prev) => (prev === uiValue ? prev : uiValue));
  }, [dictionaryTargetLanguage]);

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
                onChange={handleSourceLanguageChange}
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
                onChange={handleTargetLanguageChange}
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
      handleSourceLanguageChange,
      handleTargetLanguageChange,
      handleSystemLanguageChange,
      languageOptions,
      searchLanguageOptions,
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

  useEffect(() => {
    if (variant !== VARIANTS.DIALOG) {
      setActiveDialogSection("");
      return;
    }
    const firstSection = preferenceSections[0]?.id ?? "";
    setActiveDialogSection((prev) => prev || firstSection);
  }, [preferenceSections, variant]);

  useEffect(() => {
    if (variant !== VARIANTS.DIALOG) {
      return undefined;
    }
    const container = dialogContentRef.current;
    if (!container) {
      return undefined;
    }

    const handleScroll = () => {
      const threshold = 48;
      const scrollTop = container.scrollTop;
      let current = preferenceSections[0]?.id ?? "";
      preferenceSections.forEach((section) => {
        const node = sectionRefs.current[section.id];
        if (!node) return;
        if (node.offsetTop <= scrollTop + threshold) {
          current = section.id;
        }
      });
      setActiveDialogSection(current);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [preferenceSections, variant]);

  const handleNavClick = useCallback((id) => {
    const container = dialogContentRef.current;
    const target = sectionRefs.current[id];
    if (!container || !target) return;
    const paddingOffset = 12;
    container.scrollTo({
      top: Math.max(target.offsetTop - paddingOffset, 0),
      behavior: "smooth",
    });
    setActiveDialogSection(id);
  }, []);

  const renderSection = useCallback((section) => {
    const sectionClassName = [
      styles.section,
      section.span === "wide" ? styles["section-wide"] : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <section
        key={section.id}
        ref={(node) => {
          if (node) {
            sectionRefs.current[section.id] = node;
          } else {
            delete sectionRefs.current[section.id];
          }
        }}
        className={sectionClassName}
        aria-labelledby={`${section.id}-title`}
      >
        <header className={styles["section-header"]}>
          <h3 id={`${section.id}-title`} className={styles["section-title"]}>
            {section.title}
          </h3>
          <p className={styles["section-description"]}>{section.description}</p>
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
  }, []);

  const sectionsMarkup = useMemo(
    () => preferenceSections.map((section) => renderSection(section)),
    [preferenceSections, renderSection],
  );

  const dialogContent = useMemo(() => {
    if (variant !== VARIANTS.DIALOG) {
      return null;
    }
    return (
      <div className={styles["dialog-layout"]}>
        <nav className={styles["dialog-nav"]} aria-label={t.prefTitle}>
          {preferenceSections.map((section) => {
            const isActive = activeDialogSection === section.id;
            const navClassName = [
              styles["dialog-nav-item"],
              isActive ? styles["dialog-nav-item-active"] : "",
            ]
              .filter(Boolean)
              .join(" ");
            const iconName = SECTION_NAV_ICONS[section.id];
            return (
              <button
                key={section.id}
                type="button"
                className={navClassName}
                onClick={() => handleNavClick(section.id)}
                aria-current={isActive ? "true" : undefined}
              >
                {iconName ? (
                  <ThemeIcon
                    name={iconName}
                    width={18}
                    height={18}
                    tone="dark"
                    className={styles["dialog-nav-icon"]}
                    aria-hidden="true"
                  />
                ) : null}
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>
        <div ref={dialogContentRef} className={styles["dialog-content"]}>
          {sectionsMarkup}
        </div>
      </div>
    );
  }, [
    activeDialogSection,
    handleNavClick,
    preferenceSections,
    sectionsMarkup,
    t.prefTitle,
    variant,
  ]);

  return (
    <>
      <SettingsSurface
        variant={surfaceVariant}
        title={t.prefTitle}
        description={t.prefDescription}
        onSubmit={handleSave}
        className={
          variant === VARIANTS.DIALOG ? styles["dialog-surface"] : undefined
        }
        actions={
          <button type="submit" className={styles["submit-button"]}>
            {t.saveButton}
          </button>
        }
      >
        {variant === VARIANTS.DIALOG ? (
          dialogContent
        ) : (
          <div className={styles.sections}>{sectionsMarkup}</div>
        )}
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
