import { jest } from "@jest/globals";
import {
  preferenceSectionsMocks,
  resetPreferenceSectionMocks,
} from "./mockModules.js";
import { createTranslations } from "./translationFactories.js";

const createDefaultUser = () => ({
  id: "user-1",
  username: "amy",
  email: "amy@example.com",
  plan: "plus",
  isPro: true,
  token: "token-123",
});

const createDefaultThemeContext = () => ({
  theme: "light",
  setTheme: jest.fn(),
});

const createDefaultKeyboardContext = () => ({
  register: jest.fn(),
  unregister: jest.fn(),
});

const createDefaultAvatarWorkflow = () => ({
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

const createDefaultProfile = () => ({
  job: "Engineer",
  goal: "B2",
  currentAbility: "B1",
  education: "Bachelor",
  interest: "AI",
  responseStyle: "default",
  customSections: [],
});

const createDefaultEmailBinding = (unbindEmail) => ({
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

const mergeOverrides = (base, overrides) => {
  if (!overrides) {
    return base;
  }

  if (typeof overrides === "function") {
    return overrides(base);
  }

  return {
    ...base,
    ...overrides,
  };
};

export const createPreferenceSectionsTestContext = (options = {}) => {
  resetPreferenceSectionMocks();

  const translations = createTranslations(options.translationOverrides);
  preferenceSectionsMocks.useLanguage.mockReturnValue({ t: translations });

  const user = mergeOverrides(createDefaultUser(), options.user);
  const setUserMock = jest.fn();
  preferenceSectionsMocks.useUser.mockReturnValue({
    user,
    setUser: setUserMock,
    ...options.useUserResultOverrides,
  });

  const themeContext = mergeOverrides(
    createDefaultThemeContext(),
    options.themeContext,
  );
  preferenceSectionsMocks.useTheme.mockReturnValue(themeContext);

  const keyboardContext = mergeOverrides(
    createDefaultKeyboardContext(),
    options.keyboardShortcutsContext,
  );
  preferenceSectionsMocks.useKeyboardShortcutContext.mockReturnValue(
    keyboardContext,
  );

  const avatarWorkflow = mergeOverrides(
    createDefaultAvatarWorkflow(),
    options.avatarWorkflow,
  );
  preferenceSectionsMocks.useAvatarEditorWorkflow.mockReturnValue(
    avatarWorkflow,
  );

  const unbindEmailMock =
    options.unbindEmailMock ?? jest.fn().mockResolvedValue({ email: null });

  const emailBindingState = mergeOverrides(
    createDefaultEmailBinding(unbindEmailMock),
    options.emailBinding,
  );
  preferenceSectionsMocks.useEmailBinding.mockReturnValue(emailBindingState);

  const profileSnapshot = mergeOverrides(
    createDefaultProfile(),
    options.profileResponse,
  );
  const fetchProfileMock =
    options.fetchProfileMock ?? jest.fn().mockResolvedValue(profileSnapshot);
  const saveProfileMock =
    options.saveProfileMock ?? jest.fn().mockResolvedValue(profileSnapshot);
  preferenceSectionsMocks.useProfilesApi.mockReturnValue({
    fetchProfile: fetchProfileMock,
    saveProfile: saveProfileMock,
    ...options.profilesApiOverrides,
  });

  const redeemMock = options.redeemMock ?? jest.fn().mockResolvedValue({});
  preferenceSectionsMocks.useRedemptionCodesApi.mockReturnValue({
    redeem: redeemMock,
    ...options.redemptionCodesApiOverrides,
  });

  const updateUsernameMock =
    options.updateUsernameMock ??
    jest.fn().mockResolvedValue({ username: user.username });
  preferenceSectionsMocks.useUsersApi.mockReturnValue({
    updateUsername: updateUsernameMock,
    unbindEmail: unbindEmailMock,
    ...options.usersApiOverrides,
  });

  const consoleErrorStub = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  return {
    translations,
    user,
    setUserMock,
    updateUsernameMock,
    fetchProfileMock,
    saveProfileMock,
    redeemMock,
    unbindEmailMock,
    emailBindingState,
    avatarWorkflow,
    consoleErrorStub,
    restore: () => {
      consoleErrorStub.mockRestore();
    },
  };
};
