import { jest } from "@jest/globals";
import { makeUser } from "../../../src/__tests__/factories/makeUser.js";

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

const createTheme = () => ({ theme: "light", setTheme: jest.fn() });

const createShortcuts = () => ({
  register: jest.fn(),
  unregister: jest.fn(),
});

const resolveUser = (overrides) => overrides.user ?? makeUser();

const resolveUnbindEmail = (overrides) =>
  overrides.unbindEmail ?? jest.fn().mockResolvedValue({ email: null });

const resolveTheme = (overrides) => overrides.theme ?? createTheme();

const resolveShortcuts = (overrides) =>
  overrides.shortcuts ?? createShortcuts();

const resolveAvatarWorkflow = (overrides) =>
  overrides.avatarWorkflow ?? createAvatarWorkflow();

const resolveLanguage = (overrides) =>
  overrides.language ?? preferencesLanguageFixture;

const resolveSetUser = (overrides) => overrides.setUser ?? jest.fn();

const resolveUpdateUsername = (overrides, user) =>
  overrides.updateUsername ??
  jest.fn().mockResolvedValue(createUpdatedUsernamePayload(user));

const resolveEmailBinding = (overrides, unbindEmail) =>
  overrides.emailBinding ?? createEmailBindingState(unbindEmail);

const applyBaseState = (target, overrides = {}) => {
  const user = resolveUser(overrides);
  const unbindEmail = resolveUnbindEmail(overrides);

  const nextState = {
    language: resolveLanguage(overrides),
    user,
    setUser: resolveSetUser(overrides),
    theme: resolveTheme(overrides),
    shortcuts: resolveShortcuts(overrides),
    avatarWorkflow: resolveAvatarWorkflow(overrides),
    unbindEmail,
    emailBinding: resolveEmailBinding(overrides, unbindEmail),
    updateUsername: resolveUpdateUsername(overrides, user),
  };

  Object.assign(target, nextState);
};

export const preferencesTestState = {};

applyBaseState(preferencesTestState);

export const resetPreferencesTestState = (overrides = {}) => {
  applyBaseState(preferencesTestState, overrides);
};
