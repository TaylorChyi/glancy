import { renderHook } from "@testing-library/react";
import { jest } from "@jest/globals";

let userState;
let historyState;
let languageState;

const translations = {
  navLogin: "登录",
  navRegister: "注册",
  settings: "设置",
  logout: "退出",
};

const buildUserContext = (overrides = {}) => ({
  user: null,
  clearUser: jest.fn(),
  ...overrides,
});

const buildHistoryContext = (overrides = {}) => ({
  clearHistory: jest.fn(),
  ...overrides,
});

const buildLanguageContext = (overrides = {}) => ({
  t: { ...translations, ...(overrides.t ?? {}) },
});

const setContextState = ({ user, history, language } = {}) => {
  userState = buildUserContext(user);
  historyState = buildHistoryContext(history);
  languageState = buildLanguageContext(language);
};

const renderUserDock = () => renderHook(() => useSidebarUserDock());

jest.unstable_mockModule("@core/context", () => ({
  useUser: () => userState,
  useHistory: () => historyState,
  useLanguage: () => languageState,
}));

const { default: useSidebarUserDock } = await import(
  "../hooks/useSidebarUserDock.js"
);

describe("useSidebarUserDock", () => {
  beforeEach(() => {
    setContextState();
  });

  describe("anonymous user", () => {
    beforeEach(() => {
      setContextState();
    });

    test("Given anonymous user When hook runs Then exposes login navigation", () => {
      const { result } = renderUserDock();

      expect(result.current.hasUser).toBe(false);
      expect(result.current.anonymousNav.login).toEqual({
        icon: "arrow-right-on-rectangle",
        label: translations.navLogin,
        to: "/login",
      });
      expect(result.current.anonymousNav.register).toEqual({
        icon: "user",
        label: translations.navRegister,
        to: "/register",
      });
    });
  });

  describe("authenticated user", () => {
    const arrangeAuthenticatedUser = (userOverrides) => {
      setContextState({
        user: buildUserContext({ user: userOverrides }),
      });
    };

    test("Given pro user When building props Then maps modal controls", () => {
      const openSettings = jest.fn();
      const openLogout = jest.fn();

      arrangeAuthenticatedUser({ username: "alice", plan: "plus", member: true });

      const { result } = renderUserDock();

      expect(result.current.modalProps).toMatchObject({
        isPro: true,
        user: userState.user,
      });

      const props = result.current.buildAuthenticatedProps({
        openSettings,
        openLogout,
      });

      expect(props.displayName).toBe("alice");
      expect(props.planLabel).toBe("Plus");
      expect(props.labels).toEqual({
        settings: translations.settings,
        logout: translations.logout,
      });
      expect(props.labels).not.toHaveProperty("upgrade");
      expect(props).not.toHaveProperty("onOpenUpgrade");
      expect(props.onOpenSettings).toBe(openSettings);
      expect(props.onOpenLogout).toBe(openLogout);
    });

    test("Given free user When building props Then returns minimal labels", () => {
      arrangeAuthenticatedUser({ email: "user@example.com", plan: "free" });

      const { result } = renderUserDock();

      const props = result.current.buildAuthenticatedProps({
        openSettings: jest.fn(),
        openLogout: jest.fn(),
      });

      expect(props.planLabel).toBe("Free");
      expect(props.labels).toEqual({
        settings: translations.settings,
        logout: translations.logout,
      });
    });
  });
});
