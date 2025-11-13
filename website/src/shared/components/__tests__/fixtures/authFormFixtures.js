import React from "react";
import { jest } from "@jest/globals";
import { BRAND_LOGO_ICON } from "@shared/utils/brand.js";
import { renderWithProviders } from "../../../../__tests__/helpers/renderWithProviders.js";

const iconRegistry = {
  [BRAND_LOGO_ICON]: {
    light: Object.freeze({
      url: "/assets/brand/glancy/brand-glancy-website.svg",
      inline: '<svg data-token="glancy-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/brand/glancy/brand-glancy-website.svg",
      inline: '<svg data-token="glancy-dark"></svg>',
    }),
  },
  user: {
    light: Object.freeze({
      url: "/assets/user-light.svg",
      inline: '<svg data-token="user-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/user-dark.svg",
      inline: '<svg data-token="user-dark"></svg>',
    }),
  },
  email: {
    light: Object.freeze({
      url: "/assets/email-light.svg",
      inline: '<svg data-token="email-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/email-dark.svg",
      inline: '<svg data-token="email-dark"></svg>',
    }),
  },
  phone: {
    light: Object.freeze({
      url: "/assets/phone-light.svg",
      inline: '<svg data-token="phone-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/phone-dark.svg",
      inline: '<svg data-token="phone-dark"></svg>',
    }),
  },
  wechat: {
    light: Object.freeze({
      url: "/assets/wechat-light.svg",
      inline: '<svg data-token="wechat-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/wechat-dark.svg",
      inline: '<svg data-token="wechat-dark"></svg>',
    }),
  },
  apple: {
    light: Object.freeze({
      url: "/assets/apple-light.svg",
      inline: '<svg data-token="apple-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/apple-dark.svg",
      inline: '<svg data-token="apple-dark"></svg>',
    }),
  },
  google: {
    light: Object.freeze({
      url: "/assets/google-light.svg",
      inline: '<svg data-token="google-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/google-dark.svg",
      inline: '<svg data-token="google-dark"></svg>',
    }),
  },
  eye: {
    light: Object.freeze({
      url: "/assets/eye-light.svg",
      inline: '<svg data-token="eye-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/eye-dark.svg",
      inline: '<svg data-token="eye-dark"></svg>',
    }),
  },
  "eye-off": {
    light: Object.freeze({
      url: "/assets/eye-off-light.svg",
      inline: '<svg data-token="eye-off-light"></svg>',
    }),
    dark: Object.freeze({
      url: "/assets/eye-off-dark.svg",
      inline: '<svg data-token="eye-off-dark"></svg>',
    }),
  },
};

let authFormComponent;

const setupModuleMocks = () => {
  jest.unstable_mockModule("@core/context", () => ({
    useTheme: () => ({ resolvedTheme: "light" }),
    useApiContext: () => ({ request: async () => {} }),
    useUser: () => ({ setUser: jest.fn() }),
    useHistory: () => ({ entries: [] }),
    useFavorites: () => ({ items: [] }),
    useLanguage: () => ({
      lang: "en",
      t: {
        continueButton: "Continue",
        invalidAccount: "Invalid account",
        loginButton: "Log in",
        registerButton: "Sign up",
        or: "OR",
        notImplementedYet: "Not implemented yet",
        termsOfUse: "Terms of Use",
        privacyPolicy: "Privacy Policy",
        otherLoginOptions: "Other login options",
        otherRegisterOptions: "Other register options",
        codeButtonLabel: "Get code",
        codeRequestSuccess:
          "Verification code sent. Please check your inbox.",
        codeRequestFailed: "Failed to send verification code",
        codeRequestInvalidMethod: "Unavailable",
        toastDismissLabel: "Dismiss notification",
      },
    }),
    useKeyboardShortcutContext: () => ({ shortcuts: [] }),
    KEYBOARD_SHORTCUT_RESET_ACTION: "reset",
  }));

  jest.unstable_mockModule("@assets/icons.js", () => ({
    default: iconRegistry,
  }));
};

export const defaultAuthFormProps = {
  title: "Login",
  switchText: "Have account?",
  switchLink: "/register",
  placeholders: { username: "Username" },
  formMethods: ["wechat", "username"],
  methodOrder: ["username", "wechat"],
  defaultMethod: "username",
};

export const createAuthFormProps = (overrides = {}) => ({
  ...defaultAuthFormProps,
  onSubmit: jest.fn(),
  ...overrides,
});

export const loadAuthForm = async () => {
  if (!authFormComponent) {
    setupModuleMocks();
    const module = await import("@shared/components/form/AuthForm.jsx");
    authFormComponent = module.default;
  }
  return authFormComponent;
};

export const renderAuthForm = async (props = {}, renderOptions) => {
  const AuthForm = await loadAuthForm();
  const mergedProps = createAuthFormProps({ ...props });
  const utils = renderWithProviders(<AuthForm {...mergedProps} />, renderOptions);
  return { AuthForm, ...utils };
};
