import { jest } from "@jest/globals";

export const preferenceSectionsMocks = {
  useLanguage: jest.fn(),
  useUser: jest.fn(),
  useTheme: jest.fn(),
  useKeyboardShortcutContext: jest.fn(),
  useAvatarEditorWorkflow: jest.fn(),
  useUsersApi: jest.fn(),
  useProfilesApi: jest.fn(),
  useRedemptionCodesApi: jest.fn(),
  useEmailBinding: jest.fn(),
};

jest.unstable_mockModule("@core/context", () => ({
  useLanguage: preferenceSectionsMocks.useLanguage,
  useUser: preferenceSectionsMocks.useUser,
  useTheme: preferenceSectionsMocks.useTheme,
  useKeyboardShortcutContext:
    preferenceSectionsMocks.useKeyboardShortcutContext,
  KEYBOARD_SHORTCUT_RESET_ACTION: "__GLOBAL_RESET__",
}));

jest.unstable_mockModule("@shared/hooks/useAvatarEditorWorkflow.js", () => ({
  __esModule: true,
  default: preferenceSectionsMocks.useAvatarEditorWorkflow,
}));

jest.unstable_mockModule("@shared/hooks/useEmailBinding.js", () => ({
  __esModule: true,
  default: preferenceSectionsMocks.useEmailBinding,
  useEmailBinding: preferenceSectionsMocks.useEmailBinding,
}));

jest.unstable_mockModule("@shared/api/users.js", () => ({
  useUsersApi: preferenceSectionsMocks.useUsersApi,
}));

jest.unstable_mockModule("@shared/api/profiles.js", () => ({
  useProfilesApi: preferenceSectionsMocks.useProfilesApi,
}));

jest.unstable_mockModule("@shared/api/redemptionCodes.js", () => ({
  useRedemptionCodesApi: preferenceSectionsMocks.useRedemptionCodesApi,
}));

let cachedModules;

export const loadPreferenceSectionsModules = async () => {
  if (!cachedModules) {
    const [sectionsModule, accountConstants] = await Promise.all([
      import("../usePreferenceSections.js"),
      import("../sections/accountSection.constants.js"),
    ]);
    cachedModules = {
      usePreferenceSections: sectionsModule.default,
      ACCOUNT_USERNAME_FIELD_TYPE: accountConstants.ACCOUNT_USERNAME_FIELD_TYPE,
    };
  }

  return cachedModules;
};

export const resetPreferenceSectionMocks = () => {
  Object.values(preferenceSectionsMocks).forEach((mockFn) => {
    mockFn.mockReset();
  });
};
