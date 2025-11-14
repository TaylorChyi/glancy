import { act } from "@testing-library/react";
import { useCookieConsentStore, LOGIN_HISTORY_COOKIE_KEY } from "@core/store";

const expireCookie = () => {
  document.cookie = `${LOGIN_HISTORY_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export const resetCookieConsentStore = () => {
  localStorage.clear();
  expireCookie();
  act(() => {
    useCookieConsentStore.getState().resetConsent();
  });
};

export const withCookieConsentStore = (operation) => {
  act(() => {
    operation(useCookieConsentStore.getState());
  });
};

export const hasLoginHistoryCookie = () =>
  document.cookie.includes(LOGIN_HISTORY_COOKIE_KEY);

export const writeLoginHistoryCookie = () => {
  document.cookie = `${LOGIN_HISTORY_COOKIE_KEY}=1; path=/`;
};
