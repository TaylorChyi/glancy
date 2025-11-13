import React from "react";
import { jest } from "@jest/globals";
import { MockUsernameEditor } from "./MockUsernameEditor.jsx";
import { preferencesTestState } from "./state.js";

const mockCoreContext = () => {
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
};

const mockUsersApi = () => {
  jest.unstable_mockModule("@shared/api/users.js", () => ({
    useUsersApi: () => ({
      updateUsername: preferencesTestState.updateUsername,
      unbindEmail: preferencesTestState.unbindEmail,
    }),
  }));
};

const mockAvatar = () => {
  jest.unstable_mockModule("@shared/components/ui/Avatar", () => ({
    __esModule: true,
    default: ({ className }) => (
      <div data-testid="avatar" className={className}>
        avatar
      </div>
    ),
  }));
};

const mockAvatarWorkflow = () => {
  jest.unstable_mockModule("@shared/hooks/useAvatarEditorWorkflow.js", () => ({
    __esModule: true,
    default: () => preferencesTestState.avatarWorkflow,
  }));
};

const mockEmailBinding = () => {
  jest.unstable_mockModule("@shared/hooks/useEmailBinding.js", () => ({
    __esModule: true,
    default: () => preferencesTestState.emailBinding,
    useEmailBinding: () => preferencesTestState.emailBinding,
  }));
};

const mockUsernameEditor = () => {
  jest.unstable_mockModule("@shared/components/Profile/UsernameEditor", () => ({
    __esModule: true,
    default: MockUsernameEditor,
  }));
};

let mocksRegistered = false;

export const setupPreferencesTestEnvironment = () => {
  if (mocksRegistered) {
    return;
  }

  mockCoreContext();
  mockUsersApi();
  mockAvatar();
  mockAvatarWorkflow();
  mockEmailBinding();
  mockUsernameEditor();
  mocksRegistered = true;
};
