import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "@core/config/api.js";
import { useUser, useLanguage } from "@core/context";
import { hydrateClientSessionState } from "@core/session/sessionLifecycle.js";
import { useCookieConsentStore } from "@core/store";
import { useApi } from "@shared/hooks/useApi.js";
import { validateAccount } from "@shared/utils/validators.js";
import { createAuthSubmissionProtocol } from "@shared/form/authProtocols.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";
import { getAuthViewCopy } from "./viewCopyConfig.js";

const DEFAULT_ERROR_MESSAGE = "Not implemented yet";

const useAuthViewCopy = (mode, t) =>
  useMemo(() => getAuthViewCopy(mode, t), [mode, t]);

const useUnsupportedMessage = (t) =>
  useMemo(
    () =>
      t.codeRequestInvalidMethod ||
      t.notImplementedYet ||
      DEFAULT_ERROR_MESSAGE,
    [t],
  );

const useSessionCompletionCallback = ({ setUser, recordLoginCookie, navigate }) =>
  useCallback(
    async (data) => {
      setUser(data);
      recordLoginCookie();
      await hydrateClientSessionState(data);
      navigate("/");
    },
    [navigate, recordLoginCookie, setUser],
  );

const submitAuthRequest = async (
  { mode, authProtocol, unsupportedMessage, completeSession },
  { account, password, method },
) => {
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
};

const requestAuthCode = async (
  { authProtocol, unsupportedMessage, viewCopy },
  { account, method },
) => {
  await authProtocol.requestCode({
    method,
    account,
    purpose: viewCopy.codePurpose,
    unsupportedMessage,
  });
};

const useHandleSubmit = ({
  mode,
  authProtocol,
  unsupportedMessage,
  completeSession,
}) =>
  useCallback(
    async (submission) => {
      await submitAuthRequest(
        { mode, authProtocol, unsupportedMessage, completeSession },
        submission,
      );
    },
    [authProtocol, completeSession, mode, unsupportedMessage],
  );

const useHandleRequestCode = ({ authProtocol, unsupportedMessage, viewCopy }) =>
  useCallback(
    async (request) => {
      await requestAuthCode(
        { authProtocol, unsupportedMessage, viewCopy },
        request,
      );
    },
    [authProtocol, unsupportedMessage, viewCopy.codePurpose],
  );

const useAuthSubmissionHandlers = (params) => {
  const handleSubmit = useHandleSubmit(params);
  const handleRequestCode = useHandleRequestCode(params);

  return { handleSubmit, handleRequestCode };
};

const useAuthProtocol = () => {
  const api = useApi();
  return useMemo(
    () => createAuthSubmissionProtocol({ api, paths: API_PATHS }),
    [api],
  );
};

const useLoginCookieRecorder = () =>
  useCookieConsentStore((state) => state.recordLoginCookie);

const buildFormProps = ({ viewCopy, formConfig, handleSubmit, handleRequestCode }) => ({
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
});

const useAuthViewModel = (mode) => {
  const { t } = useLanguage();
  const viewCopy = useAuthViewCopy(mode, t);
  const unsupportedMessage = useUnsupportedMessage(t);
  const formConfig = useAuthFormConfig({
    includeUsername: viewCopy.includeUsername,
  });

  return { viewCopy, unsupportedMessage, formConfig };
};

const useAuthSessionCompletion = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();
  const recordLoginCookie = useLoginCookieRecorder();

  return useSessionCompletionCallback({
    setUser,
    recordLoginCookie,
    navigate,
  });
};

const useAuthSubmission = ({
  mode,
  authProtocol,
  unsupportedMessage,
  viewCopy,
}) => {
  const completeSession = useAuthSessionCompletion();

  return useAuthSubmissionHandlers({
    mode,
    authProtocol,
    unsupportedMessage,
    viewCopy,
    completeSession,
  });
};

export function useAuthFormController({ mode }) {
  const { viewCopy, unsupportedMessage, formConfig } = useAuthViewModel(mode);
  const authProtocol = useAuthProtocol();
  const { handleSubmit, handleRequestCode } = useAuthSubmission({
    mode,
    authProtocol,
    unsupportedMessage,
    viewCopy,
  });

  return {
    formProps: buildFormProps({
      viewCopy,
      formConfig,
      handleSubmit,
      handleRequestCode,
    }),
  };
}
