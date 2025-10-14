/**
 * 背景：
 *  - 通用分区需要承载界面主题与系统语言的核心偏好，原占位组件无法满足实时配置需求。
 * 目的：
 *  - 以组合模式编排字段控件，串联主题上下文与设置 Store，确保模态与页面共享一致行为。
 * 关键决策与取舍：
 *  - 选用“组合 + 策略”架构：字段容器负责排版，具体控件通过回调策略写入 Theme/Language/Markdown 行为，上层未来可追加新策略；
 *  - 放弃继续沿用 PlaceholderSection，避免一次性补丁阻塞真实表单的演进。
 * 影响范围：
 *  - Preferences 页面与 SettingsModal 的“通用”分区将即时呈现主题、语言与 Markdown 渲染模式配置。
 * 演进与TODO：
 *  - TODO: 待接入更多通用偏好（如语音预览、字号）时，可在 controls 数组中扩展新的策略项。
 */
import { useCallback, useId, useMemo } from "react";
import PropTypes from "prop-types";
import { useLanguage, useTheme } from "@core/context";
import { SYSTEM_LANGUAGE_AUTO } from "@core/i18n/languages.js";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
  SUPPORTED_SYSTEM_LANGUAGES,
  useSettingsStore,
} from "@core/store/settings";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import SettingsSection from "@shared/components/settings/SettingsSection";
import styles from "../Preferences.module.css";

const THEME_ORDER = Object.freeze(["light", "dark", "system"]);
const MARKDOWN_RENDER_MODE_ORDER = Object.freeze([
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  MARKDOWN_RENDERING_MODE_PLAIN,
]);

const CHAT_COMPLETION_MODE_ORDER = Object.freeze([
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
]);

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const mapLanguageLabel = (translations, code) => {
  const key = `settingsGeneralLanguageOption_${code}`;
  const fallback = code === "zh" ? "Chinese" : code === "en" ? "English" : code;
  return translations[key] ?? fallback;
};

