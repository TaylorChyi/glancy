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

const TAB_KEY = "Tab";
const ESCAPE_KEY = "Escape";

const sanitizeKeyboardEvent = (event) => {
  if (!event || typeof event !== "object" || !("key" in event)) {
    return null;
  }
  return event;
};

const haltEventPropagation = (event) => {
  if ("preventDefault" in event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if ("stopPropagation" in event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }
};

const shouldProcessKeyEvent = (action, recordingAction, event) =>
  recordingAction === action && event && event.key !== TAB_KEY;

const handleEscapeKey = (event, setRecordingAction) => {
  if (event.key === ESCAPE_KEY) {
    setRecordingAction(null);
    return true;
  }
  return false;
};

const useCaptureStartHandler = (setRecordingAction) =>
  useCallback((action) => {
    setRecordingAction(action);
  }, [setRecordingAction]);

const useCaptureBlurHandler = (recordingAction, setRecordingAction) =>
  useCallback(
    (action) => {
      if (recordingAction === action) {
        setRecordingAction(null);
      }
    },
    [recordingAction, setRecordingAction],
  );

const useCaptureKeyDownHandler = ({
  recordingAction,
  setRecordingAction,
  updateShortcut,
}) =>
  useCallback(
    (action, event) => {
      const keyboardEvent = sanitizeKeyboardEvent(event);
      if (!shouldProcessKeyEvent(action, recordingAction, keyboardEvent)) {
        return;
      }
      haltEventPropagation(keyboardEvent);
      if (handleEscapeKey(keyboardEvent, setRecordingAction)) {
        return;
      }
      const keys = captureKeysFromEvent(keyboardEvent);
      if (!keys?.length) {
        return;
      }
      setRecordingAction(null);
      updateShortcut(action, keys).catch(() => {});
    },
    [recordingAction, setRecordingAction, updateShortcut],
  );

const useCaptureHandlers = ({
  recordingAction,
  setRecordingAction,
  updateShortcut,
}) => ({
  onCaptureStart: useCaptureStartHandler(setRecordingAction),
  onBlur: useCaptureBlurHandler(recordingAction, setRecordingAction),
  onKeyDown: useCaptureKeyDownHandler({
    recordingAction,
    setRecordingAction,
    updateShortcut,
  }),
});

const useResetHandler = ({ resetShortcuts, setRecordingAction }) =>
  useCallback(() => {
    setRecordingAction(null);
    resetShortcuts().catch(() => {});
  }, [resetShortcuts, setRecordingAction]);

const buildKeyboardSectionViewModel = (args) =>
  createKeyboardSectionViewModel(args);

const useKeyboardSectionHandlers = ({
  recordingAction,
  setRecordingAction,
  updateShortcut,
  resetShortcuts,
}) => ({
  ...useCaptureHandlers({ recordingAction, setRecordingAction, updateShortcut }),
  onReset: useResetHandler({ resetShortcuts, setRecordingAction }),
});

const useKeyboardSectionBindings = (shortcuts) =>
  useMemo(() => mergeShortcutLists(shortcuts), [shortcuts]);

const useKeyboardShortcutState = () => {
  const {
    shortcuts,
    updateShortcut,
    resetShortcuts,
    pendingAction,
    errors,
    status,
  } = useKeyboardShortcutContext();
  const [recordingAction, setRecordingAction] = useState(null);

  return {
    shortcuts,
    updateShortcut,
    resetShortcuts,
    pendingAction,
    errors,
    status,
    recordingAction,
    setRecordingAction,
  };
};

const createViewModelArgs = ({
  title,
  headingId,
  bindings,
  translations,
  recordingAction,
  pendingAction,
  status,
  errors,
  handlers,
}) => ({
  title,
  headingId,
  bindings,
  translations,
  recordingAction,
  pendingAction,
  status,
  errors,
  handlers,
  resetActionId: KEYBOARD_SHORTCUT_RESET_ACTION,
});

function useKeyboardSectionController({ title, headingId }) {
  const { t } = useLanguage();
  const state = useKeyboardShortcutState();
  const bindings = useKeyboardSectionBindings(state.shortcuts);
  const handlers = useKeyboardSectionHandlers({
    recordingAction: state.recordingAction,
    setRecordingAction: state.setRecordingAction,
    updateShortcut: state.updateShortcut,
    resetShortcuts: state.resetShortcuts,
  });

  return buildKeyboardSectionViewModel(
    createViewModelArgs({
      title,
      headingId,
      bindings,
      translations: t,
      recordingAction: state.recordingAction,
      pendingAction: state.pendingAction,
      status: state.status,
      errors: state.errors,
      handlers,
    }),
  );
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
