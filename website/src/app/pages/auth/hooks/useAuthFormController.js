import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "@core/config/api.js";
import { useUser, useLanguage } from "@core/context";
import { hydrateClientSessionState } from "@core/session/sessionLifecycle.js";
import { useCookieConsentStore } from "@core/store";
import { useApi } from "@shared/hooks/useApi.js";
import { validateAccount } from "@shared/utils/validators.js";
import {
  AUTH_CODE_PURPOSES,
  createAuthSubmissionProtocol,
} from "@shared/form/authProtocols.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";

const MODE_VIEW_COPY = {
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

const DEFAULT_ERROR_MESSAGE = "Not implemented yet";

export function useAuthFormController({ mode }) {
  const { t } = useLanguage();
  const viewCopy = useMemo(() => {
    const factory = MODE_VIEW_COPY[mode] ?? MODE_VIEW_COPY.login;
    return factory(t);
  }, [mode, t]);
  const api = useApi();
  const authProtocol = useMemo(
    () => createAuthSubmissionProtocol({ api, paths: API_PATHS }),
    [api],
  );
  const { setUser } = useUser();
  const navigate = useNavigate();
  const recordLoginCookie = useCookieConsentStore(
    (state) => state.recordLoginCookie,
  );
  const formConfig = useAuthFormConfig({
    includeUsername: viewCopy.includeUsername,
  });
  const unsupportedMessage = useMemo(
    () =>
      t.codeRequestInvalidMethod ||
      t.notImplementedYet ||
      DEFAULT_ERROR_MESSAGE,
    [t],
  );

  const completeSession = useCallback(
    async (data) => {
      setUser(data);
      recordLoginCookie();
      await hydrateClientSessionState(data);
      navigate("/");
    },
    [navigate, recordLoginCookie, setUser],
  );

  const handleSubmit = useCallback(
    async ({ account, password, method }) => {
      if (mode === "register") {
        await authProtocol.register({ method, account, password });
      }
      const data = await authProtocol.login({
        method,
        account,
        password,
        unsupportedMessage,
      });
      await completeSession(data);
    },
    [authProtocol, completeSession, mode, unsupportedMessage],
  );

  const handleRequestCode = useCallback(
    async ({ account, method }) => {
      await authProtocol.requestCode({
        method,
        account,
        purpose: viewCopy.codePurpose,
        unsupportedMessage,
      });
    },
    [authProtocol, unsupportedMessage, viewCopy.codePurpose],
  );

  return {
    formProps: {
      title: viewCopy.title,
      switchText: viewCopy.switchText,
      switchLink: viewCopy.switchLink,
      onSubmit: handleSubmit,
      placeholders: formConfig.placeholders,
      formMethods: formConfig.formMethods,
      methodOrder: formConfig.methodOrder,
      defaultMethod: formConfig.defaultMethod,
      passwordPlaceholder: viewCopy.passwordPlaceholder,
      showCodeButton: viewCopy.showCodeButton,
      validateAccount,
      otherOptionsLabel: viewCopy.otherOptionsLabel,
      onRequestCode: handleRequestCode,
    },
  };
}