function GeneralSection({ title, headingId }) {
  const { theme, setTheme } = useTheme();
  const { t, systemLanguage, setSystemLanguage } = useLanguage();
  const markdownRenderingMode = useSettingsStore(
    (state) => state.markdownRenderingMode,
  );
  const setMarkdownRenderingMode = useSettingsStore(
    (state) => state.setMarkdownRenderingMode,
  );
  const chatCompletionMode = useSettingsStore(
    (state) => state.chatCompletionMode,
  );
  const setChatCompletionMode = useSettingsStore(
    (state) => state.setChatCompletionMode,
  );

  const themeFieldId = useId();
  const languageSelectId = useId();
  const markdownFieldId = useId();
  const chatCompletionFieldId = useId();

  const themeLabel = t.settingsGeneralThemeLabel ?? t.prefTheme ?? "Theme";
  const themeOptions = useMemo(
    () =>
      THEME_ORDER.map((value) => ({
        value,
        label:
          (value === "light" && (t.settingsGeneralThemeLight ?? "Light")) ||
          (value === "dark" && (t.settingsGeneralThemeDark ?? "Dark")) ||
          (value === "system" && (t.settingsGeneralThemeSystem ?? "System")) ||
          value,
      })),
    [
      t.settingsGeneralThemeDark,
      t.settingsGeneralThemeLight,
      t.settingsGeneralThemeSystem,
    ],
  );

  const languageLabel =
    t.settingsGeneralLanguageLabel ?? t.prefSystemLanguage ?? "System language";
  const languageOptions = useMemo(() => {
    const base = [
      {
        value: SYSTEM_LANGUAGE_AUTO,
        label: t.prefSystemLanguageAuto ?? "Match device language",
      },
    ];
    return base.concat(
      SUPPORTED_SYSTEM_LANGUAGES.map((code) => ({
        value: code,
        label: mapLanguageLabel(t, code),
      })),
    );
  }, [t]);

  const markdownLabel = t.settingsGeneralMarkdownLabel ?? "Markdown rendering";
  const markdownOptions = useMemo(
    () =>
      MARKDOWN_RENDER_MODE_ORDER.map((value) => ({
        value,
        label:
          (value === MARKDOWN_RENDERING_MODE_DYNAMIC &&
            (t.settingsGeneralMarkdownDynamic ?? "Render dynamically")) ||
          (value === MARKDOWN_RENDERING_MODE_PLAIN &&
            (t.settingsGeneralMarkdownPlain ?? "Show raw text")) ||
          value,
      })),
    [t.settingsGeneralMarkdownDynamic, t.settingsGeneralMarkdownPlain],
  );

  const chatCompletionLabel =
    t.settingsGeneralChatOutputLabel ?? "Chat response";
  const chatCompletionOptions = useMemo(
    () =>
      CHAT_COMPLETION_MODE_ORDER.map((value) => ({
        value,
        label:
          (value === CHAT_COMPLETION_MODE_STREAMING &&
            (t.settingsGeneralChatOutputStream ?? "Stream responses")) ||
          (value === CHAT_COMPLETION_MODE_SYNC &&
            (t.settingsGeneralChatOutputSync ?? "Send when ready")) ||
          value,
      })),
    [t.settingsGeneralChatOutputStream, t.settingsGeneralChatOutputSync],
  );

  const handleThemeSelect = useCallback(
    (nextTheme) => {
      if (!nextTheme || nextTheme === theme) {
        return;
      }
      setTheme(nextTheme);
    },
    [setTheme, theme],
  );

  const normalizeSystemLanguage = useCallback((value) => {
    if (value == null) {
      return SYSTEM_LANGUAGE_AUTO.toUpperCase();
    }
    if (value === SYSTEM_LANGUAGE_AUTO) {
      return SYSTEM_LANGUAGE_AUTO.toUpperCase();
    }
    return String(value).toUpperCase();
  }, []);

  const handleLanguageSelect = useCallback(
    (nextValue) => {
      const fallback = SYSTEM_LANGUAGE_AUTO;
      const normalized =
        typeof nextValue === "string"
          ? nextValue.toLowerCase()
          : String(nextValue ?? fallback).toLowerCase();
      const target = normalized || fallback;
      if (target === systemLanguage) {
        return;
      }
      setSystemLanguage(target);
    },
    [setSystemLanguage, systemLanguage],
  );

  const handleMarkdownModeSelect = useCallback(
    (nextMode) => {
      if (!nextMode || nextMode === markdownRenderingMode) {
        return;
      }
      setMarkdownRenderingMode(nextMode);
    },
    [markdownRenderingMode, setMarkdownRenderingMode],
  );

  const handleChatCompletionModeSelect = useCallback(
    (nextMode) => {
      if (!nextMode || nextMode === chatCompletionMode) {
        return;
      }
      setChatCompletionMode(nextMode);
    },
    [chatCompletionMode, setChatCompletionMode],
  );

  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      classes={{
        section: composeClassName(styles.section, styles["section-plain"]),
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <div className={styles.controls}>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={themeFieldId}
        >
          <legend id={themeFieldId} className={styles["control-label"]}>
            {themeLabel}
          </legend>
          <SegmentedControl
            labelledBy={themeFieldId}
            options={themeOptions}
            value={theme}
            onChange={handleThemeSelect}
          />
        </fieldset>
        <div className={styles["control-field"]}>
          <label htmlFor={languageSelectId} className={styles["control-label"]}>
            {languageLabel}
          </label>
          <div className={styles["language-shell"]}>
            <LanguageMenu
              id={languageSelectId}
              options={languageOptions}
              value={systemLanguage ?? SYSTEM_LANGUAGE_AUTO}
              onChange={handleLanguageSelect}
              ariaLabel={languageLabel}
              normalizeValue={normalizeSystemLanguage}
              showLabel
              fullWidth
            />
          </div>
        </div>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={markdownFieldId}
        >
          <legend id={markdownFieldId} className={styles["control-label"]}>
            {markdownLabel}
          </legend>
          <SegmentedControl
            labelledBy={markdownFieldId}
            options={markdownOptions}
            value={markdownRenderingMode}
            onChange={handleMarkdownModeSelect}
          />
        </fieldset>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={chatCompletionFieldId}
        >
          <legend
            id={chatCompletionFieldId}
            className={styles["control-label"]}
          >
            {chatCompletionLabel}
          </legend>
          <SegmentedControl
            labelledBy={chatCompletionFieldId}
            options={chatCompletionOptions}
            value={chatCompletionMode}
            onChange={handleChatCompletionModeSelect}
          />
        </fieldset>
      </div>
    </SettingsSection>
  );
}

GeneralSection.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default GeneralSection;
