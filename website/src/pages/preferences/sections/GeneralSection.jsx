/**
 * 背景：
 *  - 通用分区需要承载界面主题与系统语言的核心偏好，原占位组件无法满足实时配置需求。
 * 目的：
 *  - 以组合模式编排字段控件，串联主题上下文与设置 Store，确保模态与页面共享一致行为。
 * 关键决策与取舍：
 *  - 选用“组合 + 策略”架构：字段容器负责排版，具体控件通过回调策略写入 Theme/Language，上层未来可追加新策略；
 *  - 放弃继续沿用 PlaceholderSection，避免一次性补丁阻塞真实表单的演进。
 * 影响范围：
 *  - Preferences 页面与 SettingsModal 的“通用”分区将即时呈现主题与语言配置。
 * 演进与TODO：
 *  - TODO: 待接入更多通用偏好（如语音预览、字号）时，可在 controls 数组中扩展新的策略项。
 */
import { useCallback, useId, useMemo } from "react";
import PropTypes from "prop-types";
import { useLanguage, useTheme } from "@/context";
import { SYSTEM_LANGUAGE_AUTO } from "@/i18n/languages.js";
import { SUPPORTED_SYSTEM_LANGUAGES } from "@/store/settings";
import styles from "../Preferences.module.css";

const THEME_ORDER = Object.freeze(["light", "dark", "system"]);

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const mapLanguageLabel = (translations, code) => {
  const key = `settingsGeneralLanguageOption_${code}`;
  const fallback = code === "zh" ? "Chinese" : code === "en" ? "English" : code;
  return translations[key] ?? fallback;
};

function GeneralSection({ title, headingId }) {
  const { theme, setTheme } = useTheme();
  const { t, systemLanguage, setSystemLanguage } = useLanguage();

  const themeFieldId = useId();
  const languageSelectId = useId();

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

  const handleThemeSelect = useCallback(
    (nextTheme) => {
      if (!nextTheme || nextTheme === theme) {
        return;
      }
      setTheme(nextTheme);
    },
    [setTheme, theme],
  );

  const handleLanguageChange = useCallback(
    (event) => {
      const value = event?.target?.value ?? SYSTEM_LANGUAGE_AUTO;
      if (value === systemLanguage) {
        return;
      }
      setSystemLanguage(value);
    },
    [setSystemLanguage, systemLanguage],
  );

  return (
    <section aria-labelledby={headingId} className={styles.section}>
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
      </div>
      <div className={styles.controls}>
        <fieldset
          className={styles["control-field"]}
          aria-labelledby={themeFieldId}
        >
          <legend id={themeFieldId} className={styles["control-label"]}>
            {themeLabel}
          </legend>
          <div
            role="radiogroup"
            aria-labelledby={themeFieldId}
            className={styles.segments}
          >
            {themeOptions.map((option) => {
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={composeClassName(
                    styles.segment,
                    active ? styles["segment-active"] : "",
                  )}
                  onClick={() => handleThemeSelect(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className={styles["control-field"]}>
          <label htmlFor={languageSelectId} className={styles["control-label"]}>
            {languageLabel}
          </label>
          <div className={styles["select-wrapper"]}>
            <select
              id={languageSelectId}
              className={styles.select}
              value={systemLanguage ?? SYSTEM_LANGUAGE_AUTO}
              onChange={handleLanguageChange}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

GeneralSection.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default GeneralSection;
