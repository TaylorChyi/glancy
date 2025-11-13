import { AUTH_CODE_PURPOSES } from "@shared/form/authProtocols.js";

export const MODE_VIEW_COPY = {
  login: (t) => ({
    title: t.loginWelcome,
    switchText: t.loginSwitch,
    switchLink: "/register",
    passwordPlaceholder: (method) =>
      method === "username" ? t.passwordPlaceholder : t.passwordOrCodePlaceholder,
    showCodeButton: (method) => method !== "username",
    otherOptionsLabel: t.otherLoginOptions,
    includeUsername: true,
    codePurpose: AUTH_CODE_PURPOSES.LOGIN,
  }),
  register: (t) => ({
    title: t.registerCreate,
    switchText: t.registerSwitch,
    switchLink: "/login",
    passwordPlaceholder: () => t.codePlaceholder,
    showCodeButton: () => true,
    otherOptionsLabel: t.otherRegisterOptions,
    includeUsername: false,
    codePurpose: AUTH_CODE_PURPOSES.REGISTER,
  }),
};

export const getAuthViewCopy = (mode, t) => {
  const factory = MODE_VIEW_COPY[mode] ?? MODE_VIEW_COPY.login;
  return factory(t);
};
