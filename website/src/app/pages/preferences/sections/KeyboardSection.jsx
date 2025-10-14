/**
 * 背景：
 *  - 键盘快捷键此前仅展示占位文案，无法满足用户自定义需求。
 * 目的：
 *  - 构建可编辑的快捷键列表，支持即时录入、冲突提示与恢复默认。
 * 关键决策与取舍：
 *  - 采用上下文状态 + 纯函数工具：上下文负责持久化交互，组件专注呈现；放弃直接在组件内持久化以保持分层清晰。
 * 影响范围：
 *  - 偏好设置面板的“键盘”分区以及依赖快捷键的全局监听行为。
 * 演进与TODO：
 *  - TODO: 后续可加入搜索与自定义动作分组。
 */
import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  useLanguage,
  useKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION,
} from "@core/context";
import {
  captureKeysFromEvent,
  formatShortcutKeys,
  mergeShortcutLists,
  translateShortcutAction,
} from "@shared/utils/keyboardShortcuts.js";
import SettingsSection from "@shared/components/settings/SettingsSection";
import sectionStyles from "../Preferences.module.css";
import styles from "./KeyboardSection.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function KeyboardSection({ title, headingId }) {
  const { t } = useLanguage();
  const {
    shortcuts,
    updateShortcut,
    resetShortcuts,
    pendingAction,
    errors,
    status,
  } = useKeyboardShortcutContext();
  const [recordingAction, setRecordingAction] = useState(null);

  const items = useMemo(() => mergeShortcutLists(shortcuts), [shortcuts]);

  const handleCaptureStart = useCallback((action) => {
    setRecordingAction(action);
  }, []);

  const handleCaptureKeyDown = useCallback(
    (action, event) => {
      if (recordingAction !== action) {
        return;
      }
      if (event.key === "Tab") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        setRecordingAction(null);
        return;
      }
      const keys = captureKeysFromEvent(event);
      if (!keys || keys.length === 0) {
        return;
      }
      setRecordingAction(null);
      updateShortcut(action, keys).catch(() => {});
    },
    [recordingAction, updateShortcut],
  );

  const handleCaptureBlur = useCallback(
    (action) => {
      if (recordingAction === action) {
        setRecordingAction(null);
      }
    },
    [recordingAction],
  );

  const handleReset = useCallback(() => {
    setRecordingAction(null);
    resetShortcuts().catch(() => {});
  }, [resetShortcuts]);

  const hint = recordingAction
    ? (t.settingsKeyboardRecordingHint ?? "Press desired combination")
    : (t.settingsKeyboardHint ?? "Click a shortcut then press keys");

  const errorForAction = (action) => errors?.[action];
  const isUpdating = (action) => pendingAction === action;
  const isResetting = pendingAction === KEYBOARD_SHORTCUT_RESET_ACTION;
  const isLoading = status === "loading";

  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      classes={{
        section: composeClassName(
          sectionStyles.section,
          sectionStyles["section-plain"],
          styles.section,
        ),
        header: sectionStyles["section-header"],
        title: sectionStyles["section-title"],
        divider: sectionStyles["section-divider"],
      }}
    >
      <div className={styles.body}>
        <div className={styles.hint}>{hint}</div>
        <ul className={styles.list}>
          {items.map((item) => {
            const label = translateShortcutAction(t, item.action);
            const displayKeys = formatShortcutKeys(item.keys);
            const isRecording = recordingAction === item.action;
            const isSaving = isUpdating(item.action);
            const hasError = Boolean(errorForAction(item.action));
            return (
              <li key={item.action} className={styles.item}>
                <div className={styles.meta}>
                  <span className={styles.label}>{label}</span>
                  {hasError ? (
                    <span className={styles.error}>
                      {t.settingsKeyboardConflict ?? "Shortcut already in use."}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={composeClassName(
                    styles.trigger,
                    isRecording ? styles.recording : "",
                  )}
                  aria-label={
                    t.settingsKeyboardEditLabel?.replace("{label}", label) ??
                    `Edit shortcut for ${label}`
                  }
                  onClick={() => handleCaptureStart(item.action)}
                  onKeyDown={(event) =>
                    handleCaptureKeyDown(item.action, event)
                  }
                  onBlur={() => handleCaptureBlur(item.action)}
                  disabled={isSaving || isResetting || isLoading}
                >
                  <span className={styles.keys}>
                    {isRecording
                      ? (t.settingsKeyboardRecording ?? "Press keys")
                      : displayKeys.join(" + ")}
                  </span>
                  {isSaving ? (
                    <span className={styles.status}>
                      {t.settingsKeyboardSaving ?? "Saving..."}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.reset}
            onClick={handleReset}
            disabled={isResetting || isLoading}
          >
            {t.settingsKeyboardReset ?? "Restore defaults"}
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}

KeyboardSection.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default KeyboardSection;
