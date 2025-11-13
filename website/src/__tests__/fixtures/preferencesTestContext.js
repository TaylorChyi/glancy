import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { jest } from "@jest/globals";
import { makeUser } from "../factories/makeUser.js";

export const preferencesLanguageFixture = Object.freeze({
  prefTitle: "Account preferences",
  prefDescription: "Review and curate your Glancy identity.",
  prefAccountTitle: "Account",
  prefTablistLabel: "Preference sections",
  settingsAccountDescription: "Details that travel with your workspace.",
  settingsAccountAvatarLabel: "Avatar",
  settingsAccountUsername: "Username",
  settingsAccountEmail: "Email",
  settingsAccountPhone: "Phone",
  settingsAccountTitle: "Account",
  settingsTabAccount: "Account",
  settingsTabData: "Data controls",
  settingsTabGeneral: "General",
  settingsEmptyValue: "Not set",
  changeAvatar: "Change avatar",
  settingsAccountBindingTitle: "Connected accounts",
  settingsAccountBindingApple: "Apple",
  settingsAccountBindingGoogle: "Google",
  settingsAccountBindingWeChat: "WeChat",
  settingsAccountBindingStatusUnlinked: "Not linked",
  settingsAccountBindingActionPlaceholder: "Coming soon",
  settingsAccountEmailUnbindAction: "Unlink email",
  settingsAccountEmailUnbinding: "Removing…",
  settingsAccountPhoneRebindAction: "Change phone",
  usernamePlaceholder: "Enter username",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  saving: "Saving...",
  usernameValidationEmpty: "Username cannot be empty",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateFailed: "Unable to update username",
});

const createUpdatedUsernamePayload = (user) => ({
  username: (user?.username || "ada").toLowerCase(),
});

const createAvatarWorkflow = () => ({
  selectAvatar: jest.fn(),
  modalProps: {
    open: false,
    source: "",
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    labels: {},
    isProcessing: false,
  },
  isBusy: false,
});

const createEmailBindingState = (unbindEmail) => ({
  mode: "idle",
  startEditing: jest.fn(),
  cancelEditing: jest.fn(),
  requestCode: jest.fn(),
  confirmChange: jest.fn(),
  unbindEmail,
  isSendingCode: false,
  isVerifying: false,
  isUnbinding: false,
  codeIssuedAt: null,
  lastRequestedEmail: null,
  requestedEmail: null,
  hasBoundEmail: true,
});

const preferencesTestState = {
  language: preferencesLanguageFixture,
  user: makeUser(),
  setUser: jest.fn(),
  theme: { theme: "light", setTheme: jest.fn() },
  shortcuts: { register: jest.fn(), unregister: jest.fn() },
  avatarWorkflow: createAvatarWorkflow(),
  unbindEmail: jest.fn().mockResolvedValue({ email: null }),
  emailBinding: null,
  updateUsername: jest.fn(),
};

preferencesTestState.emailBinding = createEmailBindingState(
  preferencesTestState.unbindEmail,
);
preferencesTestState.updateUsername = jest
  .fn()
  .mockResolvedValue(createUpdatedUsernamePayload(preferencesTestState.user));

export const resetPreferencesTestState = () => {
  preferencesTestState.user = makeUser();
  preferencesTestState.setUser = jest.fn();
  preferencesTestState.theme = { theme: "light", setTheme: jest.fn() };
  preferencesTestState.shortcuts = {
    register: jest.fn(),
    unregister: jest.fn(),
  };
  preferencesTestState.unbindEmail = jest
    .fn()
    .mockResolvedValue({ email: null });
  preferencesTestState.avatarWorkflow = createAvatarWorkflow();
  preferencesTestState.emailBinding = createEmailBindingState(
    preferencesTestState.unbindEmail,
  );
  preferencesTestState.updateUsername = jest
    .fn()
    .mockResolvedValue(createUpdatedUsernamePayload(preferencesTestState.user));
};

const setupPreferencesModuleMocks = () => {
  jest.unstable_mockModule("@core/context", () => ({
    useLanguage: () => ({ t: preferencesTestState.language }),
    useUser: () => ({
      user: preferencesTestState.user,
      setUser: preferencesTestState.setUser,
    }),
    useTheme: () => preferencesTestState.theme,
    useKeyboardShortcutContext: () => preferencesTestState.shortcuts,
    KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
  }));

  jest.unstable_mockModule("@shared/api/users.js", () => ({
    useUsersApi: () => ({
      updateUsername: preferencesTestState.updateUsername,
      unbindEmail: preferencesTestState.unbindEmail,
    }),
  }));

  jest.unstable_mockModule("@shared/components/ui/Avatar", () => ({
    __esModule: true,
    default: ({ className }) => (
      <div data-testid="avatar" className={className}>
        avatar
      </div>
    ),
  }));

  jest.unstable_mockModule("@shared/hooks/useAvatarEditorWorkflow.js", () => ({
    __esModule: true,
    default: () => preferencesTestState.avatarWorkflow,
  }));

  jest.unstable_mockModule("@shared/hooks/useEmailBinding.js", () => ({
    __esModule: true,
    default: () => preferencesTestState.emailBinding,
    useEmailBinding: () => preferencesTestState.emailBinding,
  }));

  const MockUsernameEditor = ({
    username,
    emptyDisplayValue,
    t,
    onSubmit,
  }) => {
    const [mode, setMode] = useState("view");
    const [draft, setDraft] = useState(username ?? "");
    const [error, setError] = useState(null);

    useEffect(() => {
      setDraft(username ?? "");
      setError(null);
    }, [username]);

    const displayValue =
      mode === "view" && (!draft || !draft.trim())
        ? emptyDisplayValue ?? ""
        : draft;

    const handleButtonClick = async () => {
      if (mode === "view") {
        setMode("edit");
        return;
      }
      const normalized = draft.trim();
      if (normalized.length < 3) {
        const message =
          t.usernameValidationTooShort?.replace("{{min}}", "3") ??
          "Username must be at least 3 characters";
        setError(message);
        return;
      }
      await onSubmit?.(normalized);
      setDraft(normalized);
      setError(null);
      setMode("view");
    };

    return (
      <div>
        <input
          placeholder={t.usernamePlaceholder}
          value={mode === "view" ? displayValue : draft}
          disabled={mode === "view"}
          aria-invalid={error ? "true" : "false"}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="button" onClick={handleButtonClick}>
          {mode === "view" ? t.changeUsernameButton : t.saveUsernameButton}
        </button>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
      </div>
    );
  };
  MockUsernameEditor.propTypes = {
    username: PropTypes.string,
    emptyDisplayValue: PropTypes.string,
    t: PropTypes.shape({
      usernamePlaceholder: PropTypes.string.isRequired,
      changeUsernameButton: PropTypes.string.isRequired,
      saveUsernameButton: PropTypes.string.isRequired,
    }).isRequired,
    onSubmit: PropTypes.func,
  };

  jest.unstable_mockModule("@shared/components/Profile/UsernameEditor", () => ({
    __esModule: true,
    default: MockUsernameEditor,
  }));
};

setupPreferencesModuleMocks();
resetPreferencesTestState();

export { preferencesTestState };
