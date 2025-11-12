import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  useLanguage,
  useKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION,
} from "@core/context";
import {
  captureKeysFromEvent,
  mergeShortcutLists,
} from "@shared/utils/keyboardShortcuts.js";
import KeyboardSectionView from "./KeyboardSection/KeyboardSectionView.jsx";
import { createKeyboardSectionViewModel } from "./KeyboardSection/viewModel";

function useKeyboardSectionController({ title, headingId }) {
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

  const bindings = useMemo(() => mergeShortcutLists(shortcuts), [shortcuts]);

  const handleCaptureStart = useCallback((action) => {
    setRecordingAction(action);
  }, []);

  const handleCaptureKeyDown = useCallback(
    (action, event) => {
      if (recordingAction !== action) {
        return;
      }
      if (!event || typeof event !== "object" || !("key" in event)) {
        return;
      }
      if (event.key === "Tab") {
        return;
      }
      if ("preventDefault" in event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if ("stopPropagation" in event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
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

  return createKeyboardSectionViewModel({
    title,
    headingId,
    bindings,
    translations: t,
    recordingAction,
    pendingAction,
    status,
    errors,
    resetActionId: KEYBOARD_SHORTCUT_RESET_ACTION,
    handlers: {
      onCaptureStart: handleCaptureStart,
      onKeyDown: handleCaptureKeyDown,
      onBlur: handleCaptureBlur,
      onReset: handleReset,
    },
  });
}

function KeyboardSectionContainer({ title, headingId }) {
  const viewModel = useKeyboardSectionController({ title, headingId });
  return <KeyboardSectionView {...viewModel} />;
}

KeyboardSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default KeyboardSectionContainer;
