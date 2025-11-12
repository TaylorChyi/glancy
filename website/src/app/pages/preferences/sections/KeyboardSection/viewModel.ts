import {
  formatShortcutKeys,
  translateShortcutAction,
} from "@shared/utils/keyboardShortcuts.js";

type ShortcutBinding = {
  action: string;
  keys: string[];
};

type KeyboardSectionHandlers = {
  onCaptureStart: (action: string) => void;
  onKeyDown: (action: string, event: unknown) => void;
  onBlur: (action: string) => void;
  onReset: () => void;
};

type TranslationMap = Record<string, string | undefined>;

export type KeyboardSectionViewModel = {
  section: {
    title: string;
    headingId: string;
  };
  hint: string;
  items: Array<{
    action: string;
    label: string;
    ariaLabel: string;
    displayValue: string;
    recordingLabel: string;
    statusLabel: string;
    errorMessage: string;
    hasError: boolean;
    isRecording: boolean;
    isSaving: boolean;
    disabled: boolean;
    onCaptureStart: () => void;
    onKeyDown: (event: unknown) => void;
    onBlur: () => void;
  }>;
  resetButton: {
    label: string;
    disabled: boolean;
    onClick: () => void;
  };
};

type CreateKeyboardSectionViewModelArgs = {
  title: string;
  headingId: string;
  bindings: ShortcutBinding[];
  translations: TranslationMap;
  recordingAction: string | null;
  pendingAction: string | null;
  status: string;
  errors: Record<string, string | null>;
  handlers: KeyboardSectionHandlers;
  resetActionId: string;
};

const getHint = (
  translations: TranslationMap,
  recordingAction: string | null,
) => {
  if (recordingAction) {
    return (
      translations.settingsKeyboardRecordingHint ??
      "Press desired combination"
    );
  }
  return (
    translations.settingsKeyboardHint ??
    "Click a shortcut then press keys"
  );
};

const getRecordingLabel = (translations: TranslationMap) =>
  translations.settingsKeyboardRecording ?? "Press keys";

const getStatusLabel = (translations: TranslationMap) =>
  translations.settingsKeyboardSaving ?? "Saving...";

const getResetLabel = (translations: TranslationMap) =>
  translations.settingsKeyboardReset ?? "Restore defaults";

const getErrorLabel = (translations: TranslationMap) =>
  translations.settingsKeyboardConflict ?? "Shortcut already in use.";

const getAriaLabel = (translations: TranslationMap, label: string) => {
  const template = translations.settingsKeyboardEditLabel;
  if (typeof template === "string") {
    return template.replace("{label}", label);
  }
  return `Edit shortcut for ${label}`;
};

export const createKeyboardSectionViewModel = ({
  title,
  headingId,
  bindings,
  translations,
  recordingAction,
  pendingAction,
  status,
  errors,
  handlers,
  resetActionId,
}: CreateKeyboardSectionViewModelArgs): KeyboardSectionViewModel => {
  const recordingLabel = getRecordingLabel(translations);
  const statusLabel = getStatusLabel(translations);
  const hint = getHint(translations, recordingAction);
  const errorLabel = getErrorLabel(translations);
  const isResetting = pendingAction === resetActionId;
  const isLoading = status === "loading";

  const items = bindings.map((binding) => {
    const label = translateShortcutAction(translations, binding.action);
    const displayValue = formatShortcutKeys(binding.keys).join(" + ");
    const hasError = Boolean(errors?.[binding.action]);
    const errorMessage = hasError
      ? errors[binding.action] || errorLabel
      : "";
    const isSaving = pendingAction === binding.action;
    return {
      action: binding.action,
      label,
      ariaLabel: getAriaLabel(translations, label),
      displayValue,
      recordingLabel,
      statusLabel,
      errorMessage,
      hasError,
      isRecording: recordingAction === binding.action,
      isSaving,
      disabled: isSaving || isResetting || isLoading,
      onCaptureStart: () => handlers.onCaptureStart(binding.action),
      onKeyDown: (event: unknown) =>
        handlers.onKeyDown(binding.action, event),
      onBlur: () => handlers.onBlur(binding.action),
    };
  });

  return {
    section: { title, headingId },
    hint,
    items,
    resetButton: {
      label: getResetLabel(translations),
      disabled: isResetting || isLoading,
      onClick: handlers.onReset,
    },
  };
};
