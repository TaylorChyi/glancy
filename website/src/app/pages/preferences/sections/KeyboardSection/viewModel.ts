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

type CreateHintArgs = {
  translations: TranslationMap;
  recordingAction: string | null;
};

const createHint = ({ translations, recordingAction }: CreateHintArgs) =>
  getHint(translations, recordingAction);

const resolveItemError = (
  errors: Record<string, string | null>,
  action: string,
  fallback: string,
) => {
  const message = errors?.[action];
  if (!message) {
    return { hasError: false, errorMessage: "" };
  }
  return { hasError: true, errorMessage: message || fallback };
};

type ResolveItemStateArgs = {
  pendingAction: string | null;
  status: string;
  isResetting: boolean;
  action: string;
};

const resolveItemState = ({
  pendingAction,
  status,
  isResetting,
  action,
}: ResolveItemStateArgs) => {
  const isSaving = pendingAction === action;
  const isLoading = status === "loading";
  return {
    isSaving,
    disabled: isSaving || isResetting || isLoading,
  };
};

type CreateItemViewModelArgs = {
  binding: ShortcutBinding;
  translations: TranslationMap;
  recordingAction: string | null;
  pendingAction: string | null;
  status: string;
  errors: Record<string, string | null>;
  handlers: KeyboardSectionHandlers;
  recordingLabel: string;
  statusLabel: string;
  errorLabel: string;
  isResetting: boolean;
};

type DeriveItemPresentationArgs = {
  translations: TranslationMap;
  binding: ShortcutBinding;
};

const deriveItemPresentation = ({
  translations,
  binding,
}: DeriveItemPresentationArgs) => {
  const label = translateShortcutAction(translations, binding.action);
  return {
    label,
    ariaLabel: getAriaLabel(translations, label),
    displayValue: formatShortcutKeys(binding.keys).join(" + "),
  };
};

type AssembleItemViewModelArgs = {
  action: string;
  label: string;
  ariaLabel: string;
  displayValue: string;
  recordingLabel: string;
  statusLabel: string;
  errorMessage: string;
  hasError: boolean;
  recordingAction: string | null;
  isSaving: boolean;
  disabled: boolean;
  handlers: KeyboardSectionHandlers;
};

const assembleItemViewModel = ({
  action,
  label,
  ariaLabel,
  displayValue,
  recordingLabel,
  statusLabel,
  errorMessage,
  hasError,
  recordingAction,
  isSaving,
  disabled,
  handlers,
}: AssembleItemViewModelArgs) => ({
  action,
  label,
  ariaLabel,
  displayValue,
  recordingLabel,
  statusLabel,
  errorMessage,
  hasError,
  isRecording: recordingAction === action,
  isSaving,
  disabled,
  onCaptureStart: () => handlers.onCaptureStart(action),
  onKeyDown: (event: unknown) => handlers.onKeyDown(action, event),
  onBlur: () => handlers.onBlur(action),
});

const createItemViewModel = ({
  binding,
  translations,
  recordingAction,
  pendingAction,
  status,
  errors,
  handlers,
  recordingLabel,
  statusLabel,
  errorLabel,
  isResetting,
}: CreateItemViewModelArgs) => {
  const action = binding.action;
  return assembleItemViewModel({
    action,
    ...deriveItemPresentation({ translations, binding }),
    recordingLabel,
    statusLabel,
    ...resolveItemError(errors, action, errorLabel),
    recordingAction,
    ...resolveItemState({ pendingAction, status, isResetting, action }),
    handlers,
  });
};

type CreateItemsArgs = {
  bindings: ShortcutBinding[];
  translations: TranslationMap;
  recordingAction: string | null;
  pendingAction: string | null;
  status: string;
  errors: Record<string, string | null>;
  handlers: KeyboardSectionHandlers;
  labels: ViewModelLabels;
  isResetting: boolean;
};

const createItems = ({
  bindings,
  translations,
  recordingAction,
  pendingAction,
  status,
  errors,
  handlers,
  labels,
  isResetting,
}: CreateItemsArgs) =>
  bindings.map((binding) =>
    createItemViewModel({
      binding,
      translations,
      recordingAction,
      pendingAction,
      status,
      errors,
      handlers,
      recordingLabel: labels.recordingLabel,
      statusLabel: labels.statusLabel,
      errorLabel: labels.errorLabel,
      isResetting,
    }),
  );

type CreateResetButtonArgs = {
  translations: TranslationMap;
  handlers: KeyboardSectionHandlers;
  isResetting: boolean;
  status: string;
};

const createResetButton = ({
  translations,
  handlers,
  isResetting,
  status,
}: CreateResetButtonArgs) => ({
  label: getResetLabel(translations),
  disabled: isResetting || status === "loading",
  onClick: handlers.onReset,
});

type BuildViewModelDetailsArgs = {
  bindings: ShortcutBinding[];
  translations: TranslationMap;
  recordingAction: string | null;
  pendingAction: string | null;
  status: string;
  errors: Record<string, string | null>;
  handlers: KeyboardSectionHandlers;
  resetActionId: string;
};

const getViewModelLabels = (translations: TranslationMap) => ({
  recordingLabel: getRecordingLabel(translations),
  statusLabel: getStatusLabel(translations),
  errorLabel: getErrorLabel(translations),
});

type ViewModelLabels = ReturnType<typeof getViewModelLabels>;

const buildViewModelDetails = (args: BuildViewModelDetailsArgs) => {
  const { bindings, translations, recordingAction, pendingAction, status, errors, handlers, resetActionId } = args;
  const labels = getViewModelLabels(translations);
  const isResetting = pendingAction === resetActionId;

  return {
    hint: createHint({ translations, recordingAction }),
    items: createItems({
      bindings,
      translations,
      recordingAction,
      pendingAction,
      status,
      errors,
      handlers,
      labels,
      isResetting,
    }),
    resetButton: createResetButton({ translations, handlers, isResetting, status }),
  };
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
  const details = buildViewModelDetails({
    bindings,
    translations,
    recordingAction,
    pendingAction,
    status,
    errors,
    handlers,
    resetActionId,
  });

  return {
    section: { title, headingId },
    hint: details.hint,
    items: details.items,
    resetButton: details.resetButton,
  };
};
