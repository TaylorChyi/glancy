import type { GetState, SetState } from "zustand";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { deleteCookie, hasCookie, setCookie } from "@shared/utils/cookies.js";

export type CookieConsentStatus = "unknown" | "accepted" | "rejected";
export type CookiePromptContext = "initial" | "required" | null;

export const COOKIE_CONSENT_STORAGE_KEY = "cookie-consent";
export const LOGIN_HISTORY_COOKIE_KEY = "glancy_login_history";
const LOGIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const defaultState = {
  status: "unknown" as CookieConsentStatus,
  hasLoginCookie: false,
  promptVisible: false,
  promptContext: null as CookiePromptContext,
};

export interface CookieConsentState {
  status: CookieConsentStatus;
  hasLoginCookie: boolean;
  promptVisible: boolean;
  promptContext: CookiePromptContext;
  setPromptVisible: (
    visible: boolean,
    context?: Exclude<CookiePromptContext, null>,
  ) => void;
  acceptCookies: () => boolean;
  rejectCookies: () => void;
  requireCookieAccess: () => boolean;
  recordLoginCookie: () => boolean;
  synchronizeLoginCookie: () => boolean;
  resetConsent: () => void;
}

function normalizeContext(
  context: CookiePromptContext,
): Exclude<CookiePromptContext, null> {
  return context ?? "initial";
}

type StoreSet = SetState<CookieConsentState>;
type StoreGet = GetState<CookieConsentState>;

const createSetPromptVisible = (
  set: StoreSet,
): CookieConsentState["setPromptVisible"] =>
  (visible, context) => {
    set((state) => ({
      promptVisible: visible,
      promptContext: visible
        ? normalizeContext(context ?? state.promptContext)
        : null,
    }));
  };

const createAcceptCookies = (
  set: StoreSet,
  get: StoreGet,
): CookieConsentState["acceptCookies"] => () => {
  set({ status: "accepted", promptVisible: false, promptContext: null });
  return get().synchronizeLoginCookie();
};

const createRejectCookies = (
  set: StoreSet,
): CookieConsentState["rejectCookies"] => () => {
  deleteCookie(LOGIN_HISTORY_COOKIE_KEY);
  set({
    status: "rejected",
    hasLoginCookie: false,
    promptVisible: false,
    promptContext: null,
  });
};

const createRequireCookieAccess = (
  get: StoreGet,
): CookieConsentState["requireCookieAccess"] => () => {
  if (get().status === "accepted") {
    return true;
  }
  get().setPromptVisible(true, "required");
  return false;
};

const createRecordLoginCookie = (
  set: StoreSet,
  get: StoreGet,
): CookieConsentState["recordLoginCookie"] => () => {
  if (!get().requireCookieAccess()) {
    return false;
  }
  setCookie(LOGIN_HISTORY_COOKIE_KEY, "1", {
    maxAge: LOGIN_COOKIE_MAX_AGE,
    sameSite: "Lax",
    path: "/",
  });
  set({ hasLoginCookie: true });
  return true;
};

const createSynchronizeLoginCookie = (
  set: StoreSet,
  get: StoreGet,
): CookieConsentState["synchronizeLoginCookie"] => () => {
  if (get().status !== "accepted") {
    set({ hasLoginCookie: false });
    return false;
  }
  const hasHistory = hasCookie(LOGIN_HISTORY_COOKIE_KEY);
  set({ hasLoginCookie: hasHistory });
  return hasHistory;
};

const createResetConsent = (
  set: StoreSet,
): CookieConsentState["resetConsent"] => () => {
  deleteCookie(LOGIN_HISTORY_COOKIE_KEY);
  set({ ...defaultState });
};

const createCookieConsentHandlers = (set: StoreSet, get: StoreGet) => ({
  setPromptVisible: createSetPromptVisible(set),
  acceptCookies: createAcceptCookies(set, get),
  rejectCookies: createRejectCookies(set),
  requireCookieAccess: createRequireCookieAccess(get),
  recordLoginCookie: createRecordLoginCookie(set, get),
  synchronizeLoginCookie: createSynchronizeLoginCookie(set, get),
  resetConsent: createResetConsent(set),
});

export const useCookieConsentStore = createPersistentStore<CookieConsentState>({
  key: COOKIE_CONSENT_STORAGE_KEY,
  initializer: (set, get) => ({
    ...defaultState,
    ...createCookieConsentHandlers(set, get),
  }),
  persistOptions: {
    partialize: pickState(["status"]),
  },
});
